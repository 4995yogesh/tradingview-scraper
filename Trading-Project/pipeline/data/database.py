"""
SQLite Database Manager for OHLC Data Storage
Production-grade persistent storage with:
- Multi-symbol/timeframe support
- Batch operations for performance
- Automatic reconnection
- Data integrity checks
"""
import sqlite3
import logging
import threading
from typing import List, Dict, Optional, Tuple
from datetime import datetime
import os

logger = logging.getLogger(__name__)


class OHLCDatabase:
    """
    SQLite-based storage for OHLC candle data.
    Thread-safe with connection pooling per thread.
    """
    
    def __init__(self, db_path: str = "/app/tradingview-scraper/data/ohlc.db"):
        self.db_path = db_path
        self.local = threading.local()  # Thread-local storage for connections
        self._ensure_db_directory()
        self._create_tables()
        
    def _ensure_db_directory(self):
        """Create database directory if it doesn't exist"""
        db_dir = os.path.dirname(self.db_path)
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir, exist_ok=True)
            logger.info(f"Created database directory: {db_dir}")
    
    def _get_connection(self) -> sqlite3.Connection:
        """
        Get thread-local database connection.
        Creates new connection if needed.
        """
        if not hasattr(self.local, 'conn') or self.local.conn is None:
            self.local.conn = sqlite3.connect(
                self.db_path,
                check_same_thread=False,
                timeout=30.0
            )
            self.local.conn.row_factory = sqlite3.Row
            # Enable WAL mode for better concurrent access
            self.local.conn.execute("PRAGMA journal_mode=WAL")
            self.local.conn.execute("PRAGMA synchronous=NORMAL")
            logger.debug(f"Created new DB connection for thread {threading.current_thread().name}")
            
        return self.local.conn
    
    def _create_tables(self):
        """Create database schema if not exists"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        # Main candles table with composite unique constraint
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS candles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol TEXT NOT NULL,
                exchange TEXT NOT NULL,
                timeframe TEXT NOT NULL,
                timestamp INTEGER NOT NULL,
                open REAL NOT NULL,
                high REAL NOT NULL,
                low REAL NOT NULL,
                close REAL NOT NULL,
                volume REAL DEFAULT 0,
                created_at INTEGER DEFAULT (strftime('%s', 'now')),
                updated_at INTEGER DEFAULT (strftime('%s', 'now')),
                UNIQUE(symbol, exchange, timeframe, timestamp)
            )
        """)
        
        # Indexes for fast queries
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_symbol_timeframe_timestamp 
            ON candles(symbol, exchange, timeframe, timestamp DESC)
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_timestamp 
            ON candles(timestamp DESC)
        """)
        
        # Metadata table for tracking last update per symbol/timeframe
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS metadata (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol TEXT NOT NULL,
                exchange TEXT NOT NULL,
                timeframe TEXT NOT NULL,
                last_timestamp INTEGER,
                total_candles INTEGER DEFAULT 0,
                first_timestamp INTEGER,
                last_updated INTEGER DEFAULT (strftime('%s', 'now')),
                UNIQUE(symbol, exchange, timeframe)
            )
        """)
        
        conn.commit()
        logger.info(f"Database initialized at {self.db_path}")
    
    def insert_candle(
        self, 
        symbol: str,
        exchange: str,
        timeframe: str,
        candle: Dict
    ) -> bool:
        """
        Insert a single candle (or replace if exists).
        
        Args:
            symbol: Trading symbol (e.g., "BTCUSDT")
            exchange: Exchange name (e.g., "BINANCE")
            timeframe: Timeframe (e.g., "1m", "1h", "1d")
            candle: Candle dict with timestamp, OHLC, volume
            
        Returns:
            True if successful, False otherwise
        """
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT OR REPLACE INTO candles 
                (symbol, exchange, timeframe, timestamp, open, high, low, close, volume, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
            """, (
                symbol,
                exchange,
                timeframe,
                candle["timestamp"],
                candle["open"],
                candle["high"],
                candle["low"],
                candle["close"],
                candle.get("volume", 0)
            ))
            
            conn.commit()
            return True
            
        except sqlite3.Error as e:
            logger.error(f"Failed to insert candle: {e}")
            return False
    
    def insert_candles_batch(
        self,
        symbol: str,
        exchange: str,
        timeframe: str,
        candles: List[Dict]
    ) -> int:
        """
        Batch insert candles for performance.
        Uses INSERT OR REPLACE to handle duplicates.
        
        Args:
            symbol: Trading symbol
            exchange: Exchange name
            timeframe: Timeframe
            candles: List of candle dicts
            
        Returns:
            Number of candles inserted/updated
        """
        if not candles:
            return 0
            
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            # Prepare batch data
            batch_data = [
                (
                    symbol,
                    exchange,
                    timeframe,
                    c["timestamp"],
                    c["open"],
                    c["high"],
                    c["low"],
                    c["close"],
                    c.get("volume", 0)
                )
                for c in candles
            ]
            
            cursor.executemany("""
                INSERT OR REPLACE INTO candles 
                (symbol, exchange, timeframe, timestamp, open, high, low, close, volume, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
            """, batch_data)
            
            conn.commit()
            
            # Update metadata
            self._update_metadata(symbol, exchange, timeframe)
            
            logger.info(f"Batch inserted {len(candles)} candles for {exchange}:{symbol} {timeframe}")
            return len(candles)
            
        except sqlite3.Error as e:
            logger.error(f"Failed to batch insert candles: {e}")
            conn.rollback()
            return 0
    
    def get_candles(
        self,
        symbol: str,
        exchange: str,
        timeframe: str,
        limit: int = 100,
        start_timestamp: Optional[int] = None,
        end_timestamp: Optional[int] = None
    ) -> List[Dict]:
        """
        Retrieve candles from database.
        
        Args:
            symbol: Trading symbol
            exchange: Exchange name
            timeframe: Timeframe
            limit: Maximum number of candles to return
            start_timestamp: Optional start time filter
            end_timestamp: Optional end time filter
            
        Returns:
            List of candle dicts sorted by timestamp (ascending)
        """
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            query = """
                SELECT timestamp, open, high, low, close, volume
                FROM candles
                WHERE symbol = ? AND exchange = ? AND timeframe = ?
            """
            params = [symbol, exchange, timeframe]
            
            if start_timestamp:
                query += " AND timestamp >= ?"
                params.append(start_timestamp)
                
            if end_timestamp:
                query += " AND timestamp <= ?"
                params.append(end_timestamp)
                
            query += " ORDER BY timestamp DESC LIMIT ?"
            params.append(limit)
            
            cursor.execute(query, params)
            rows = cursor.fetchall()
            
            # Convert to dicts and reverse to get ascending order
            candles = [
                {
                    "timestamp": row["timestamp"],
                    "open": row["open"],
                    "high": row["high"],
                    "low": row["low"],
                    "close": row["close"],
                    "volume": row["volume"]
                }
                for row in reversed(rows)
            ]
            
            return candles
            
        except sqlite3.Error as e:
            logger.error(f"Failed to retrieve candles: {e}")
            return []
    
    def get_last_timestamp(
        self,
        symbol: str,
        exchange: str,
        timeframe: str
    ) -> Optional[int]:
        """
        Get the timestamp of the most recent candle.
        Used for resuming data collection after disconnect.
        
        Args:
            symbol: Trading symbol
            exchange: Exchange name
            timeframe: Timeframe
            
        Returns:
            Last timestamp or None if no data exists
        """
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT MAX(timestamp) as last_ts
                FROM candles
                WHERE symbol = ? AND exchange = ? AND timeframe = ?
            """, (symbol, exchange, timeframe))
            
            row = cursor.fetchone()
            return row["last_ts"] if row and row["last_ts"] else None
            
        except sqlite3.Error as e:
            logger.error(f"Failed to get last timestamp: {e}")
            return None
    
    def get_candle_count(
        self,
        symbol: str,
        exchange: str,
        timeframe: str
    ) -> int:
        """Get total number of candles stored for symbol/timeframe"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT COUNT(*) as count
                FROM candles
                WHERE symbol = ? AND exchange = ? AND timeframe = ?
            """, (symbol, exchange, timeframe))
            
            row = cursor.fetchone()
            return row["count"] if row else 0
            
        except sqlite3.Error as e:
            logger.error(f"Failed to get candle count: {e}")
            return 0
    
    def _update_metadata(
        self,
        symbol: str,
        exchange: str,
        timeframe: str
    ):
        """Update metadata table with latest statistics"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            # Get statistics
            cursor.execute("""
                SELECT 
                    COUNT(*) as total,
                    MIN(timestamp) as first_ts,
                    MAX(timestamp) as last_ts
                FROM candles
                WHERE symbol = ? AND exchange = ? AND timeframe = ?
            """, (symbol, exchange, timeframe))
            
            stats = cursor.fetchone()
            
            if stats:
                cursor.execute("""
                    INSERT OR REPLACE INTO metadata
                    (symbol, exchange, timeframe, total_candles, first_timestamp, last_timestamp, last_updated)
                    VALUES (?, ?, ?, ?, ?, ?, strftime('%s', 'now'))
                """, (
                    symbol,
                    exchange,
                    timeframe,
                    stats["total"],
                    stats["first_ts"],
                    stats["last_ts"]
                ))
                
                conn.commit()
                
        except sqlite3.Error as e:
            logger.error(f"Failed to update metadata: {e}")
    
    def export_to_json(
        self,
        symbol: str,
        exchange: str,
        timeframe: str,
        limit: int = 100,
        output_file: Optional[str] = None
    ) -> str:
        """
        Export candles to JSON format for verification.
        
        Args:
            symbol: Trading symbol
            exchange: Exchange name
            timeframe: Timeframe
            limit: Number of candles to export
            output_file: Optional output file path
            
        Returns:
            JSON string of candles
        """
        import json
        
        candles = self.get_candles(symbol, exchange, timeframe, limit)
        
        export_data = {
            "symbol": symbol,
            "exchange": exchange,
            "timeframe": timeframe,
            "count": len(candles),
            "exported_at": datetime.now().isoformat(),
            "candles": candles
        }
        
        json_str = json.dumps(export_data, indent=2)
        
        if output_file:
            with open(output_file, 'w') as f:
                f.write(json_str)
            logger.info(f"Exported {len(candles)} candles to {output_file}")
            
        return json_str
    
    def get_statistics(self) -> Dict:
        """Get overall database statistics"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            # Total candles
            cursor.execute("SELECT COUNT(*) as total FROM candles")
            total = cursor.fetchone()["total"]
            
            # Symbols count
            cursor.execute("SELECT COUNT(DISTINCT symbol || exchange || timeframe) as symbols FROM candles")
            symbols = cursor.fetchone()["symbols"]
            
            # Date range
            cursor.execute("SELECT MIN(timestamp) as first, MAX(timestamp) as last FROM candles")
            date_range = cursor.fetchone()
            
            return {
                "total_candles": total,
                "unique_series": symbols,
                "first_timestamp": date_range["first"],
                "last_timestamp": date_range["last"],
                "database_path": self.db_path
            }
            
        except sqlite3.Error as e:
            logger.error(f"Failed to get statistics: {e}")
            return {}
    
    def close(self):
        """Close database connection"""
        if hasattr(self.local, 'conn') and self.local.conn:
            self.local.conn.close()
            self.local.conn = None
            logger.info("Database connection closed")


# Singleton database instance
db = OHLCDatabase()
