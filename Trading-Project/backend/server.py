"""
FastAPI backend that serves live market data from tradingview-scraper.
Endpoints:
  GET /api/ohlc?exchange=OANDA&symbol=EURUSD&timeframe=1d&candles=100
  GET /api/indicators?exchange=OANDA&symbol=EURUSD&timeframe=1d&indicators=RSI,Stoch.K
  GET /api/watchlist
"""

import sys
import os
import logging
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

# ── Make the tradingview_scraper package importable from the parent dir ──────
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
sys.path.insert(0, ROOT)

from tradingview_scraper.symbols.technicals import Indicators
from tradingview_scraper.symbols.stream.streamer import Streamer

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="TradingView Scraper API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Timeframe mapping (TV scraper → display) ─────────────────────────────────
TIMEFRAME_MAP = {
    "1m": "1m", "5m": "5m", "15m": "15m", "30m": "30m",
    "1h": "1h", "4h": "4h", "1d": "1d", "1w": "1w", "1M": "1M",
}

# Watchlist symbols to poll
WATCHLIST_SYMBOLS = [
    {"exchange": "OANDA",   "symbol": "EURUSD"},
    {"exchange": "OANDA",   "symbol": "GBPUSD"},
    {"exchange": "OANDA",   "symbol": "USDJPY"},
    {"exchange": "OANDA",   "symbol": "AUDUSD"},
    {"exchange": "OANDA",   "symbol": "USDCAD"},
    {"exchange": "OANDA",   "symbol": "USDCHF"},
    {"exchange": "BINANCE", "symbol": "BTCUSDT"},
    {"exchange": "BINANCE", "symbol": "ETHUSDT"},
    {"exchange": "OANDA",   "symbol": "XAUUSD"},
]


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/ohlc")
def get_ohlc(
    exchange: str = Query("OANDA"),
    symbol: str = Query("EURUSD"),
    timeframe: str = Query("1d"),
    candles: int = Query(100, ge=10, le=2000),
):
    """Return historical OHLCV candles for the given symbol."""
    if timeframe not in TIMEFRAME_MAP:
        raise HTTPException(400, f"Unsupported timeframe '{timeframe}'. Choose from: {list(TIMEFRAME_MAP)}")

    logger.info("OHLC request: %s:%s tf=%s candles=%d", exchange, symbol, timeframe, candles)
    try:
        streamer = Streamer(export_result=True, export_type="json")
        data = streamer.stream(
            exchange=exchange,
            symbol=symbol,
            timeframe=timeframe,
            numb_price_candles=candles,
        )
        raw_candles = data.get("ohlc", [])
    except Exception as e:
        logger.error("OHLC fetch failed: %s", e)
        raise HTTPException(500, f"Failed to fetch OHLC data: {str(e)}")

    use_timestamp = timeframe in ["1m", "5m", "15m", "30m", "1h", "4h"]

    candle_data = []
    volume_data = []
    
    # Handle duplicates if scraper returns them - to be completely safe
    seen_times = set()
    
    for c in raw_candles:
        ts = int(c["timestamp"])
        
        if use_timestamp:
            time_val = ts
        else:
            from datetime import datetime, timezone
            dt = datetime.fromtimestamp(ts, tz=timezone.utc)
            time_val = dt.strftime("%Y-%m-%d")

        if time_val in seen_times:
            continue
        seen_times.add(time_val)

        candle_data.append({
            "time": time_val,
            "open":  round(c["open"],  5),
            "high":  round(c["high"],  5),
            "low":   round(c["low"],   5),
            "close": round(c["close"], 5),
        })
        volume_data.append({
            "time":  time_val,
            "value": c.get("volume", 0),
            "color": "rgba(38,166,154,0.5)" if c["close"] >= c["open"] else "rgba(239,83,80,0.5)",
        })

    # Ensure items are strictly ascending as required by lightweight-charts
    candle_data.sort(key=lambda x: x["time"])
    volume_data.sort(key=lambda x: x["time"])

    # Final pass to ensure NO duplicates at all (strictly ascending)
    def filter_duplicates(data):
        if not data: return []
        unique = [data[0]]
        for i in range(1, len(data)):
            if data[i]["time"] != data[i-1]["time"]:
                unique.append(data[i])
        return unique

    final_candles = filter_duplicates(candle_data)
    final_volumes = filter_duplicates(volume_data)

    return {"status": "success", "candleData": final_candles, "volumeData": final_volumes}


@app.get("/api/indicators")
def get_indicators(
    exchange: str = Query("OANDA"),
    symbol: str = Query("EURUSD"),
    timeframe: str = Query("1d"),
    indicators: str = Query("RSI,Stoch.K"),
):
    """Return current indicator values for the given symbol."""
    ind_list = [i.strip() for i in indicators.split(",") if i.strip()]
    logger.info("Indicator request: %s:%s tf=%s inds=%s", exchange, symbol, timeframe, ind_list)
    try:
        scraper = Indicators()
        result = scraper.scrape(
            exchange=exchange,
            symbol=symbol,
            timeframe=timeframe,
            indicators=ind_list,
        )
        return result
    except Exception as e:
        logger.error("Indicator fetch failed: %s", e)
        raise HTTPException(500, f"Failed to fetch indicators: {str(e)}")


@app.get("/api/watchlist")
def get_watchlist():
    """Return live price snapshot for the predefined watchlist symbols."""
    results = []
    ind_scraper = Indicators()
    for item in WATCHLIST_SYMBOLS:
        exchange, symbol = item["exchange"], item["symbol"]
        try:
            resp = ind_scraper.scrape(
                exchange=exchange,
                symbol=symbol,
                timeframe="1d",
                indicators=["close", "open", "change", "Perf.W"],
            )
            data = resp.get("data", {})
            close = data.get("close", 0)
            open_ = data.get("open", close)
            change = data.get("change", 0)
            perf_w = data.get("Perf.W", 0)
            results.append({
                "exchange": exchange,
                "symbol":   symbol,
                "price":    round(close, 5),
                "open":     round(open_, 5),
                "change":   round(change, 5),
                "changePct": round(perf_w, 2),
                "isUp":     change >= 0,
            })
        except Exception as e:
            logger.warning("Watchlist fetch failed for %s:%s — %s", exchange, symbol, e)
            results.append({
                "exchange": exchange,
                "symbol":   symbol,
                "price":    0,
                "open":     0,
                "change":   0,
                "changePct": 0,
                "isUp":     True,
                "error":    str(e),
            })

    return {"status": "success", "data": results}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)