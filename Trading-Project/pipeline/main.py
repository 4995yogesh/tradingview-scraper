import asyncio
import logging
from pipeline.core.engine import engine
from pipeline.data.collector import collector

# Import these so they register their subscriptions
import pipeline.data.validator
import pipeline.data.storage
import pipeline.processing.aggregator
import pipeline.processing.features

logger = logging.getLogger(__name__)

class Pipeline:
    """Orchestrates the entire Trading Data Pipeline."""
    
    def __init__(self):
        self.loop = None
        self.running = False
        
    def start(self):
        if self.running:
            return
            
        logger.info("Starting Pipeline...")
        self.running = True
        
        # Ensure we have an event loop
        try:
            self.loop = asyncio.get_event_loop()
        except RuntimeError:
            self.loop = asyncio.new_event_loop()
            asyncio.set_event_loop(self.loop)

        # Start data collectors (they run in background threads but need the loop for emitting events)
        collector.start(self.loop)
        logger.info("Pipeline running.")

    def stop(self):
        logger.info("Stopping Pipeline...")
        collector.stop()
        self.running = False
        
pipeline = Pipeline()
