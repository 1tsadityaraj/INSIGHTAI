import httpx
import asyncio
import random
from typing import Any, Dict
from app.modules.fetcher.base import BaseFetcher
from app.core.logger import logger

class WikipediaFetcher(BaseFetcher):
    async def fetch(self, query: str) -> Dict[str, Any]:
        """Fetches a summary from Wikipedia."""
        logger.info(f"WikipediaFetcher: Fetching '{query}'")
        url = "https://en.wikipedia.org/api/rest_v1/page/summary/" + query.replace(" ", "_")
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, follow_redirects=True)
                if response.status_code == 200:
                    data = response.json()
                    return {
                        "source": "Wikipedia",
                        "title": data.get("title"),
                        "summary": data.get("extract"),
                        "url": data.get("content_urls", {}).get("desktop", {}).get("page")
                    }
                else:
                    logger.warning(f"Wikipedia fetch failed for '{query}': {response.status_code}")
                    return {"source": "Wikipedia", "error": "Not found"}
            except Exception as e:
                logger.error(f"Wikipedia fetch error: {e}")
                return {"source": "Wikipedia", "error": str(e)}

class CryptoFetcher(BaseFetcher):
    async def fetch(self, query: str) -> Dict[str, Any]:
        """Fetches crypto data from CoinGecko (Free API)."""
        # CoinGecko requires 'id' (e.g., 'bitcoin'). thorough search is complex, so we assume simple mapping or specific query.
        # For this demo, we'll try to guess the ID or search.
        logger.info(f"CryptoFetcher: Fetching '{query}'")
        
        # Simple mapping for common coins to avoid search API rate limits/complexity
        # In a real app, we'd use the /search endpoint first.
        coin_id = query.lower()
        
        url = f"https://api.coingecko.com/api/v3/coins/{coin_id}"
        params = {
            "localization": "false",
            "tickers": "false",
            "market_data": "true",
            "community_data": "false",
            "developer_data": "false",
            "sparkline": "false"
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, params=params)
                if response.status_code == 200:
                    data = response.json()
                    market_data = data.get("market_data", {})
                    return {
                        "source": "CoinGecko",
                        "name": data.get("name"),
                        "symbol": data.get("symbol"),
                        "current_price_usd": market_data.get("current_price", {}).get("usd"),
                        "market_cap_usd": market_data.get("market_cap", {}).get("usd"),
                        "price_change_percentage_24h": market_data.get("price_change_percentage_24h"),
                        "description": data.get("description", {}).get("en", "")[:500] + "..." # Truncate
                    }
                else:
                    # Fallback or error
                    logger.warning(f"Crypto fetch failed: {response.status_code}")
                    return {"source": "CoinGecko", "error": "Coin not found or API limit reached"}
            except Exception as e:
                logger.error(f"Crypto fetch error: {e}")
                return {"source": "CoinGecko", "error": str(e)}

class MockMarketFetcher(BaseFetcher):
    async def fetch(self, query: str) -> Dict[str, Any]:
        """
        Fetches stock market data.
        NOTE: Real stock APIs (AlphaVantage, Polygon, etc.) require keys.
        For this interview/demo, we simulate a reliable response.
        """
        logger.info(f"MockMarketFetcher: Fetching '{query}'")
        
        # Simulate network delay
        await asyncio.sleep(0.5)
        
        # deterministic "random" data based on query length to be consistent
        seed = sum(ord(c) for c in query)
        random.seed(seed)
        
        price = random.uniform(100, 3000)
        change = random.uniform(-5, 5)
        
        return {
            "source": "MarketData (Simulated)",
            "ticker": query.upper(),
            "price": round(price, 2),
            "change_percent": round(change, 2),
            "volume": random.randint(1000000, 50000000),
            "message": "Real-time stock API requires premium tokens. This is simulated data for architecture demonstration."
        }
