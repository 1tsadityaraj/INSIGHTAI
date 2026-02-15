
import httpx
import datetime
import random
from typing import Dict, Any, List, Optional
from app.utils.logger import logger
from app.services.cache import CacheService
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from app.data.mock_data import get_mock_data

class MarketService:
    BASE_URL = "https://api.coingecko.com/api/v3"
    
    def __init__(self):
        self.cache = CacheService()

    async def _background_refresh(self, key, fetch_func, ttl):
        """
        Background task to refresh cache without blocking response.
        """
        try:
            logger.info(f"Background refreshing cache for key: {key}")
            data = await fetch_func()
            if data and isinstance(data, dict) and "error" not in data:
                await self.cache.set(key, data, ttl)
        except Exception as e:
            logger.warn(f"Background refresh failed for {key}: {e}")

    async def _get_cached_or_fetch(self, key: str, fetch_func, ttl: int = 600, force_refresh: bool = False, background_tasks = None):
        # 1. Cache Check
        if not force_refresh:
            cached = await self.cache.get(key)
            if cached:
                # Stale-While-Revalidate Logic
                # Check if we should background refresh (e.g., if cache is > 50% aged)
                # Need timestamp in cache or heuristic. Redis TTL is simpler.
                # Since we don't store timestamp inside the value easily without wrapper,
                # we can check remaining TTL.
                if background_tasks and self.cache.redis:
                   remaining = await self.cache.redis.ttl(key)
                   # If less than 50% of TTL remains, refresh in background
                   if remaining > 0 and remaining < (ttl / 2):
                       background_tasks.add_task(self._background_refresh, key, fetch_func, ttl)
                
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
            should_cache = False
            if isinstance(data, dict) and "error" not in data:
                should_cache = True
            elif isinstance(data, list) and data:
                should_cache = True

            if should_cache:
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

    async def get_coin_data(self, coin_id: str, force_refresh: bool = False, background_tasks = None) -> Dict[str, Any]:
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

        return await self._get_cached_or_fetch(cache_key, fetch, force_refresh=force_refresh, background_tasks=background_tasks)

    def calculate_sma(self, prices: List[float], window: int = 20) -> List[Optional[float]]:
        if not prices:
            return []
        import pandas as pd
        series = pd.Series(prices)
        sma = series.rolling(window=window).mean()
        # Replace NaN with None for JSON compatibility
        return [None if pd.isna(x) else x for x in sma.tolist()]

    def calculate_rsi(self, prices: List[float], period: int = 14) -> List[Optional[float]]:
        if not prices:
            return []
        import pandas as pd
        
        series = pd.Series(prices)
        delta = series.diff()
        
        gain = delta.clip(lower=0)
        loss = -delta.clip(upper=0)
        
        avg_gain = gain.rolling(window=period).mean()
        avg_loss = loss.rolling(window=period).mean()
        
        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))
        
        # Replace NaN with None for JSON compatibility
        return [None if pd.isna(x) else x for x in rsi.tolist()]

    def calculate_ema(self, prices: List[float], span: int = 20) -> List[Optional[float]]:
        if not prices:
            return []
        import pandas as pd
        series = pd.Series(prices)
        ema = series.ewm(span=span, adjust=False).mean()
        # Replace NaN with None for JSON compatibility
        return [None if pd.isna(x) else x for x in ema.tolist()]

    def calculate_macd(self, prices: List[float]) -> Dict[str, Any]:
        if not prices: 
            return {"macd": [], "signal": [], "histogram": [], "trend": "Neutral"}
        import pandas as pd
        series = pd.Series(prices)
        
        ema12 = series.ewm(span=12, adjust=False).mean()
        ema26 = series.ewm(span=26, adjust=False).mean()
        
        macd = ema12 - ema26
        signal = macd.ewm(span=9, adjust=False).mean()
        histogram = macd - signal
        
        # Signal Detection
        trend = "Neutral"
        if len(macd) >= 2 and len(signal) >= 2:
            # Check last completed candle logic or current? Using -1 as current.
            # Bullish: MACD crosses Signal form below
            if macd.iloc[-1] > signal.iloc[-1] and macd.iloc[-2] <= signal.iloc[-2]:
                trend = "Bullish Crossover"
            # Bearish: MACD crosses Signal from above
            elif macd.iloc[-1] < signal.iloc[-1] and macd.iloc[-2] >= signal.iloc[-2]:
                trend = "Bearish Crossover"
            # Continuation
            elif macd.iloc[-1] > signal.iloc[-1]:
                trend = "Bullish"
            elif macd.iloc[-1] < signal.iloc[-1]:
                trend = "Bearish"

        return {
            "macd": [None if pd.isna(x) else x for x in macd.tolist()],
            "signal": [None if pd.isna(x) else x for x in signal.tolist()],
            "histogram": [None if pd.isna(x) else x for x in histogram.tolist()],
            "trend": trend
        }

    async def get_market_chart(self, coin_id: str, days: str = "30", force_refresh: bool = False, background_tasks = None) -> Optional[Dict[str, Any]]:
        resolved_id = await self.resolve_symbol(coin_id)
        # Updated cache key version to v4 to support MACD
        cache_key = f"market:chart:{resolved_id}:{days}:v4"
        
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
                
                if not prices: 
                    return {"labels": [], "values": [], "sma": [], "rsi": [], "ema": [], "macd": []}
                    
                labels, values = [], []
                for p in prices:
                    ts = p[0] / 1000 
                    dt = datetime.datetime.fromtimestamp(ts)
                    date_str = dt.strftime('%b %d') if days in ["1", "7", "30", "90"] else dt.strftime('%b %Y')
                    labels.append(date_str)
                    values.append(p[1])
                
                # Calculate Indicators
                sma = self.calculate_sma(values)
                ema = self.calculate_ema(values)
                rsi = self.calculate_rsi(values)
                macd_data = self.calculate_macd(values)
                
                return {
                    "labels": labels, 
                    "values": values,
                    "sma": sma,
                    "ema": ema,
                    "rsi": rsi,
                    "macd": macd_data["macd"],
                    "macd_signal": macd_data["signal"],
                    "macd_histogram": macd_data["histogram"],
                    "signal_type": macd_data["trend"]
                }

        return await self._get_cached_or_fetch(cache_key, fetch, force_refresh=force_refresh, background_tasks=background_tasks)

    def calculate_volatility(self, prices: List[float]) -> float:
        if not prices or len(prices) < 2: return 0.0
        import pandas as pd
        series = pd.Series(prices)
        pct_change = series.pct_change()
        return pct_change.std() * 100 # percentage

    def calculate_market_health(self, chart_data: Dict, kpi_data: Dict, heatmap_data: List[Dict]) -> Dict[str, Any]:
        """
        Unified Market Health Panel Score (0-100).
        """
        if not chart_data or not kpi_data:
            return {"score": 50, "status": "Neutral", "components": {}}

        # 1. Heatmap Performance (0-20)
        # Avg of top 10 coins 24h change
        heatmap_score = 10
        
        # Validate Heatmap Data (ensure it's a list, handle error dicts)
        clean_heatmap = []
        if isinstance(heatmap_data, list):
            clean_heatmap = heatmap_data
            
        if clean_heatmap:
            changes = [h.get("change_24h", 0) for h in clean_heatmap if isinstance(h, dict) and h.get("change_24h") is not None]
            if changes:
                avg_change = sum(changes) / len(changes)
                # Map -10% to 0, +10% to 20
                heatmap_score = max(0, min(20, 10 + avg_change))

        # 2. RSI Health (0-20)
        # 40-70 is healthy bullish/stable. 
        rsi = chart_data.get("rsi", [])
        last_rsi = rsi[-1] if rsi and rsi[-1] is not None else 50
        rsi_score = 10
        if 40 <= last_rsi <= 70: rsi_score = 20
        elif last_rsi > 70: rsi_score = 15 # Overbought but strong
        elif last_rsi < 30: rsi_score = 5 # Weak
        
        # 3. MACD Signal (0-20)
        signal = chart_data.get("signal_type", "Neutral")
        macd_score = 10
        if "Bullish" in signal: macd_score = 20
        elif "Bearish" in signal: macd_score = 0

        # 4. Volatility (0-20)
        # Low volatility = 10, Moderate = 20, High = 10 (too risky?)
        # Let's say Stability is good. 
        # Actually user req: "Market Health". High volatility often correlates with fear/greed.
        # Let's map 1-5% as healthy (20), >10% as risky (5), <1% as stagnant (10).
        prices = chart_data.get("values", [])
        vol = self.calculate_volatility(prices)
        vol_score = 15
        if vol > 5: vol_score = 5
        elif vol < 1: vol_score = 10
        else: vol_score = 20
        
        # 5. AI Sentiment / K factor (0-20)
        # Using Trend Strength from before as proxy + price change
        change_24h = kpi_data.get("price_change_percentage_24h") or 0
        sentiment_score = 10 + (change_24h)
        sentiment_score = max(0, min(20, sentiment_score))

        # Total
        total_score = heatmap_score + rsi_score + macd_score + vol_score + sentiment_score
        final_score = int(max(0, min(100, total_score)))
        
        status = "Neutral"
        if final_score >= 75: status = "Strong Buy"
        elif final_score >= 60: status = "Bullish"
        elif final_score <= 25: status = "Strong Sell"
        elif final_score <= 40: status = "Bearish"

        return {
            "score": final_score,
            "status": status,
            "components": {
                "heatmap": round(heatmap_score, 1),
                "rsi": round(rsi_score, 1),
                "macd": round(macd_score, 1),
                "volatility": round(vol_score, 1),
                "sentiment": round(sentiment_score, 1)
            }
        }

    async def get_market_data(self, symbol: str, days: str = "30", force_refresh: bool = False, background_tasks = None):
        """
        Coordinates fetching KPI, Chart, and Health Score.
        """
        # Mock Data Interception
        if symbol.startswith("demo-"):
            mock_base, mock_prices = get_mock_data(symbol)
            if mock_base and mock_prices:
                # Process Chart
                values = [p[1] for p in mock_prices] # prices
                labels = []
                for p in mock_prices:
                    ts = p[0] / 1000
                    dt = datetime.datetime.fromtimestamp(ts)
                    labels.append(dt.strftime('%b %d'))
                
                # Calculate Indicators
                sma = self.calculate_sma(values)
                ema = self.calculate_ema(values)
                rsi = self.calculate_rsi(values)
                macd_data = self.calculate_macd(values)
                
                chart_data = {
                    "labels": labels,
                    "values": values,
                    "sma": sma,
                    "ema": ema,
                    "rsi": rsi,
                    "macd": macd_data["macd"],
                    "macd_signal": macd_data["signal"],
                    "macd_histogram": macd_data["histogram"],
                    "signal_type": macd_data["trend"]
                }
                
                return {
                    "kpi": mock_base["kpi"],
                    "chart": chart_data,
                    "market_score": mock_base["market_score"]
                }
        # Parallel fetch could be better here, but maintaining seq for simplicity or using gather
        import asyncio
        
        # 1. Fetch Core Data
        kpi_task = self.get_coin_data(symbol, force_refresh, background_tasks)
        chart_task = self.get_market_chart(symbol, days, force_refresh, background_tasks)
        heatmap_task = self.get_market_heatmap(limit=50, background_tasks=background_tasks)
        
        kpi, chart, heatmap = await asyncio.gather(kpi_task, chart_task, heatmap_task)
        
        # 2. Calculate Health
        health = self.calculate_market_health(chart, kpi, heatmap)
        
        return {
            "kpi": kpi, 
            "chart": chart,
            "market_score": health
        }

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
            
    async def get_comparison_data(self, symbols: List[str], range_days: str = "30", background_tasks = None) -> Dict[str, Any]:
        """
        Fetches and normalizes market data for multiple assets for comparison.
        """
        datasets = []
        for symbol in symbols:
            # We reuse get_market_chart but without force_refresh to leverage cache
            # We rely on stale-while-revalidate within get_market_chart if passed background_tasks
            # But get_market_chart signature needs to update to accept background_tasks to fully utilize it.
            # For now, we just call it.
            chart = await self.get_market_chart(symbol, days=range_days)
            if not chart or not chart.get("values"):
                continue
            
            prices = chart["values"]
            labels = chart["labels"]
            
            # Normalize: (price / start_price - 1) * 100
            if not prices: continue
            start_price = prices[0]
            if start_price == 0: continue # Avoid div by zero
            
            normalized = [((p / start_price) - 1) * 100 for p in prices]
            
            datasets.append({
                "name": symbol.upper(),
                "values": normalized,
                "original_values": prices,
                "labels": labels
            })
            
        return {
            "mode": "comparison",
            "range": range_days,
            "datasets": datasets
        }

    async def get_market_heatmap(self, limit: int = 10, background_tasks = None) -> List[Dict[str, Any]]:
        """
        Fetches top coins for heatmap visualization.
        """
        cache_key = f"market:heatmap:{limit}"
        
        async def fetch():
            url = f"{self.BASE_URL}/coins/markets"
            params = {
                "vs_currency": "usd",
                "order": "market_cap_desc",
                "per_page": limit,
                "page": 1,
                "sparkline": "false"
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, params=params)
                
                # Explicit Retry Triggers
                if resp.status_code == 429 or resp.status_code >= 500:
                    raise ConnectionError(f"Retryable Error: {resp.status_code}")
                
                if resp.status_code != 200:
                    return []

                data = resp.json()
                return [
                    {
                        "id": coin.get("id"),
                        "symbol": coin.get("symbol", "").upper(),
                        "name": coin.get("name"),
                        "price": coin.get("current_price"),
                        "change_24h": coin.get("price_change_percentage_24h"),
                        "market_cap": coin.get("market_cap"),
                        "volume": coin.get("total_volume")
                    } for coin in data
                ]

        # Heatmap cached for 5 minutes (300s)
        return await self._get_cached_or_fetch(cache_key, fetch, ttl=300, background_tasks=background_tasks)

    async def get_chart_explanation(self, symbol: str, days: str = "30", background_tasks = None) -> Dict[str, Any]:
        """
        Generates an AI explanation for the chart movement.
        """
        # First get the data
        market_data = await self.get_market_data(symbol, days=days)
        kpi = market_data.get("kpi", {}) or {}
        score = market_data.get("market_score", {}) or {}
        
        pct_change = kpi.get("price_change_percentage_24h", 0) or 0
        current_price = kpi.get("current_price_usd", 0) or 0
        trend = score.get("trend", "Neutral")
        
        # Construct a response
        explanation = (
            f"{symbol.upper()} is currently trading at ${current_price:,.2f}, showing a {trend} trend. "
            f"Over the last 24h, it changed by {pct_change:.2f}%. "
        )
        
        components = score.get("components", {}) or {}
        rsi = components.get("rsi", 0) or 0
        
        if rsi > 17: explanation += "RSI indicates strong momentum. "
        elif rsi < 8: explanation += "RSI suggests potential oversold conditions. "
        else: explanation += "Indicators remain balanced."
        
        vol_score = components.get("volume", 0) or 0
        if vol_score > 12: explanation += " Volume activity is high, supporting the movement."
        
        return {
            "symbol": symbol,
            "explanation": explanation,
            "key_factors": components
        }
