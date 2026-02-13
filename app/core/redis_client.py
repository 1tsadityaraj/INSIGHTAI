
import redis.asyncio as redis
from app.core.config import get_settings
from app.utils.logger import logger

settings = get_settings()

class RedisManager:
    """
    Manages the Redis connection lifecycle.
    Using a class allows us to easily close the connection on app shutdown.
    """
    def __init__(self):
        self.client: redis.Redis = None

    def initialize(self):
        import socket
        try:
            # Simple check if Redis port is open
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(1)
                s.connect(("localhost", 6379))
                
            self.client = redis.from_url(
                settings.REDIS_URL, 
                decode_responses=True,
                encoding="utf-8",
                socket_timeout=5.0,
                socket_connect_timeout=5.0,
                retry_on_timeout=True,
                health_check_interval=30
            )
            logger.info(f"Redis Client initialized for {settings.REDIS_URL}")
        except (socket.error, ConnectionRefusedError):
            logger.warning("Redis Server not found on localhost:6379. Falling back to FakeRedis (In-Memory).")
            from fakeredis import FakeAsyncRedis
            self.client = FakeAsyncRedis(decode_responses=True)
        except Exception as e:
            logger.error(f"Failed to initialize Redis Client: {e}")
            self.client = None

    async def close(self):
        if self.client:
            await self.client.close()
            logger.info("Redis Connection Closed")

# Create a global instance
redis_manager = RedisManager()
redis_manager.initialize()

# Export the client directly for easy valid usage
redis_client = redis_manager.client
