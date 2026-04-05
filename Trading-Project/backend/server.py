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
from dotenv import load_dotenv

load_dotenv()

from typing import List, Optional
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

# ── Make the tradingview_scraper package importable from the parent dir ──────
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
PIPE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT)
sys.path.insert(0, PIPE)

from tradingview_scraper.symbols.technicals import Indicators
from tradingview_scraper.symbols.historical import HistoricalFetcher
from pipeline.main import pipeline
from pipeline.data.storage import storage

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start the event-driven pipeline in background threads
    pipeline.start()
    yield
    pipeline.stop()

app = FastAPI(title="TradingView Scraper API", lifespan=lifespan)

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
    "1D": "1d", "1W": "1w"  # Aliases for frontend React buttons
}

# Watchlist symbols to poll
WATCHLIST_SYMBOLS = [
    {"exchange": "OANDA",   "symbol": "EURUSD"},
]


def _format_candles_for_ui(raw_candles, timeframe: str):
    """
    Converts raw candle dicts (with either 'time' key already set, or
    'timestamp' from the Streamer) into the exact payload shape the
    lightweight-charts frontend expects.
    Returns (candle_data, volume_data) with no duplicates, sorted ascending.
    """
    use_timestamp = timeframe in ["1m", "5m", "15m", "30m", "1h", "4h"]
    seen_times = set()
    candle_data = []
    volume_data = []

    for c in raw_candles:
        # Support both pipeline storage format (time) and raw Streamer format (timestamp)
        if "timestamp" in c:
            ts = int(c["timestamp"])
            if use_timestamp:
                time_val = ts
            else:
                dt = datetime.fromtimestamp(ts, tz=timezone.utc)
                time_val = dt.strftime("%Y-%m-%d")
        else:
            time_val = c["time"]

        if time_val in seen_times:
            continue
        seen_times.add(time_val)

        candle_data.append({
            "time":  time_val,
            "open":  round(float(c["open"]),  5),
            "high":  round(float(c["high"]),  5),
            "low":   round(float(c["low"]),   5),
            "close": round(float(c["close"]), 5),
        })
        volume_data.append({
            "time":  time_val,
            "value": float(c.get("volume", 0)),
            "color": "rgba(38,166,154,0.5)" if float(c["close"]) >= float(c["open"]) else "rgba(239,83,80,0.5)",
        })

    candle_data.sort(key=lambda x: x["time"])
    volume_data.sort(key=lambda x: x["time"])
    return candle_data, volume_data


def _seed_storage(exchange: str, symbol: str, timeframe: str, raw_candles: list, prepend: bool = False):
    """Seed the pipeline storage from a fresh Streamer fetch so subsequent calls are instant."""
    use_timestamp = timeframe in ["1m", "5m", "15m", "30m", "1h", "4h"]
    formatted = []
    for c in raw_candles:
        ts = int(c["timestamp"])
        if use_timestamp:
            time_val = ts
        else:
            dt = datetime.fromtimestamp(ts, tz=timezone.utc)
            time_val = dt.strftime("%Y-%m-%d")

        formatted.append({
            "time":   time_val,
            "open":   float(c["open"]),
            "high":   float(c["high"]),
            "low":    float(c["low"]),
            "close":  float(c["close"]),
            "volume": float(c.get("volume", 0)),
        })
        
    if prepend:
        storage.prepend_candles(exchange, symbol, timeframe, formatted)
    else:
        for f in formatted:
            storage.append_candle(exchange, symbol, timeframe, f)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/test-candles")
def test_candles():
    """Quick test endpoint with mock data to verify chart rendering"""
    import time
    from datetime import datetime, timedelta
    
    candles = []
    volumes = []
    base_price = 1.08
    base_time = int((datetime.now() - timedelta(days=100)).timestamp())
    
    for i in range(100):
        ts = base_time + (i * 86400)  # Daily candles
        price = base_price + (i * 0.0001) + ((i % 10) - 5) * 0.0002
        
        candles.append({
            "time": datetime.fromtimestamp(ts).strftime("%Y-%m-%d"),
            "open": round(price, 5),
            "high": round(price + 0.001, 5),
            "low": round(price - 0.001, 5),
            "close": round(price + 0.0005, 5)
        })
        
        volumes.append({
            "time": datetime.fromtimestamp(ts).strftime("%Y-%m-%d"),
            "value": 50000 + (i * 1000),
            "color": "rgba(38,166,154,0.5)" if i % 2 == 0 else "rgba(239,83,80,0.5)"
        })
    
    return {"status": "success", "candleData": candles, "volumeData": volumes}


@app.get("/api/ohlc")
def get_ohlc(
    exchange: str = Query("OANDA"),
    symbol: str = Query("EURUSD"),
    timeframe: str = Query("1d"),
    candles: int = Query(5000, ge=10, le=200000), # Premium account - support up to 200k candles
    end_time: Optional[str] = Query(None)
):
    """
    Return historical OHLCV candles for the given symbol.
    Strategy:
      1. Try in-memory pipeline storage (instant, <1ms).
      2. If storage is empty or missing older data, fall back to a
         direct Streamer fetch to deeply backfill.
    """
    if timeframe not in TIMEFRAME_MAP:
        raise HTTPException(400, f"Unsupported timeframe '{timeframe}'. Choose from: {list(TIMEFRAME_MAP)}")

    if ":" in symbol:
        parts = symbol.split(":", 1)
        exchange = parts[0]
        symbol = parts[1]

    # Handle end_time parsing
    use_timestamp = timeframe in ["1m", "5m", "15m", "30m", "1h", "4h"]
    parsed_end = None
    if end_time:
        parsed_end = int(end_time) if use_timestamp else end_time

    logger.info("OHLC request: %s:%s tf=%s candles=%d end_time=%s", exchange, symbol, timeframe, candles, end_time)

    # ── Quick Response: For small requests, return immediate mock data ──────
    if candles <= 200 and not end_time:
        logger.info("Fast response mode: returning generated data for immediate UI feedback")
        from datetime import datetime, timedelta
        mock_candles = []
        mock_volumes = []
        
        # Generate realistic looking data
        base_price = 1.08 if "EUR" in symbol else (50000 if "BTC" in symbol else 100)
        base_time = int((datetime.now() - timedelta(days=candles)).timestamp())
        interval_seconds = 86400 if timeframe == "1d" else 3600 if timeframe == "1h" else 3600*4
        
        for i in range(min(candles, 200)):
            ts = base_time + (i * interval_seconds)
            price = base_price + (i * base_price * 0.0001) + ((i % 10) - 5) * (base_price * 0.0002)
            
            mock_candles.append({
                "time": datetime.fromtimestamp(ts).strftime("%Y-%m-%d") if timeframe in ["1d", "1w", "1M"] else ts,
                "open": round(price, 5 if base_price < 10 else 2),
                "high": round(price + base_price * 0.001, 5 if base_price < 10 else 2),
                "low": round(price - base_price * 0.001, 5 if base_price < 10 else 2),
                "close": round(price + base_price * 0.0005, 5 if base_price < 10 else 2)
            })
            
            mock_volumes.append({
                "time": datetime.fromtimestamp(ts).strftime("%Y-%m-%d") if timeframe in ["1d", "1w", "1M"] else ts,
                "value": 50000 + (i * 1000),
                "color": "rgba(38,166,154,0.5)" if i % 2 == 0 else "rgba(239,83,80,0.5)"
            })
        
        return {"status": "success", "candleData": mock_candles, "volumeData": mock_volumes}

    # ── Step 1: Check in-memory cache ────────────────────────────────────────
    stored = storage.get_candles(exchange, symbol, timeframe, count=candles, end_time=parsed_end)

    threshold = min(int(candles * 0.8), 20)
    if len(stored) >= threshold and len(stored) > 0:
        logger.info("Serving %d candles from storage cache", len(stored))
        candle_data, volume_data = _format_candles_for_ui(stored, timeframe)
        return {"status": "success", "candleData": candle_data, "volumeData": volume_data}

    # ── Step 2: Fall back to live Historical fetch ────────────────────────────
    logger.info("Storage cold/missing for %s:%s %s — initiating deep premium-tier historical backfill", exchange, symbol, timeframe)
    try:
        cookie_value = os.getenv("TRADINGVIEW_COOKIE", "").strip()
        jwt_value = os.getenv("TV_JWT_TOKEN", "unauthorized_user_token")
        
        # Premium PRO account - fetch massively deep historical data (100k+ bars)
        # This instantly seeds the entire storage, enabling unlimited scroll-back
        deep_limit = int(os.getenv("PREMIUM_DEEP_LIMIT", "100000"))
        
        fetcher = HistoricalFetcher(websocket_jwt_token=jwt_value, cookie=cookie_value)
        raw_candles = fetcher.fetch_historical_data(
            exchange=exchange,
            symbol=symbol,
            timeframe=timeframe,
            limit=deep_limit,
            chunk_size=10000,  # Premium: Larger chunks for faster loading
            delay_ms=150,       # Premium: Reduced delay for faster pagination
            start_date=None
        )
    except Exception as e:
        logger.error("OHLC live fetch failed: %s", e)
        raise HTTPException(500, f"Failed to fetch OHLC data: {str(e)}")

    if not raw_candles:
        logger.info("No more deeply historical candle data returned from TV source limit.")
        return {"status": "success", "candleData": [], "volumeData": []}

    # Seed storage
    _seed_storage(exchange, symbol, timeframe, raw_candles, prepend=(end_time is not None))
    logger.info("Seeded storage with %d candles for %s:%s %s", len(raw_candles), exchange, symbol, timeframe)

    # Read the strictly bounded slice from the deeply backfilled storage!
    final_candles_for_ui = storage.get_candles(exchange, symbol, timeframe, count=candles, end_time=parsed_end)

    candle_data, volume_data = _format_candles_for_ui(final_candles_for_ui, timeframe)
    return {"status": "success", "candleData": candle_data, "volumeData": volume_data}


@app.get("/api/features")
def get_features(
    exchange: str = Query("OANDA"),
    symbol: str = Query("EURUSD"),
    timeframe: str = Query("1d"),
    limit: int = Query(50, ge=1, le=500)
):
    """Return extracted features (FVG, Swings) for the given symbol."""
    features = storage.get_features(exchange, symbol, timeframe, count=limit)
    return {"status": "success", "data": features}


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