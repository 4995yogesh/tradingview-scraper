#!/usr/bin/env python3
"""
OHLC Data Pipeline CLI
Command-line interface for running and managing the TradingView OHLC database pipeline
"""
import sys
import os
import argparse
import logging
import asyncio
import time
from datetime import datetime

# Add parent directories to path
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "."))
PIPELINE = os.path.abspath(os.path.join(os.path.dirname(__file__), "Trading-Project"))
sys.path.insert(0, ROOT)
sys.path.insert(0, PIPELINE)

from tradingview_scraper.symbols.stream.streamer import Streamer
from pipeline.data.database import db
from pipeline.data.parser import parser


def setup_logging(verbose: bool = False):
    """Setup logging configuration"""
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )


def run_collection(
    symbol: str,
    exchange: str = "BINANCE",
    timeframe: str = "1m",
    duration: int = 60
):
    """
    Run live data collection for specified duration.
    
    Args:
        symbol: Trading symbol (e.g., BTCUSDT)
        exchange: Exchange name (e.g., BINANCE)
        timeframe: Timeframe (e.g., 1m, 1h, 1d)
        duration: Collection duration in seconds
    """
    logger = logging.getLogger(__name__)
    
    logger.info(f"🚀 Starting data collection for {exchange}:{symbol} on {timeframe}")
    logger.info(f"⏱️  Duration: {duration} seconds")
    
    # Check last timestamp to resume
    last_ts = db.get_last_timestamp(symbol, exchange, timeframe)
    if last_ts:
        last_dt = datetime.fromtimestamp(last_ts)
        logger.info(f"📊 Resuming from last timestamp: {last_dt}")
    else:
        logger.info(f"📊 Starting fresh data collection (no existing data)")
    
    try:
        # Initialize streamer
        streamer = Streamer(export_result=False)
        
        # Add symbol to session
        full_symbol = f"{exchange}:{symbol}"
        streamer._add_symbol_to_sessions(
            streamer.stream_obj.quote_session,
            streamer.stream_obj.chart_session,
            full_symbol,
            timeframe,
            numb_candles=100  # Get initial historical context
        )
        
        start_time = time.time()
        candle_count = 0
        last_log_time = start_time
        
        logger.info(f"✅ Connected to TradingView WebSocket")
        
        # Stream data
        for packet in streamer.get_data():
            # Check duration
            elapsed = time.time() - start_time
            if elapsed >= duration:
                logger.info(f"⏱️  Duration reached ({duration}s). Stopping collection.")
                break
            
            # Extract OHLC using existing streamer method
            ohlc_data = streamer._extract_ohlc_from_stream(packet)
            
            if ohlc_data:
                # Convert to database format
                candles = []
                for entry in ohlc_data:
                    candle = {
                        "timestamp": int(entry["timestamp"]),
                        "open": float(entry["open"]),
                        "high": float(entry["high"]),
                        "low": float(entry["low"]),
                        "close": float(entry["close"]),
                        "volume": float(entry.get("volume", 0))
                    }
                    
                    # Validate
                    if parser.validate_candle(candle):
                        candles.append(candle)
                
                if candles:
                    # Store in database
                    count = db.insert_candles_batch(
                        symbol, exchange, timeframe, candles
                    )
                    candle_count += count
                    
                    # Log progress every 10 seconds
                    if time.time() - last_log_time >= 10:
                        logger.info(f"📈 Collected {candle_count} candles so far...")
                        last_log_time = time.time()
        
        # Final statistics
        total_stored = db.get_candle_count(symbol, exchange, timeframe)
        last_ts = db.get_last_timestamp(symbol, exchange, timeframe)
        
        logger.info(f"\n{'='*60}")
        logger.info(f"✅ Collection completed!")
        logger.info(f"📊 Candles collected this session: {candle_count}")
        logger.info(f"💾 Total candles in database: {total_stored}")
        if last_ts:
            logger.info(f"🕐 Latest timestamp: {datetime.fromtimestamp(last_ts)}")
        logger.info(f"{'='*60}\n")
        
    except KeyboardInterrupt:
        logger.info("\n⚠️  Collection interrupted by user")
    except Exception as e:
        logger.error(f"❌ Error during collection: {e}", exc_info=True)


def export_data(
    symbol: str,
    exchange: str = "BINANCE",
    timeframe: str = "1m",
    limit: int = 100,
    output_file: str = None
):
    """
    Export candles to JSON file.
    
    Args:
        symbol: Trading symbol
        exchange: Exchange name
        timeframe: Timeframe
        limit: Number of candles to export
        output_file: Output file path
    """
    logger = logging.getLogger(__name__)
    
    if not output_file:
        output_file = f"{exchange}_{symbol}_{timeframe}_last{limit}.json"
    
    logger.info(f"📤 Exporting last {limit} candles for {exchange}:{symbol} {timeframe}")
    
    json_str = db.export_to_json(symbol, exchange, timeframe, limit, output_file)
    
    logger.info(f"✅ Exported to {output_file}")
    print(f"\n{json_str[:500]}...\n")  # Preview


def show_stats():
    """Display database statistics"""
    logger = logging.getLogger(__name__)
    
    stats = db.get_statistics()
    
    print(f"\n{'='*60}")
    print(f"📊 OHLC DATABASE STATISTICS")
    print(f"{'='*60}")
    print(f"Database Path: {stats.get('database_path')}")
    print(f"Total Candles: {stats.get('total_candles', 0):,}")
    print(f"Unique Series: {stats.get('unique_series', 0)}")
    
    if stats.get('first_timestamp'):
        first_dt = datetime.fromtimestamp(stats['first_timestamp'])
        last_dt = datetime.fromtimestamp(stats['last_timestamp'])
        print(f"Date Range: {first_dt} → {last_dt}")
        
    print(f"{'='*60}\n")


def query_candles(
    symbol: str,
    exchange: str = "BINANCE",
    timeframe: str = "1m",
    limit: int = 10
):
    """
    Query and display candles from database.
    
    Args:
        symbol: Trading symbol
        exchange: Exchange name
        timeframe: Timeframe
        limit: Number of candles to display
    """
    logger = logging.getLogger(__name__)
    
    logger.info(f"🔍 Querying last {limit} candles for {exchange}:{symbol} {timeframe}")
    
    candles = db.get_candles(symbol, exchange, timeframe, limit)
    
    if not candles:
        logger.warning(f"❌ No candles found for {exchange}:{symbol} {timeframe}")
        return
    
    print(f"\n{'='*80}")
    print(f"📊 {exchange}:{symbol} - {timeframe} - Last {len(candles)} Candles")
    print(f"{'='*80}")
    print(f"{'Timestamp':<20} {'Open':>10} {'High':>10} {'Low':>10} {'Close':>10} {'Volume':>15}")
    print(f"{'-'*80}")
    
    for c in candles:
        dt = datetime.fromtimestamp(c['timestamp']).strftime('%Y-%m-%d %H:%M:%S')
        print(f"{dt:<20} {c['open']:>10.5f} {c['high']:>10.5f} {c['low']:>10.5f} {c['close']:>10.5f} {c['volume']:>15.2f}")
    
    print(f"{'='*80}\n")


def main():
    """Main CLI entry point"""
    parser_cli = argparse.ArgumentParser(
        description="TradingView OHLC Data Pipeline CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Collect live data for 60 seconds
  python ohlc_cli.py collect --symbol BTCUSDT --exchange BINANCE --timeframe 1m --duration 60
  
  # Export last 100 candles to JSON
  python ohlc_cli.py export --symbol BTCUSDT --limit 100
  
  # Show database statistics
  python ohlc_cli.py stats
  
  # Query and display candles
  python ohlc_cli.py query --symbol BTCUSDT --limit 10
        """
    )
    
    parser_cli.add_argument('-v', '--verbose', action='store_true', help='Enable verbose logging')
    
    subparsers = parser_cli.add_subparsers(dest='command', help='Command to execute')
    
    # Collect command
    collect_parser = subparsers.add_parser('collect', help='Collect live data from TradingView')
    collect_parser.add_argument('--symbol', required=True, help='Trading symbol (e.g., BTCUSDT)')
    collect_parser.add_argument('--exchange', default='BINANCE', help='Exchange name (default: BINANCE)')
    collect_parser.add_argument('--timeframe', default='1m', help='Timeframe (default: 1m)')
    collect_parser.add_argument('--duration', type=int, default=60, help='Collection duration in seconds (default: 60)')
    
    # Export command
    export_parser = subparsers.add_parser('export', help='Export candles to JSON')
    export_parser.add_argument('--symbol', required=True, help='Trading symbol')
    export_parser.add_argument('--exchange', default='BINANCE', help='Exchange name')
    export_parser.add_argument('--timeframe', default='1m', help='Timeframe')
    export_parser.add_argument('--limit', type=int, default=100, help='Number of candles (default: 100)')
    export_parser.add_argument('--output', help='Output file path')
    
    # Stats command
    stats_parser = subparsers.add_parser('stats', help='Show database statistics')
    
    # Query command
    query_parser = subparsers.add_parser('query', help='Query and display candles')
    query_parser.add_argument('--symbol', required=True, help='Trading symbol')
    query_parser.add_argument('--exchange', default='BINANCE', help='Exchange name')
    query_parser.add_argument('--timeframe', default='1m', help='Timeframe')
    query_parser.add_argument('--limit', type=int, default=10, help='Number of candles (default: 10)')
    
    args = parser_cli.parse_args()
    
    setup_logging(args.verbose)
    
    if not args.command:
        parser_cli.print_help()
        sys.exit(1)
    
    # Execute command
    if args.command == 'collect':
        run_collection(
            args.symbol,
            args.exchange,
            args.timeframe,
            args.duration
        )
    elif args.command == 'export':
        export_data(
            args.symbol,
            args.exchange,
            args.timeframe,
            args.limit,
            args.output
        )
    elif args.command == 'stats':
        show_stats()
    elif args.command == 'query':
        query_candles(
            args.symbol,
            args.exchange,
            args.timeframe,
            args.limit
        )


if __name__ == "__main__":
    main()
