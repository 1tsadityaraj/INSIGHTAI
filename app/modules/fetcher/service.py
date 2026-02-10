import asyncio
from typing import List, Dict, Any
from app.modules.fetcher.base import BaseFetcher
from app.modules.fetcher.sources import WikipediaFetcher, CryptoFetcher, MockMarketFetcher
from app.models.schemas import ExecutionPlan, FetchedData
from app.core.logger import logger

class FetcherService:
    def __init__(self):
        self.fetchers: Dict[str, BaseFetcher] = {
            "general_knowledge": WikipediaFetcher(),
            "crypto_data": CryptoFetcher(),
            "market_data": MockMarketFetcher()
        }

    async def execute_plan(self, plan: ExecutionPlan) -> List[FetchedData]:
        """
        Executes the plan by dispatching subtasks to appropriate fetchers.
        """
        logger.info("Executing fetch plan...")
        tasks = []
        
        for subtask in plan.subtasks:
            fetcher = self.fetchers.get(subtask.data_source_type)
            if not fetcher:
                logger.warning(f"No fetcher found for type: {subtask.data_source_type}. Defaulting to Wikipedia.")
                fetcher = self.fetchers["general_knowledge"]
            
            # We use the first keyword as the query for simplicity in this demo
            # A more advanced version might combine keywords or search multiple.
            query = subtask.search_keywords[0] if subtask.search_keywords else subtask.description
            
            tasks.append(self._safe_fetch(fetcher, query, subtask.data_source_type))
            
        results = await asyncio.gather(*tasks)
        return results

    async def _safe_fetch(self, fetcher: BaseFetcher, query: str, source_type: str) -> FetchedData:
        try:
            data = await fetcher.fetch(query)
            return FetchedData(source=source_type, data=data) 
        except Exception as e:
            logger.error(f"Error executing fetch task for {query}: {e}")
            return FetchedData(source=source_type, data={"error": str(e)})
