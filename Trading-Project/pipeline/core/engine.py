import asyncio
import logging
from typing import Callable, Dict, List, Any

logger = logging.getLogger(__name__)

class EventEngine:
    """
    A simple pub/sub Event Engine for the trading pipeline.
    Allows decoupling of different pipeline stages.
    """
    
    def __init__(self):
        # event_name -> list of sync/async callables
        self.subscribers: Dict[str, List[Callable]] = {}
        
    def subscribe(self, event_type: str, callback: Callable):
        if event_type not in self.subscribers:
            self.subscribers[event_type] = []
        if callback not in self.subscribers[event_type]:
            self.subscribers[event_type].append(callback)
            logger.debug(f"Subscribed {callback.__name__} to '{event_type}'")

    async def emit(self, event_type: str, data: Any):
        """
        Emits an event to all subscribers asynchronously.
        """
        if event_type not in self.subscribers:
            return
            
        callbacks = self.subscribers[event_type]
        for callback in callbacks:
            try:
                if asyncio.iscoroutinefunction(callback):
                    await callback(event_type, data)
                else:
                    callback(event_type, data)
            except Exception as e:
                logger.error(f"Error executing callback {callback.__name__} for event '{event_type}': {e}")

# Global singleton event engine
engine = EventEngine()
