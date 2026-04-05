"""
Database Integration Module
Connects the OHLC parser and database to the existing event-driven pipeline
"""
import logging
from pipeline.core.engine import engine
from pipeline.data.parser import parser
from pipeline.data.database import db

logger = logging.getLogger(__name__)


class DatabaseIntegration:
    """
    Bridges the existing pipeline with persistent database storage.
    Subscribes to candle events and stores them in SQLite.
    """
    
    def __init__(self):
        self.batch_buffer = {}  # Buffer for batch inserts: {(exchange, symbol, tf): [candles]}
        self.batch_size = 100   # Insert every N candles for performance
        
    async def on_validated_candle(self, event_type: str, data: dict):
        """
        Handle validated candle events from the pipeline.
        Store candles in database with batching for performance.
        
        Args:
            event_type: Event name ("VALIDATED_CANDLE")
            data: Event data with exchange, symbol, timeframe, candle
        """
        exchange = data["exchange"]
        symbol = data["symbol"]
        timeframe = data["timeframe"]
        candle = data["candle"]
        
        # Convert pipeline format to database format
        db_candle = self._convert_pipeline_to_db_format(candle, timeframe)
        
        # Validate candle before storing
        if not parser.validate_candle(db_candle):
            logger.warning(f"Invalid candle skipped: {exchange}:{symbol} {timeframe} @ {db_candle.get('timestamp')}")
            return
        
        # Add to batch buffer
        key = (exchange, symbol, timeframe)
        if key not in self.batch_buffer:
            self.batch_buffer[key] = []
            
        self.batch_buffer[key].append(db_candle)
        
        # Flush batch if size reached
        if len(self.batch_buffer[key]) >= self.batch_size:
            await self._flush_batch(exchange, symbol, timeframe)
            
    async def on_raw_candle(self, event_type: str, data: dict):
        """
        Handle raw candle events and store directly to database.
        This captures real-time data as it arrives.
        
        Args:
            event_type: Event name ("RAW_CANDLE")
            data: Event data with exchange, symbol, timeframe, candle
        """
        exchange = data["exchange"]
        symbol = data["symbol"]
        timeframe = data["timeframe"]
        candle = data["candle"]
        
        # Convert and validate
        db_candle = self._convert_pipeline_to_db_format(candle, timeframe)
        
        if not parser.validate_candle(db_candle):
            return
            
        # Direct insert for real-time data (don't batch to avoid lag)
        success = db.insert_candle(exchange, symbol, timeframe, db_candle)
        
        if success:
            logger.debug(f"Stored real-time candle: {exchange}:{symbol} {timeframe} @ {db_candle['timestamp']}")
            
    def _convert_pipeline_to_db_format(self, candle: dict, timeframe: str) -> dict:
        """
        Convert pipeline candle format to database format.
        
        Pipeline uses "time" key which can be either:
        - Unix timestamp (int) for intraday timeframes
        - Date string (YYYY-MM-DD) for daily+ timeframes
        
        Database always uses Unix timestamp (int)
        
        Args:
            candle: Candle dict from pipeline
            timeframe: Timeframe string
            
        Returns:
            Candle dict with timestamp (int)
        """
        from datetime import datetime, timezone
        
        time_val = candle.get("time")
        
        # If already a timestamp
        if isinstance(time_val, int):
            timestamp = time_val
        # If date string, convert to timestamp
        elif isinstance(time_val, str):
            try:
                dt = datetime.strptime(time_val, "%Y-%m-%d").replace(tzinfo=timezone.utc)
                timestamp = int(dt.timestamp())
            except ValueError:
                # Try as timestamp string
                timestamp = int(time_val)
        else:
            logger.error(f"Unknown time format: {time_val}")
            timestamp = int(datetime.now().timestamp())
            
        return {
            "timestamp": timestamp,
            "open": float(candle["open"]),
            "high": float(candle["high"]),
            "low": float(candle["low"]),
            "close": float(candle["close"]),
            "volume": float(candle.get("volume", 0))
        }
    
    async def _flush_batch(self, exchange: str, symbol: str, timeframe: str):
        """
        Flush batch buffer to database.
        
        Args:
            exchange: Exchange name
            symbol: Symbol
            timeframe: Timeframe
        """
        key = (exchange, symbol, timeframe)
        candles = self.batch_buffer.get(key, [])
        
        if not candles:
            return
            
        # Deduplicate before inserting
        candles = parser.deduplicate_candles(candles)
        
        # Batch insert
        count = db.insert_candles_batch(exchange, symbol, timeframe, candles)
        
        if count > 0:
            logger.info(f"Flushed {count} candles to database: {exchange}:{symbol} {timeframe}")
            
        # Clear buffer
        self.batch_buffer[key] = []
    
    async def flush_all_batches(self):
        """Flush all pending batches to database"""
        for (exchange, symbol, timeframe), candles in list(self.batch_buffer.items()):
            if candles:
                await self._flush_batch(exchange, symbol, timeframe)
                
    def get_resume_timestamp(self, exchange: str, symbol: str, timeframe: str) -> int:
        """
        Get the last stored timestamp for a symbol/timeframe.
        Used to resume data collection after disconnect.
        
        Args:
            exchange: Exchange name
            symbol: Symbol
            timeframe: Timeframe
            
        Returns:
            Last timestamp or 0 if no data
        """
        last_ts = db.get_last_timestamp(symbol, exchange, timeframe)
        return last_ts if last_ts else 0


# Singleton integration instance
db_integration = DatabaseIntegration()

# Subscribe to pipeline events
engine.subscribe("VALIDATED_CANDLE", db_integration.on_validated_candle)
engine.subscribe("RAW_CANDLE", db_integration.on_raw_candle)

logger.info("Database integration initialized and subscribed to pipeline events")
