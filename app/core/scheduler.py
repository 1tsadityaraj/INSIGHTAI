from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.services.market import MarketService
from app.utils.logger import logger
import asyncio

# Create the scheduler instance
scheduler = AsyncIOScheduler()

# Define popular assets to refresh
# Including top 10+ popular coins to ensure instant load times for most users
POPULAR_ASSETS = [
    "bitcoin", "ethereum", "solana", "ripple", 
    "cardano", "dogecoin", "polkadot", "chainlink", 
    "avalanche-2", "shiba-inu", "pepe", "arbitrum", "optimism"
]

async def refresh_market_data():
    """
    Background task to refresh market data for popular assets.
    Forces a cache update to ensure fresh data in Redis.
    """
    service = MarketService()
    logger.info("Scheduler: Starting periodic market data refresh...")
    
    for asset in POPULAR_ASSETS:
        try:
            # Force refresh both KPI and Chart data
            # This calls get_coin_data and get_market_chart(days=30) internally with force_refresh=True
            await service.get_market_data(asset, days="30", force_refresh=True)
            logger.info(f"Scheduler: Refreshed cache for {asset}")
            
            # Add a small delay between requests to avoid burst rate limits
            await asyncio.sleep(2) 
            
        except Exception as e:
            logger.error(f"Scheduler: Refresh failed for {asset}: {e}")

    logger.info("Scheduler: Market data refresh complete.")

def start_scheduler():
    """
    Starts the AsyncIOScheduler with a 5-minute interval job.
    """
    if not scheduler.running:
        scheduler.add_job(
            refresh_market_data,
            "interval",
            minutes=5,
            jitter=30, # Add randomness to prevent synchronized spikes if multiple instances run
            id="market_refresh",
            replace_existing=True
        )
        scheduler.start()
        logger.info("Background Scheduler Started (Interval: 5m).")
