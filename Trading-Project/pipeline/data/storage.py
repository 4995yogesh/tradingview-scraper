import threading
from collections import deque
from typing import Dict, List, Optional
from pipeline.config import config
from pipeline.core.engine import engine

class DataStorage:
    """
    In-memory storage for raw and derived candles.
    Thread-safe implementation for fast API access.
    """
    def __init__(self):
        # Format: self.candles[exchange][symbol][timeframe] = deque()
        self.candles: Dict[str, Dict[str, Dict[str, deque]]] = {}
        # Format: self.features[exchange][symbol][timeframe] = deque()
        self.features: Dict[str, Dict[str, Dict[str, deque]]] = {}
        self.lock = threading.RLock()

    def _ensure_paths(self, exchange: str, symbol: str, timeframe: str):
        if exchange not in self.candles:
            self.candles[exchange] = {}
            self.features[exchange] = {}
        if symbol not in self.candles[exchange]:
            self.candles[exchange][symbol] = {}
            self.features[exchange][symbol] = {}
        if timeframe not in self.candles[exchange][symbol]:
            self.candles[exchange][symbol][timeframe] = deque(maxlen=config.STORAGE_CANDLE_LIMIT)
            self.features[exchange][symbol][timeframe] = deque(maxlen=500)

    def append_candle(self, exchange: str, symbol: str, timeframe: str, candle: dict):
        """Append or update a candle based on timestamp."""
        with self.lock:
            self._ensure_paths(exchange, symbol, timeframe)
            dq = self.candles[exchange][symbol][timeframe]
            
            # Simple deduplication / update latest
            if len(dq) > 0:
                last_candle = dq[-1]
                if last_candle["time"] == candle["time"]:
                    # Update existing
                    dq[-1] = candle
                    return
                elif candle["time"] < last_candle["time"]:
                    # Out of order, handled by validator, ignore here for now
                    pass
                else:
                    dq.append(candle)
            else:
                dq.append(candle)

    def get_candles(self, exchange: str, symbol: str, timeframe: str, count: int = 100) -> List[dict]:
        """Fetch the last 'count' candles."""
        with self.lock:
            try:
                dq = self.candles[exchange][symbol][timeframe]
                return list(dq)[-count:]
            except KeyError:
                return []

    def get_features(self, exchange: str, symbol: str, timeframe: str, count: int = 100) -> List[dict]:
        with self.lock:
            try:
                dq = self.features[exchange][symbol][timeframe]
                return list(dq)[-count:]
            except KeyError:
                return []

    async def on_validated_candle(self, event_type: str, data: dict):
        self.append_candle(data["exchange"], data["symbol"], data["timeframe"], data["candle"])

    async def on_new_feature(self, event_type: str, data: dict):
        with self.lock:
            self._ensure_paths(data["exchange"], data["symbol"], data["timeframe"])
            self.features[data["exchange"]][data["symbol"]][data["timeframe"]].append(data["feature"])

# Singleton storage instance
storage = DataStorage()
engine.subscribe("VALIDATED_CANDLE", storage.on_validated_candle)
engine.subscribe("NEW_FEATURE", storage.on_new_feature)

