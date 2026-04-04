import asyncio
import logging
import threading
import time
import sys
import os

# Ensure tradingview_scraper is importable via backend path tricks
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
sys.path.insert(0, ROOT)

from tradingview_scraper.symbols.stream.streamer import Streamer
from pipeline.core.engine import engine
from pipeline.config import config
from pipeline.data.storage import storage
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class DataCollector:
    """
    Continuous WebSocket listener for multiple symbols.
    Emits raw candle data into the Event Engine for downstream processing.
    Streams are staggered on startup to avoid flooding the TradingView endpoint.
    """
    def __init__(self):
        self._running = False
        self._loop = None

    def _stream_task(self, exchange: str, symbol: str, timeframe: str):
        """Runs the streaming generator in a synchronous thread loop with auto-reconnect."""
        logger.info(f"[Collector] Starting stream for {exchange}:{symbol} on {timeframe}")
        
        while self._running:
            try:
                streamer = Streamer(export_result=False)
                streamer._add_symbol_to_sessions(
                    streamer.stream_obj.quote_session,
                    streamer.stream_obj.chart_session,
                    f"{exchange}:{symbol}",
                    timeframe,
                    numb_candles=50  # seed with basic 50 candles for continuity
                )

                for pkt in streamer.get_data():
                    if not self._running:
                        break
                    
                    ohlc_data = streamer._extract_ohlc_from_stream(pkt)
                    if ohlc_data:
                        for entry in ohlc_data:
                            ts = entry["timestamp"]
                            
                            if timeframe in ["1m", "5m", "15m", "30m", "1h", "4h"]:
                                time_val = int(ts)
                            else:
                                dt = datetime.fromtimestamp(ts, tz=timezone.utc)
                                time_val = dt.strftime("%Y-%m-%d")

                            raw_candle = {
                                "time":   time_val,
                                "open":   entry["open"],
                                "high":   entry["high"],
                                "low":    entry["low"],
                                "close":  entry["close"],
                                "volume": entry.get("volume", 0)
                            }
                            
                            payload = {
                                "exchange": exchange,
                                "symbol":   symbol,
                                "timeframe": timeframe,
                                "candle":   raw_candle
                            }
                            
                            if self._loop and self._loop.is_running():
                                asyncio.run_coroutine_threadsafe(
                                    engine.emit("RAW_CANDLE", payload), 
                                    self._loop
                                )
                                
            except Exception as e:
                if self._running:
                    logger.error(f"[Collector] Streamer error for {exchange}:{symbol}: {e}. Reconnecting in 10s...")
                    time.sleep(10)

    def start(self, loop: asyncio.AbstractEventLoop):
        self._running = True
        self._loop = loop
        
        # Stagger each collector by 3 seconds to avoid simultaneous WS connections
        # that would compete with the /api/ohlc fallback fetches.
        def _launch_staggered():
            for i, item in enumerate(config.WATCHLIST_SYMBOLS):
                if not self._running:
                    break
                if i > 0:
                    time.sleep(3)  # 3s gap between each connection
                t = threading.Thread(
                    target=self._stream_task, 
                    args=(item["exchange"], item["symbol"], config.BASE_TIMEFRAME),
                    daemon=True,
                    name=f"collector-{item['symbol']}"
                )
                t.start()
                logger.info(f"[Collector] Launched thread for {item['symbol']} (slot {i})")

        # Run the staggered launch in its own thread so startup isn't blocked
        launcher = threading.Thread(target=_launch_staggered, daemon=True, name="collector-launcher")
        launcher.start()

    def stop(self):
        logger.info("[Collector] Stopping all stream threads...")
        self._running = False

collector = DataCollector()
