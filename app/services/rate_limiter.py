from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from app.core.config import get_settings
from app.utils.logger import logger

settings = get_settings()

try:
    # Attempt to use Redis for Production Rate Limiting
    # We must VERIFY connection eagerly to avoid runtime crashes if Redis is down
    import redis
    r = redis.from_url(settings.REDIS_URL, socket_timeout=1)
    r.ping()
    
    limiter = Limiter(
        key_func=get_remote_address,
        storage_uri=settings.REDIS_URL,
        strategy="fixed-window" 
    )
    logger.info(f"Rate Limiter: Configured with Redis at {settings.REDIS_URL}")
except Exception as e:
    # Fallback to MemoryStorage
    logger.warning(f"Rate Limiter: Redis Error ({e}). Falling back to Memory.")
    limiter = Limiter(key_func=get_remote_address, storage_uri="memory://")
