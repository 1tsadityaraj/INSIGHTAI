
from typing import Optional, Any
from app.core.redis_client import redis_client
from app.utils.logger import logger
import json

class CacheService:
    def __init__(self):
        self.redis = redis_client

    async def get(self, key: str) -> Optional[Any]:
        if not self.redis:
            return None
        try:
            data = await self.redis.get(key)
            if data:
                return json.loads(data)
            return None
        except Exception as e:
            logger.error(f"Redis GET Error ({key}): {e}")
            return None

    async def set(self, key: str, value: Any, ttl: int = 300) -> bool:
        """
        Set key with TTL (default 5 mins)
        """
        if not self.redis:
            return False
        try:
            # Handle Pydantic models automatically
            if hasattr(value, 'model_dump'):
                payload = value.model_dump_json()
            elif hasattr(value, 'dict'):
                payload = json.dumps(value.dict())
            else:
                payload = json.dumps(value)
                
            await self.redis.set(key, payload, ex=ttl)
            return True
        except Exception as e:
            logger.error(f"Redis SET Error ({key}): {e}")
            return False

    async def ping(self) -> bool:
        if not self.redis:
            return False
        try:
            return await self.redis.ping()
        except Exception:
            return False
