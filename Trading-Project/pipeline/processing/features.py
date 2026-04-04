import logging
from typing import Dict, List
from pipeline.core.engine import engine

logger = logging.getLogger(__name__)

class FeatureExtractor:
    """
    Subscribes to VALIDATED_CANDLE. 
    Maintains a rolling window of 3 candles to calculate Fair Value Gaps (FVG) and Swing Points.
    Emits NEW_FEATURE events when found.
    """
    def __init__(self):
        # Format: self.windows[exchange][symbol][timeframe] = []
        self.windows: Dict[str, Dict[str, Dict[str, List[dict]]]] = {}
        # Track emitted features to prevent rapid duplicate spam on every live tick
        self.emitted_hashes = []

    def _ensure_path(self, exchange: str, symbol: str, timeframe: str):
        if exchange not in self.windows:
            self.windows[exchange] = {}
        if symbol not in self.windows[exchange]:
            self.windows[exchange][symbol] = {}
        if timeframe not in self.windows[exchange][symbol]:
            self.windows[exchange][symbol][timeframe] = []

    async def on_validated_candle(self, event_type: str, data: dict):
        exchange = data["exchange"]
        symbol = data["symbol"]
        timeframe = data["timeframe"]
        candle = data["candle"]
        
        self._ensure_path(exchange, symbol, timeframe)
        window = self.windows[exchange][symbol][timeframe]
        
        # Update window
        if len(window) > 0 and window[-1]["time"] == candle["time"]:
            window[-1] = candle
        else:
            window.append(candle)
            
        if len(window) > 3:
            window.pop(0)
            
        if len(window) == 3:
            await self._detect_fvg(exchange, symbol, timeframe, window)
            await self._detect_swing(exchange, symbol, timeframe, window)

    async def _detect_fvg(self, exchange: str, symbol: str, timeframe: str, window: List[dict]):
        # Bullish FVG: candle 1 high < candle 3 low
        c1, c2, c3 = window
        
        features = []
        if c1["high"] < c3["low"]:
            features.append({
                "type": "FVG_BULLISH",
                "top": c3["low"],
                "bottom": c1["high"],
                "time": c2["time"]
            })
        # Bearish FVG: candle 1 low > candle 3 high
        elif c1["low"] > c3["high"]:
            features.append({
                "type": "FVG_BEARISH",
                "top": c1["low"],
                "bottom": c3["high"],
                "time": c2["time"]
            })
            
        for f in features:
            f_hash = f"{exchange}:{symbol}:{timeframe}:{f['type']}:{f['time']}"
            if f_hash in self.emitted_hashes:
                continue
                
            # Track newly emitted and bound cache
            self.emitted_hashes.append(f_hash)
            if len(self.emitted_hashes) > 1000:
                self.emitted_hashes.pop(0)

            payload = {
                "exchange": exchange,
                "symbol": symbol,
                "timeframe": timeframe,
                "feature": f
            }
            await engine.emit("NEW_FEATURE", payload)

    async def _detect_swing(self, exchange: str, symbol: str, timeframe: str, window: List[dict]):
        c1, c2, c3 = window
        
        features = []
        # Swing High
        if c2["high"] > c1["high"] and c2["high"] > c3["high"]:
            features.append({
                "type": "SWING_HIGH",
                "price": c2["high"],
                "time": c2["time"]
            })
        # Swing Low
        elif c2["low"] < c1["low"] and c2["low"] < c3["low"]:
            features.append({
                "type": "SWING_LOW",
                "price": c2["low"],
                "time": c2["time"]
            })
            
        for f in features:
            f_hash = f"{exchange}:{symbol}:{timeframe}:{f['type']}:{f['time']}"
            if f_hash in self.emitted_hashes:
                continue
                
            self.emitted_hashes.append(f_hash)
            if len(self.emitted_hashes) > 1000:
                self.emitted_hashes.pop(0)

            payload = {
                "exchange": exchange,
                "symbol": symbol,
                "timeframe": timeframe,
                "feature": f
            }
            await engine.emit("NEW_FEATURE", payload)

extractor = FeatureExtractor()
engine.subscribe("VALIDATED_CANDLE", extractor.on_validated_candle)
