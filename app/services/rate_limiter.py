from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from app.core.config import get_settings
from app.utils.logger import logger

settings = get_settings()

try:
    # Attempt to use Redis (DISABLED FOR NOW due to local connection issues)
    # limiter = Limiter(
    #     key_func=get_remote_address,
    #     storage_uri=settings.REDIS_URL,
    #     strategy="fixed-window" 
    # )
    # logger.info(f"Rate Limiter: Configured with Redis at {settings.REDIS_URL}")
    
    # Force Memory Storage to unblock development
    logger.warning("Rate Limiter: Forcing MemoryStorage to unblock development.")
    limiter = Limiter(key_func=get_remote_address, storage_uri="memory://")
except Exception as e:
    # Fallback
    logger.warning(f"Rate Limiter: Redis Error ({e}). Falling back to Memory.")
    limiter = Limiter(key_func=get_remote_address, storage_uri="memory://")
