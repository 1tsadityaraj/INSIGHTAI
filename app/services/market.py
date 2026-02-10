import httpx
from typing import Dict, Any, List, Optional
from app.utils.logger import logger

class MarketService:
    BASE_URL = "https://api.coingecko.com/api/v3"
    
    async def get_coin_data(self, coin_id: str) -> Dict[str, Any]:
        """
        Fetches current market data for a specific coin.
        Returns KPIs: current price, market cap, 24h change, etc.
        """
        # Resolve Coin ID (Handle symbols like 'btc' -> 'bitcoin')
        # This is a basic mapping, in production consider a more robust search.
        symbol_map = {
            "btc": "bitcoin", "bitcoin": "bitcoin",
            "eth": "ethereum", "ethereum": "ethereum",
            "sol": "solana", "solana": "solana",
            "doge": "dogecoin", "dogecoin": "dogecoin",
            "dot": "polkadot", "polkadot": "polkadot",
            "ada": "cardano", "cardano": "cardano",
            "xrp": "ripple", "ripple": "ripple",
            "matic": "polygon", "polygon": "polygon",
            "link": "chainlink", "chainlink": "chainlink",
            "ltc": "litecoin", "litecoin": "litecoin",
            "uni": "uniswap", "uniswap": "uniswap",
            "atom": "cosmos", "cosmos": "cosmos",
            "avax": "avalanche-2", "avalanche": "avalanche-2",
            "trx": "tron", "tron": "tron",
            "shib": "shiba-inu", "shiba": "shiba-inu",
            "bch": "bitcoin-cash",
            "near": "near",
            "apt": "aptos",
            "arb": "arbitrum",
            "optimism": "optimism", "op": "optimism",
            "pepe": "pepe",
            "sui": "sui"
        }
        
        resolved_id = symbol_map.get(coin_id.lower(), coin_id.lower())
        
        url = f"{self.BASE_URL}/coins/{resolved_id}"
        params = {
            "localization": "false",
            "tickers": "false",
            "market_data": "true",
            "community_data": "false",
            "developer_data": "false",
            "sparkline": "false"
        }
        
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                resp = await client.get(url, params=params)
                
                if resp.status_code == 429:
                    logger.warning(f"MarketService: Rate limited for {coin_id}")
                    return {"error": "Rate limit exceeded. Please try again later."}
                
                if resp.status_code != 200:
                    logger.error(f"MarketService: Error fetching {coin_id} - {resp.status_code}")
                    return {"error": f"Failed to fetch data: {resp.status_code}"}
                
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
                
        except Exception as e:
            logger.error(f"MarketService Exception: {str(e)}")
            return {"error": str(e)}

    async def get_market_chart(self, coin_id: str, days: int = 30) -> Optional[Dict[str, Any]]:
        """
        Fetches historical market data for charting (Safe & Validated).
        Returns: { "labels": [date_str], "values": [price] } or None on failure.
        """
        # Resolve Coin ID
        symbol_map = {
            "btc": "bitcoin", "eth": "ethereum", "sol": "solana",
            "doge": "dogecoin", "dot": "polkadot", "ada": "cardano",
            "xrp": "ripple", "matic": "polygon", "link": "chainlink",
            "ltc": "litecoin", "uni": "uniswap", "atom": "cosmos",
            "avax": "avalanche-2", "shib": "shiba-inu", "pepe": "pepe"
        }
        
        resolved_id = symbol_map.get(coin_id.lower(), coin_id.lower())
        url = f"{self.BASE_URL}/coins/{resolved_id}/market_chart"
        params = {
            "vs_currency": "usd",
            "days": days
        }
        
        try:
            # Strict 5s timeout as requested
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(url, params=params)
                resp.raise_for_status() # Raise on 4xx/5xx
                
                data = resp.json()
                
                # 🔒 VALIDATION 
                # Ensure 'prices' exists and has valid data points
                prices = data.get("prices")
                if not prices or len(prices) < 2:
                    logger.warning(f"MarketService: Invalid/Empty chart data for {coin_id}")
                    return None
                
                # 🔄 TRANSFORMATION
                # Map raw [timestamp, price] -> { labels: [], values: [] }
                import datetime
                
                labels = []
                values = []
                
                for p in prices:
                    ts = p[0] / 1000 # Convert ms to s
                    price = p[1]
                    # Format: "Feb 10"
                    date_str = datetime.datetime.fromtimestamp(ts).strftime('%b %d')
                    labels.append(date_str)
                    values.append(price)
                
                return {
                    "labels": labels,
                    "values": values
                }
                
        except Exception as e:
            logger.error(f"MarketService Chart Error for {coin_id}: {str(e)}")
            return None

    async def search_coin(self, search_term: str) -> Optional[str]:
        """
        Uses CoinGecko's search endpoint to resolve fuzzy terms to exact IDs.
        Example: "Solana" -> "solana", "Doller" -> None
        """
        url = f"{self.BASE_URL}/search"
        params = {"query": search_term}
        
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(url, params=params)
                if resp.status_code != 200:
                    return None
                
                data = resp.json()
                coins = data.get("coins", [])
                if not coins:
                    return None
                
                # Check for an exact-ish match
                # Often the first result is the best
                for coin in coins[:3]:
                    low_term = search_term.lower()
                    if low_term in [coin["id"].lower(), coin["name"].lower(), coin["symbol"].lower()]:
                        return coin["id"]
                
                return coins[0]["id"]
        except Exception as e:
            logger.error(f"MarketService Search Error: {e}")
            return None
