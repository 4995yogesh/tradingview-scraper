"""
OHLC Data Parser for TradingView WebSocket Messages
Extracts and structures candle data from raw WebSocket streams
"""
import json
import logging
import re
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)


class OHLCParser:
    """
    Parses raw TradingView WebSocket messages and extracts OHLC candle data.
    Handles:
    - Initial historical batch (full dataset)
    - Incremental updates (partial candle updates)
    - Message format validation
    """
    
    def __init__(self):
        self.last_candle_timestamps = {}  # Track last candle per symbol to detect updates
        
    def parse_message(self, raw_message: str) -> Optional[Dict]:
        """
        Parse a raw WebSocket message and extract relevant data.
        
        Args:
            raw_message: Raw string message from WebSocket
            
        Returns:
            Parsed message dict or None if not parseable
        """
        # Handle heartbeat messages (ignore)
        if re.match(r"~m~\d+~m~~h~\d+$", raw_message):
            return None
            
        # Split multi-message format: ~m~<len>~m~<json>
        split_result = [x for x in re.split(r'~m~\d+~m~', raw_message) if x]
        
        for item in split_result:
            try:
                data = json.loads(item)
                return data
            except json.JSONDecodeError:
                continue
                
        return None
    
    def extract_ohlc_candles(
        self, 
        message: Dict, 
        symbol_key: str = "sds_1"
    ) -> List[Dict]:
        """
        Extract OHLC candles from a timescale_update message.
        
        Args:
            message: Parsed WebSocket message
            symbol_key: Series identifier (e.g., "sds_1")
            
        Returns:
            List of structured candle dicts with format:
            {
                "timestamp": int,
                "open": float,
                "high": float,
                "low": float,
                "close": float,
                "volume": float (optional)
            }
        """
        candles = []
        
        # Check if this is a timescale_update message
        if message.get("m") != "timescale_update":
            return candles
            
        try:
            # Navigate the nested structure: p[1][symbol_key]["s"]
            payload = message.get("p", [{}, {}])
            if len(payload) < 2:
                return candles
                
            series_data = payload[1].get(symbol_key, {}).get("s", [])
            
            if not series_data:
                logger.debug("No series data in timescale_update")
                return candles
                
            for entry in series_data:
                # Each entry has format: {"i": index, "v": [ts, o, h, l, c, vol]}
                candle_values = entry.get("v", [])
                
                if len(candle_values) < 5:
                    logger.warning(f"Incomplete candle data: {candle_values}")
                    continue
                    
                # Extract OHLC data
                candle = {
                    "timestamp": int(candle_values[0]),
                    "open": float(candle_values[1]),
                    "high": float(candle_values[2]),
                    "low": float(candle_values[3]),
                    "close": float(candle_values[4]),
                }
                
                # Volume is optional (might not exist for all symbols)
                if len(candle_values) > 5:
                    candle["volume"] = float(candle_values[5])
                else:
                    candle["volume"] = 0.0
                    
                candles.append(candle)
                
            logger.debug(f"Extracted {len(candles)} candles from timescale_update")
            
        except Exception as e:
            logger.error(f"Error extracting OHLC candles: {e}")
            
        return candles
    
    def validate_candle(self, candle: Dict) -> bool:
        """
        Validate candle data integrity.
        
        Args:
            candle: Candle dict to validate
            
        Returns:
            True if candle is valid, False otherwise
        """
        required_fields = ["timestamp", "open", "high", "low", "close"]
        
        # Check all required fields exist
        for field in required_fields:
            if field not in candle:
                logger.warning(f"Missing required field: {field}")
                return False
                
        # Validate OHLC logic (high >= low, etc.)
        try:
            if candle["high"] < candle["low"]:
                logger.warning(f"Invalid candle: high < low at {candle['timestamp']}")
                return False
                
            if candle["high"] < candle["open"] or candle["high"] < candle["close"]:
                logger.warning(f"Invalid candle: high below open/close at {candle['timestamp']}")
                return False
                
            if candle["low"] > candle["open"] or candle["low"] > candle["close"]:
                logger.warning(f"Invalid candle: low above open/close at {candle['timestamp']}")
                return False
                
        except (TypeError, ValueError) as e:
            logger.warning(f"Invalid candle values: {e}")
            return False
            
        return True
    
    def deduplicate_candles(self, candles: List[Dict]) -> List[Dict]:
        """
        Remove duplicate candles based on timestamp.
        Keeps the latest version if duplicates exist.
        
        Args:
            candles: List of candles (potentially with duplicates)
            
        Returns:
            Deduplicated list sorted by timestamp
        """
        candle_map = {}
        
        for candle in candles:
            ts = candle["timestamp"]
            candle_map[ts] = candle  # Later entries override earlier ones
            
        # Sort by timestamp (ascending)
        sorted_candles = [candle_map[ts] for ts in sorted(candle_map.keys())]
        
        return sorted_candles
    
    def is_incremental_update(
        self, 
        candle: Dict, 
        symbol: str
    ) -> bool:
        """
        Determine if this candle is an update to the last candle.
        
        Args:
            candle: New candle data
            symbol: Symbol identifier
            
        Returns:
            True if this updates the last candle, False if it's a new candle
        """
        ts = candle["timestamp"]
        last_ts = self.last_candle_timestamps.get(symbol)
        
        if last_ts is None:
            self.last_candle_timestamps[symbol] = ts
            return False
            
        if ts == last_ts:
            # Same timestamp = update existing candle
            return True
        elif ts > last_ts:
            # New timestamp = new candle
            self.last_candle_timestamps[symbol] = ts
            return False
        else:
            # Older timestamp = historical backfill
            return False


# Singleton parser instance
parser = OHLCParser()
