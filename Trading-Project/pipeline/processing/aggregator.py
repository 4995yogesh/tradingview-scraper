import logging
from typing import Dict
from datetime import datetime, timezone
from pipeline.core.engine import engine
from pipeline.config import config

logger = logging.getLogger(__name__)

class DataAggregator:
    """
    Subscribes to VALIDATED_CANDLE events on the base timeframe (e.g., 1m).
    Aggregates them into higher timeframes (5m, 15m, 1h, etc.) incrementally.
    """
    
    def __init__(self):
        # State of current building candles
        # Format: self.current_candles[tf][exchange][symbol] = candle_dict
        self.current_candles: Dict[str, Dict[str, Dict[str, dict]]] = {}
        for tf in config.MTF_TIMEFRAMES:
            self.current_candles[tf] = {}

    def _get_tf_minutes(self, timeframe: str) -> int:
        if timeframe.endswith('m'):
            return int(timeframe[:-1])
        elif timeframe.endswith('h'):
            return int(timeframe[:-1]) * 60
        elif timeframe.endswith('d'):
            return int(timeframe[:-1]) * 60 * 24
        return 0

    def _get_candle_start_time(self, ts: float, timeframe: str) -> float:
        """Calculate the boundary start time for a given timestamp and TF."""
        minutes = self._get_tf_minutes(timeframe)
        if minutes == 0:
            return ts
        
        # This assumes timestamps are purely multiples of seconds for basic timeframes.
        # It's an approximation. Let's use modulus.
        seconds = minutes * 60
        
        if isinstance(ts, str):
            # If TV gives us a string "YYYY-MM-DD", aggregation is not natively supported here
            return ts
            
        try:
            ts_int = int(ts)
            return float(ts_int - (ts_int % seconds))
        except (ValueError, TypeError):
            return ts

    async def on_validated_candle(self, event_type: str, data: dict):
        base_candle = data["candle"]
        exchange = data["exchange"]
        symbol = data["symbol"]
        base_tf = data["timeframe"]

        if base_tf != config.BASE_TIMEFRAME:
            return # Only build up from base timeframe
            
        base_time = base_candle["time"]
        if isinstance(base_time, str):
            # Aggregation for daily/weekly strings is not implemented in this minimal version
            return

        for tf in config.MTF_TIMEFRAMES:
            if exchange not in self.current_candles[tf]:
                self.current_candles[tf][exchange] = {}
                
            boundary_time = self._get_candle_start_time(base_time, tf)
            current = self.current_candles[tf][exchange].get(symbol)
            
            if not current or current["time"] != boundary_time:
                # Close the old one and emit
                if current:
                    payload = {
                        "exchange": exchange,
                        "symbol": symbol,
                        "timeframe": tf,
                        "candle": current
                    }
                    await engine.emit("VALIDATED_CANDLE", payload) # Re-emit as a completed MTF candle

                # Start new
                current = {
                    "time": boundary_time,
                    "open": base_candle["open"],
                    "high": base_candle["high"],
                    "low": base_candle["low"],
                    "close": base_candle["close"],
                    "volume": base_candle.get("volume", 0)
                }
            else:
                # Update current
                current["high"] = max(current["high"], base_candle["high"])
                current["low"] = min(current["low"], base_candle["low"])
                current["close"] = base_candle["close"]
                current["volume"] += base_candle.get("volume", 0)
                
            self.current_candles[tf][exchange][symbol] = current
            
            # Emit the IN-PROGRESS MTF candle as well, so storage is always up to date
            in_progress_payload = {
                "exchange": exchange,
                "symbol": symbol,
                "timeframe": tf,
                "candle": current
            }
            await engine.emit("VALIDATED_CANDLE", in_progress_payload)

aggregator = DataAggregator()
engine.subscribe("VALIDATED_CANDLE", aggregator.on_validated_candle)
