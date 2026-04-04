import sys
import os
import logging
from datetime import datetime

# Add the parent directory to the path so we can import tradingview_scraper
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from tradingview_scraper.symbols.historical import HistoricalFetcher

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def main():
    """
    Example demonstrating how to pull massive datasets from TradingView.
    We will fetch 15,000 candles of EURUSD on the 5-minute timeframe.
    """
    fetcher = HistoricalFetcher()
    
    symbol = "EURUSD"
    exchange = "OANDA"
    timeframe = "5m"
    max_candles = 15000
    
    print(f"Starting pagination fetch for {exchange}:{symbol} ({max_candles} candles on {timeframe})...")
    start_time = datetime.now()
    
    data = fetcher.fetch_historical_data(
        exchange=exchange,
        symbol=symbol,
        timeframe=timeframe,
        limit=max_candles,
        chunk_size=5000,
        delay_ms=500  # sleep slightly between loops to avoid hard rate limit
    )
    
    duration = (datetime.now() - start_time).total_seconds()
    
    if data:
        oldest_dt = datetime.fromtimestamp(data[0]['timestamp'])
        newest_dt = datetime.fromtimestamp(data[-1]['timestamp'])
        print(f"\n✅ Successfully fetched {len(data)} candles in {duration:.2f} seconds!")
        print(f"Data ranges from {oldest_dt} to {newest_dt}")
        
        # Example of saving to a local JSON file
        output_file = f"{exchange}_{symbol}_{timeframe}_{len(data)}.json"
        import json
        with open(output_file, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"Saved to {output_file}")
    else:
        print("\n❌ Failed to fetch data.")

if __name__ == "__main__":
    main()
