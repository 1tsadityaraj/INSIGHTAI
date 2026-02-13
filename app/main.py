from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
import os

from app.api.chat import router as chat_router
from app.api.market import router as market_router
from app.api.watchlist import router as watchlist_router
from app.core.config import get_settings
from app.utils.logger import logger
from app.services.rate_limiter import limiter
from app.core.scheduler import start_scheduler, scheduler

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="InsightAI Production Backend",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Initialize Limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ------------------------------------------------------------------------------
# CORS Configuration (Must be added BEFORE including routers)
# ------------------------------------------------------------------------------
# Load allowed origins from environment/settings
# This handles Localhost (5173, 3000) and Production (Vercel) automatically
logger.info(f"CORS Configured for Origins: {settings.CORS_ORIGINS}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------------------
# Include Routers (AFTER Middleware)
# ------------------------------------------------------------------------------
app.include_router(chat_router, prefix=settings.API_PREFIX)
app.include_router(market_router, prefix=settings.API_PREFIX)
app.include_router(watchlist_router, prefix=settings.API_PREFIX)

@app.on_event("startup")
async def startup_event():
    logger.info("Starting up application...")
    start_scheduler()

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down application...")
    if scheduler.running:
        scheduler.shutdown()
    from app.core.redis_client import redis_manager
    await redis_manager.close()

@app.get("/")
def health_check():
    return {"status": "ok", "app": settings.APP_NAME}

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting InsightAI Backend...")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=settings.DEBUG)
