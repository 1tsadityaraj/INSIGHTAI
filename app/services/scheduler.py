
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.services.market import MarketService
from app.services.cache import CacheService
from app.utils.logger import logger
import asyncio

scheduler = AsyncIOScheduler()
market_service = MarketService()
cache_service = CacheService()

TOP_ASSETS = [
    "bitcoin", "ethereum", "solana", "ripple", 
    "cardano", "dogecoin", "polkadot", "chainlink", 
    "avalanche-2", "shiba-inu"
]

async def refresh_market_data():
    """
    Background Task: Refreshes cache for top assets every 5 minutes.
    """
    logger.info("Scheduler: Starting Top Assets Refresh...")
    
    for asset in TOP_ASSETS:
        try:
            # 1. Invalidate existing cache (force refresh)
            # We know the key format from MarketService: "market:kpi:{id}"
            # We must be careful to match the logic in MarketService.
            # Ideally MarketService exposes a refresh method, but we'll manage here for now.
            resolved_id = await market_service.resolve_symbol(asset)
            key = f"market:kpi:{resolved_id}"
            
            # Using private redis access or just rely on overwriting?
            # MarketService.get_coin_data checks cache first.
            # To force update, we need to bypass that check.
            # Hack: Manually delete key using CacheService
            if cache_service.redis:
                await cache_service.redis.delete(key)
            
            # 2. Fetch new data (will fill cache)
            await market_service.get_coin_data(resolved_id)
            # logger.info(f"Scheduler: Refreshed {resolved_id}")
            
            # Rate limit politeness
            await asyncio.sleep(1) 
            
        except Exception as e:
            logger.error(f"Scheduler Error for {asset}: {e}")

    logger.info("Scheduler: Refresh Complete.")

def start_scheduler():
    if not scheduler.running:
        scheduler.add_job(refresh_market_data, "interval", minutes=5)
        scheduler.start()
        logger.info("Background Scheduler Started.")
