import httpx
import asyncio
import random
from typing import List, Dict, Any
from app.models.schemas import ExecutionPlan, FetchedData
from app.models.schemas import ExecutionPlan, FetchedData
from app.utils.logger import logger
from app.services.market import MarketService

class FetcherService:
    def __init__(self):
        self.market_service = MarketService()
    
    async def execute_plan(self, plan: ExecutionPlan) -> List[FetchedData]:
        """
        Executes all subtasks in the plan concurrently.
        """
        logger.info("Fetcher: Executing plan...")
        tasks = []
        
        for subtask in plan.subtasks:
            query = subtask.search_keywords[0] if subtask.search_keywords else subtask.description
            source = subtask.data_source
            tasks.append(self.fetch_data(source, query))
            
        results = await asyncio.gather(*tasks)
        return results

    async def fetch_data(self, source: str, query: str) -> FetchedData:
        """
        Routes the fetch request to the appropriate method.
        """
        try:
            if source == "wikipedia":
                data = await self._fetch_wikipedia(query)
            elif source == "crypto":
                data = await self._fetch_crypto(query)
            elif source == "crypto_chart":
                data = await self._fetch_crypto_chart(query)
            elif source == "stock_mock":
                data = self._fetch_stock_mock(query)
            elif source == "news":
                data = await self._fetch_news(query)
            elif source == "social_sentiment":
                data = await self._fetch_social_sentiment(query)
            else:
                data = {"error": f"Unknown source: {source}"}
            
            return FetchedData(source=source, data=data)
        except Exception as e:
            logger.error(f"Fetcher Error ({source}): {e}")
            return FetchedData(source=source, data={"error": str(e)})

    # --- Specific Fetchers ---

    async def _fetch_news(self, query: str) -> Dict[str, Any]:
        """
        Fetches recent news/developments via a search proxy.
        """
        headers = {"User-Agent": "InsightAI/1.0"}
        async with httpx.AsyncClient() as client:
            try:
                # Use Wikipedia Search API for 'related' or 'recent' articles
                url = "https://en.wikipedia.org/w/api.php"
                params = {
                    "action": "query",
                    "list": "search",
                    "srsearch": f"{query} news 2026",
                    "format": "json",
                    "srlimit": 3
                }
                resp = await client.get(url, params=params, headers=headers)
                data = resp.json()
                return {"headlines": data.get("query", {}).get("search", [])}
            except:
                return {"headlines": []}

    async def _fetch_social_sentiment(self, query: str) -> Dict[str, Any]:
        """
        Simulates Social Sentiment analysis from X (Twitter) and Reddit.
        """
        # Deterministic simulation based on query string
        seed = sum(ord(c) for c in query.lower())
        random.seed(seed)
        
        sentiment_score = random.uniform(0.3, 0.9)
        mention_volume = random.randint(500, 15000)
        
        return {
            "score": round(sentiment_score, 2),
            "volume_24h": mention_volume,
            "status": "Bullish" if sentiment_score > 0.6 else "Neutral",
            "platforms": ["X", "Reddit", "Discord"]
        }

    async def _fetch_wikipedia(self, query: str) -> Dict[str, Any]:
        """
        Fetches Wikipedia info using a 2-step process:
        1. Search for the best matching article title.
        2. Fetch the summary for that specific title.
        This resolves issues where expanded queries (e.g. "Data Structures and Algorithms") 
        don't directly match article slugs.
        """
        headers = {
            "User-Agent": "InsightAI/1.0 (https://github.com/aditya/InsightAI; contact@insightai.com)"
        }
        
        async with httpx.AsyncClient() as client:
            try:
                # Step 1: Search for the title
                search_url = f"https://en.wikipedia.org/w/api.php"
                search_params = {
                    "action": "query",
                    "list": "search",
                    "srsearch": query,
                    "format": "json",
                    "srlimit": 1
                }
                
                search_resp = await client.get(search_url, params=search_params, headers=headers)
                search_data = search_resp.json()
                
                search_results = search_data.get("query", {}).get("search", [])
                if not search_results:
                    return {"error": "No Wikipedia article found for this topic."}
                
                best_title = search_results[0]["title"]
                
                # Step 2: Fetch the summary of the best title
                summary_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{best_title.replace(' ', '_')}"
                summary_resp = await client.get(summary_url, headers=headers, follow_redirects=True)
                
                if summary_resp.status_code == 200:
                    return summary_resp.json()
                
                return {"error": f"Article found ({best_title}), but summary unavailable."}
                
            except Exception as e:
                logger.error(f"Fetcher Wikipedia Error: {e}")
                return {"error": "Wikipedia service temporarily unavailable."}

    async def _fetch_crypto(self, query: str) -> Dict[str, Any]:
        """
        Fetches crypto data using the robust MarketService (handles symbol resolution).
        """
        # cleans query "Bitcoin price" -> "bitcoin"
        clean_query = query.lower().replace(" price", "").replace(" market cap", "").strip()
        
        # Use the centralized MarketService which has the symbol mapping/resolution logic
        return await self.market_service.get_coin_data(clean_query)

    async def _fetch_crypto_chart(self, query: str) -> Dict[str, Any]:
        """
        Fetches historical chart data.
        """
        # Improved coin_id detection (simple fallback for now)
        coin_id = query.lower().replace(" ", "-") 
        # Default to 30 days for chat-initiated charts
        data = await self.market_service.get_market_chart(coin_id, days=30)
        
        if not data:
            return {"error": "Chart data unavailable"}
            
        return data
    def _fetch_stock_mock(self, query: str) -> Dict[str, Any]:
        # Simulated reliable data
        seed = sum(ord(c) for c in query)
        random.seed(seed)
        price = random.uniform(10, 1000)
        change = random.uniform(-10, 10)
        return {
            "ticker": query.upper(),
            "price": round(price, 2),
            "change_percent": round(change, 2),
            "volume": random.randint(1000, 100000),
            "message": "Simulated Market Data"
        }
