import logging
from typing import Dict
from pipeline.core.engine import engine

logger = logging.getLogger(__name__)

class DataValidator:
    """
    Subscribes to RAW_CANDLE events, validates data integrity,
    handles missing or duplicate entries, and emits VALIDATED_CANDLE.
    """
    def __init__(self):
        # Track last timestamp per symbol per timeframe
        self.last_timestamps: Dict[str, float] = {}

    async def on_raw_candle(self, event_type: str, data: dict):
        """
        data expected format:
        {
            "exchange": "OANDA",
            "symbol": "EURUSD",
            "timeframe": "1m",
            "candle": {
                "time": 1690000000,
                "open": 1.1, "high": 1.1, "low": 1.1, "close": 1.1, "volume": 100
            }
        }
        """
        try:
            exchange = data["exchange"]
            symbol = data["symbol"]
            timeframe = data["timeframe"]
            candle = data["candle"]

            key = f"{exchange}:{symbol}:{timeframe}"
            
            # Basic validation
            if candle["high"] < candle["low"]:
                logger.warning(f"Invalid candle logic for {key}: High < Low")
                return
            
            last_time = self.last_timestamps.get(key, 0)
            target_time = candle["time"]

            # Format strictly for the UI requirement:
            # We enforce standard keys.
            valid_packet = {
                "exchange": exchange,
                "symbol": symbol,
                "timeframe": timeframe,
                "candle": {
                    "time": target_time,
                    "open": float(candle["open"]),
                    "high": float(candle["high"]),
                    "low": float(candle["low"]),
                    "close": float(candle["close"]),
                    "volume": float(candle.get("volume", 0))
                }
            }

            if target_time < last_time:
                # Old tick, discard
                return
                
            self.last_timestamps[key] = target_time
            await engine.emit("VALIDATED_CANDLE", valid_packet)

        except Exception as e:
            logger.error(f"Validator error: {e}", exc_info=True)

validator = DataValidator()
engine.subscribe("RAW_CANDLE", validator.on_raw_candle)
