
import httpx
import datetime
import random
from typing import Dict, Any, List, Optional
from app.utils.logger import logger
from app.services.cache import CacheService
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

class MarketService:
    BASE_URL = "https://api.coingecko.com/api/v3"
    
    def __init__(self):
        self.cache = CacheService()

    async def _get_cached_or_fetch(self, key: str, fetch_func, ttl: int = 300):
        # 1. Cache Check
        cached = await self.cache.get(key)
        if cached:
            return cached
        
        # 2. Define Retry Logic for Network Calls
        # We catch ConnectionError (which we will raise for 429/5xx explicitly)
        @retry(
            stop=stop_after_attempt(3), 
            wait=wait_exponential(multiplier=1, min=2, max=10),
            retry=retry_if_exception_type((httpx.RequestError, httpx.TimeoutException, ConnectionError))
        )
        async def robust_fetch():
            return await fetch_func()

        # 3. Execute Fetch
        try:
            data = await robust_fetch()
            
            # 4. Cache Store (if valid)
            if data and isinstance(data, dict) and "error" not in data:
                await self.cache.set(key, data, ttl)
                
            return data
        except Exception as e:
            logger.error(f"MarketService: Final failure for {key}: {e}")
            return {"error": "External API Unavailable (Max Retries Exceeded)"}

    async def resolve_symbol(self, symbol: str) -> str:
        symbol_map = {
            "btc": "bitcoin", "eth": "ethereum", "sol": "solana",
            "doge": "dogecoin", "dot": "polkadot", "ada": "cardano",
            "xrp": "ripple", "matic": "polygon", "link": "chainlink", 
            "ltc": "litecoin", "uni": "uniswap", "atom": "cosmos",
            "avax": "avalanche-2", "shib": "shiba-inu", "pepe": "pepe",
            "near": "near", "apt": "aptos", "arb": "arbitrum", "op": "optimism"
        }
        return symbol_map.get(symbol.lower(), symbol.lower())

    async def get_coin_data(self, coin_id: str) -> Dict[str, Any]:
        resolved_id = await self.resolve_symbol(coin_id)
        cache_key = f"market:kpi:{resolved_id}"
        
        async def fetch():
            url = f"{self.BASE_URL}/coins/{resolved_id}"
            params = {
                "localization": "false", "tickers": "false", "market_data": "true",
                "community_data": "false", "developer_data": "false", "sparkline": "false"
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, params=params)
                
                # Explicit Retry Triggers
                if resp.status_code == 429 or resp.status_code >= 500:
                    raise ConnectionError(f"Retryable Error: {resp.status_code}") 
                
                resp.raise_for_status()
                
                data = resp.json()
                market = data.get("market_data", {})
                return {
                    "name": data.get("name"),
                    "symbol": data.get("symbol"),
                    "current_price_usd": market.get("current_price", {}).get("usd"),
                    "market_cap_usd": market.get("market_cap", {}).get("usd"),
                    "price_change_percentage_24h": market.get("price_change_percentage_24h"),
                    "total_volume_usd": market.get("total_volume", {}).get("usd"),
                    "high_24h": market.get("high_24h", {}).get("usd"),
                    "low_24h": market.get("low_24h", {}).get("usd"),
                    "last_updated": market.get("last_updated")
                }

        return await self._get_cached_or_fetch(cache_key, fetch)

    async def get_market_chart(self, coin_id: str, days: str = "30") -> Optional[Dict[str, Any]]:
        resolved_id = await self.resolve_symbol(coin_id)
        cache_key = f"market:chart:{resolved_id}:{days}"
        
        async def fetch():
            url = f"{self.BASE_URL}/coins/{resolved_id}/market_chart"
            params = {"vs_currency": "usd", "days": days}
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, params=params)
                
                # Explicit Retry Triggers
                if resp.status_code == 429 or resp.status_code >= 500:
                    raise ConnectionError(f"Retryable Error: {resp.status_code}")
                
                resp.raise_for_status()
                
                data = resp.json()
                prices = data.get("prices", [])
                
                # Check for empty data BUT don't error out, just return empty
                if not prices: 
                    return {"labels": [], "values": []} 
                    
                labels, values = [], []
                for p in prices:
                    ts = p[0] / 1000 
                    dt = datetime.datetime.fromtimestamp(ts)
                    date_str = dt.strftime('%b %d') if days in ["1", "7", "30", "90"] else dt.strftime('%b %Y')
                    labels.append(date_str)
                    values.append(p[1])
                
                return {"labels": labels, "values": values}

        return await self._get_cached_or_fetch(cache_key, fetch)

    async def search_coin(self, search_term: str) -> Optional[str]:
        cache_key = f"market:search:{search_term.lower()}"
        
        async def fetch():
            url = f"{self.BASE_URL}/search"
            params = {"query": search_term}
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(url, params=params)
                if resp.status_code == 200:
                    coins = resp.json().get("coins", [])
                    if coins: return coins[0]["id"]
            return None

        # Search results cached for 1 hour
        return await self._get_cached_or_fetch(cache_key, fetch, ttl=3600)
    
    # --- FOREX SUPPORT ---
    async def get_forex_rate(self, base: str, target: str) -> Optional[Dict[str, Any]]:
        cache_key = f"forex:{base}:{target}"
        
        async def fetch():
            url = f"https://api.exchangerate-api.com/v4/latest/{base.upper()}"
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    data = resp.json()
                    rate = data.get("rates", {}).get(target.upper())
                    if rate:
                        return {
                            "base": base.upper(),
                            "target": target.upper(),
                            "rate": rate,
                            "timestamp": data.get("time_last_updated")
                        }
            return None
            
        return await self._get_cached_or_fetch(cache_key, fetch, ttl=3600)

    async def get_forex_chart(self, base: str, target: str, days: str = "30") -> Dict[str, Any]:
        # Synthetic generator for MVP
        current = await self.get_forex_rate(base, target)
        if not current: return None
            
        rate = current["rate"]
        num_points = 30 if days == "30" else 90 if days == "90" else 7
        
        values = []
        labels = []
        now = datetime.datetime.now()
        
        curr = rate
        # Seed logic for deterministic charts (optional)
        # random.seed(base+target+days) 
        
        for i in range(num_points):
            change = curr * (random.uniform(-0.005, 0.005))
            curr += change
            values.insert(0, curr)
            date = now - datetime.timedelta(days=i)
            labels.insert(0, date.strftime('%b %d'))
            
        return {"labels": labels, "values": values, "current_rate": rate}
