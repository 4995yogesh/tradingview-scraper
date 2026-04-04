import os
from typing import List
from dotenv import load_dotenv

load_dotenv()

class Config:
    def __init__(self):
        # Timeframes to monitor
        self.BASE_TIMEFRAME = os.getenv("BASE_TIMEFRAME", "1m")
        self.MTF_TIMEFRAMES = os.getenv("MTF_TIMEFRAMES", "5m,15m,1h,4h").split(",")
        
        # Ring buffer sizes - Increase to 50000 to hold max history safely for charts
        self.STORAGE_CANDLE_LIMIT = int(os.getenv("STORAGE_CANDLE_LIMIT", 50000))
        
        # Redis / DB configs could be added here
        
        # Watchlist
        # If WATCHLIST_SYMBOLS is in .env, parse it; otherwise use defaults
        wl_env = os.getenv("WATCHLIST_SYMBOLS", "")
        if wl_env:
            # Expecting format OANDA:EURUSD,BINANCE:BTCUSDT
            symbols = wl_env.split(",")
            self.WATCHLIST_SYMBOLS = [{"exchange": s.split(":")[0], "symbol": s.split(":")[1]} for s in symbols if ":" in s]
        else:
            self.WATCHLIST_SYMBOLS = [
                {"exchange": "OANDA",   "symbol": "EURUSD"},
                {"exchange": "OANDA",   "symbol": "GBPUSD"},
                {"exchange": "OANDA",   "symbol": "USDJPY"},
                {"exchange": "BINANCE", "symbol": "BTCUSDT"}
            ]

config = Config()
