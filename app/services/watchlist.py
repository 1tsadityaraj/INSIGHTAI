
from app.services.cache import CacheService
from app.utils.logger import logger
from typing import List

class WatchlistService:
    def __init__(self):
        self.cache = CacheService()
        self.key = "watchlist:default" # Single user for v1

    async def get_watchlist(self) -> List[str]:
        data = await self.cache.get(self.key)
        return data if data else []

    async def add_asset(self, asset_id: str) -> List[str]:
        current = await self.get_watchlist()
        if asset_id not in current:
            current.append(asset_id)
            await self.cache.set(self.key, current, ttl=86400 * 30) # 30 Days
        return current

    async def remove_asset(self, asset_id: str) -> List[str]:
        current = await self.get_watchlist()
        if asset_id in current:
            current.remove(asset_id)
            await self.cache.set(self.key, current, ttl=86400 * 30)
        return current
