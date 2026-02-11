
import redis.asyncio as redis
from typing import Optional, Any
from app.core.config import get_settings
from app.utils.logger import logger
import json

settings = get_settings()

class CacheService:
    _instance = None
    _redis_client = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(CacheService, cls).__new__(cls)
            cls._instance._init_redis()
        return cls._instance

    def _init_redis(self):
        if self._redis_client:
            return
        try:
            self._redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
            logger.info(f"Redis configured at {settings.REDIS_URL}")
        except Exception as e:
            logger.error(f"Failed to configure Redis: {e}")
            self._redis_client = None

    @property
    def redis(self):
        return self._redis_client

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
            await self.redis.set(key, json.dumps(value), ex=ttl)
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
