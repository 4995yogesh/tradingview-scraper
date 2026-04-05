import re
import json
import logging
import sys
from time import sleep
from datetime import datetime, timezone
from typing import Optional, Union, List

from websocket import WebSocketConnectionClosedException, WebSocketTimeoutException

from tradingview_scraper.symbols.stream import StreamHandler
from tradingview_scraper.symbols.stream.utils import validate_symbols
from tradingview_scraper.symbols.exceptions import DataNotFoundError

logger = logging.getLogger(__name__)

class HistoricalFetcher:
    """
    A class to handle bulk historical data fetching from TradingView via WebSocket pagination.
    Extracts tens of thousands of candles by repeatedly requesting chunks backward in time.
    """

    def __init__(self, websocket_jwt_token: str = "unauthorized_user_token", cookie: str = None):
        self.ws_url = "wss://data.tradingview.com/socket.io/websocket?from=chart%2FVEPYsueI%2F&type=chart"
        self.jwt_token = websocket_jwt_token
        self.cookie = cookie
        self.stream_obj = None

    def fetch_historical_data(
        self,
        exchange: str,
        symbol: str,
        timeframe: str = '1m',
        limit: Optional[int] = 10000,
        start_date: Optional[Union[str, datetime]] = None,
        chunk_size: int = 5000,
        delay_ms: int = 200
    ) -> List[dict]:
        """
        Fetches historical OHLC data with pagination.

        Args:
            exchange: The exchange to fetch data from (e.g., "OANDA").
            symbol: The symbol to fetch data for (e.g., "EURUSD").
            timeframe: The timeframe for the data (e.g., '1m', '1h', '1d').
            limit: Maximum total candles to fetch. If start_date is used, this can be None.
            start_date: Fetch backward until this date is reached (str 'YYYY-MM-DD' or datetime).
            chunk_size: Number of candles to request per pagination call (max usually ~5000).
            delay_ms: Sleep delay between pagination requests to avoid rate limits.

        Returns:
            List[dict]: Deduplicated, chronologically sorted list of OHLC candles.
        """
        exchange_symbol = f"{exchange}:{symbol}"
        validate_symbols(exchange_symbol)

        # Convert start_date to a unix timestamp for easier comparison
        target_timestamp = 0
        if start_date:
            if isinstance(start_date, str):
                dt = datetime.strptime(start_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
                target_timestamp = int(dt.timestamp())
            elif isinstance(start_date, datetime):
                if start_date.tzinfo is None:
                    start_date = start_date.replace(tzinfo=timezone.utc)
                target_timestamp = int(start_date.timestamp())

        # If neither limit nor start_date is set, fallback to a sensible default limit
        if not limit and not target_timestamp:
            limit = 5000

        self.stream_obj = StreamHandler(websocket_url=self.ws_url, jwt_token=self.jwt_token, cookie=self.cookie)

        timeframe_map = {
            '1m': '1', '5m': '5', '15m': '15', '30m': '30',
            '1h': '60', '2h': '120', '4h': '240',
            '1d': '1D', '1w': '1W', '1M': '1M'
        }
        tf_str = timeframe_map.get(timeframe, "1")

        resolve_msg = json.dumps({"adjustment": "splits", "symbol": exchange_symbol})
        
        # Initialize connection and session
        self.stream_obj.send_message("quote_add_symbols", [self.stream_obj.quote_session, f"={resolve_msg}"])
        self.stream_obj.send_message("resolve_symbol", [self.stream_obj.chart_session, "sds_sym_1", f"={resolve_msg}"])
        self.stream_obj.send_message("create_series", [
            self.stream_obj.chart_session, 
            "sds_1", "s1", "sds_sym_1", 
            tf_str, chunk_size, ""
        ])

        # A dict ensures we overwrite duplicates with the exact same timestamp
        all_candles_map = {}
        oldest_ts_seen = float('inf')
        
        # Pagination state
        consecutive_empty_responses = 0

        logger.info(f"Starting historical fetch for {exchange_symbol} | TF: {timeframe} | Limit: {limit} | Start: {start_date}")

        try:
            # Set a timeout so we don't hang forever if TV stops responding to pagination requests
            self.stream_obj.ws.settimeout(10.0)

            while True:
                try:
                    res = self.stream_obj.ws.recv()
                except WebSocketTimeoutException:
                    logger.info("WebSocket timeout reached. TV has likely stopped sending historical data. Returning collected data.")
                    return self._format_and_sort(all_candles_map)
                
                # Handle heartbeat
                if re.match(r"~m~\d+~m~~h~\d+$", res):
                    self.stream_obj.ws.send(res)
                    continue
                
                # Parse messages
                split_result = [x for x in re.split(r'~m~\d+~m~', res) if x]
                for item in split_result:
                    try:
                        data = json.loads(item)
                    except json.JSONDecodeError:
                        continue
                    
                    if data.get("m") == "timescale_update":
                        series = data.get("p", [{}, {}])[1].get("sds_1", {}).get("s", [])
                        
                        if not series:
                            consecutive_empty_responses += 1
                            if consecutive_empty_responses >= 3:
                                logger.info("Max backfill reached (No more old data on TV servers).")
                                return self._format_and_sort(all_candles_map)
                            continue
                            
                        consecutive_empty_responses = 0
                        candles_added_this_batch = 0
                        local_oldest_ts = float('inf')

                        for entry in series:
                            # v = [timestamp, open, high, low, close, volume]
                            v = entry.get('v', [])
                            if len(v) >= 5:
                                ts = v[0]
                                local_oldest_ts = min(local_oldest_ts, ts)
                                
                                # Process candle
                                candle = {
                                    'timestamp': ts,
                                    'open': v[1],
                                    'high': v[2],
                                    'low': v[3],
                                    'close': v[4]
                                }
                                if len(v) > 5:
                                    candle['volume'] = v[5]

                                if ts not in all_candles_map:
                                    all_candles_map[ts] = candle
                                    candles_added_this_batch += 1

                        total_candles = len(all_candles_map)
                        logger.info(f"Chunk received: {len(series)} points. Total unqiue candles: {total_candles}")

                        if candles_added_this_batch == 0:
                            # The chunk contained only candles we already have (we've hit the absolute genesis block)
                            logger.info("Genesis block reached (No new unique timestamps added).")
                            return self._format_and_sort(all_candles_map)

                        oldest_ts_seen = local_oldest_ts

                        # Check Stop Conditions
                        # 1. Start date condition reached
                        if target_timestamp > 0 and oldest_ts_seen <= target_timestamp:
                            logger.info(f"Target start_date reached (Oldest parsed: {oldest_ts_seen}).")
                            return self._format_and_sort(all_candles_map, target_timestamp)
                        
                        # 2. Limit condition reached
                        if limit and total_candles >= limit:
                            logger.info(f"Candle limit of {limit} reached.")
                            return self._format_and_sort(all_candles_map)

                        # Request next batch backward in time
                        if delay_ms > 0:
                            sleep(delay_ms / 1000.0)

                        self.stream_obj.send_message("request_more_data", [
                            self.stream_obj.chart_session, 
                            "sds_1", 
                            chunk_size
                        ])

        except WebSocketConnectionClosedException:
            logger.error("WebSocket connection closed prematurely.")
        except Exception as e:
            logger.error(f"Error during historical fetch: {e}")
        finally:
            self.stream_obj.ws.close()

        return self._format_and_sort(all_candles_map)

    def _format_and_sort(self, candles_map: dict, min_timestamp: int = 0) -> List[dict]:
        """
        Sorts the hashed map chronologically and trims to the requested date if necessary.
        """
        sorted_timestamps = sorted(candles_map.keys())
        final_list = []
        
        for ts in sorted_timestamps:
            if ts >= min_timestamp:
                final_list.append(candles_map[ts])
                
        # Identify small data gaps (Integrity check)
        if len(final_list) > 1:
            interval = final_list[1]['timestamp'] - final_list[0]['timestamp']
            gaps = 0
            for i in range(1, len(final_list)):
                diff = final_list[i]['timestamp'] - final_list[i-1]['timestamp']
                # If timezone/weekend skips exist this will falsely trigger for 1D,
                # but it safely logs anomaly thresholds for intraday
                if diff > interval * 5: 
                    gaps += 1
            if gaps > 0:
                logger.debug(f"Integrity Note: Found ~{gaps} temporal gaps in the series (often just weekends/holidays).")

        return final_list
