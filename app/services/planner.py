import json
import asyncio
from typing import Dict, Any
import google.generativeai as genai
from app.core.config import get_settings
from app.utils.logger import logger
from app.models.schemas import ExecutionPlan, SubTask

settings = get_settings()
genai.configure(api_key=settings.GEMINI_API_KEY)

class PlannerService:
    def __init__(self):
        self.model = genai.GenerativeModel(
            model_name=settings.GEMINI_MODEL,
            system_instruction="""
            You are an expert AI planner.
            Classify user queries to either fetch market data OR general concepts.
            
            Valid Data Sources:
            - 'wikipedia': Use for definitions, computer science concepts (e.g. "DSA", "algorithms"), history, technology, and general knowledge.
            - 'crypto': ONLY for specific cryptocurrencies (Bitcoin, ETH, Solana) when the user asks for PRICE, MARKET CAP, or generic "show me X".
            - 'crypto_chart': ONLY if the user explicitly asks for a "chart", "trend", "history", or "plot" of a SPECIFIC cryptocurrency.
            
            Rules:
            1. If the query is about a concept like "DSA", "Binary Search", "AI", "Cloud", or "Money", use 'wikipedia'. Do NOT use 'crypto'.
            2. If uncertain if a term is a coin or concept (e.g. "python"), default to 'wikipedia'.
            3. "crypto" source implies we will call the CoinGecko API. Do not use it for non-existent coins.

            Return JSON:
            {
                "original_query": "string",
                "subtasks": [
                    {
                        "id": 1,
                        "description": "Fetch definition/info",
                        "search_keywords": ["keyword"],
                        "data_source": "wikipedia | crypto | crypto_chart"
                    }
                ]
            }
            """
        )

    async def get_query_intent(self, query: str) -> Dict[str, Any]:
        """
        Gemini-powered intent classification.
        Returns: {"intent": "MARKET" | "CONCEPT", "subject": "string"}
        """
        prompt = f"""
        Classify the intent of this user query for a financial/knowledge app.
        
        Is this a query about a cryptocurrency/market data OR a general concept/knowledge question?
        
        Rules:
        - If about a coin, price, or market chart: intent="MARKET", subject="coin name or ticker".
        - If anything else (definition, science, history, programming): intent="CONCEPT", subject="the term".
        
        User Query: "{query}"
        
        Output exact JSON:
        {{ "intent": "MARKET" | "CONCEPT", "subject": "string" }}
        """
        
        try:
            response = await asyncio.wait_for(
                self.model.generate_content_async(
                    prompt,
                    generation_config=genai.GenerationConfig(
                        response_mime_type="application/json",
                        temperature=0.1
                    )
                ),
                timeout=5.0
            )
            return json.loads(response.text)
        except Exception as e:
            logger.error(f"get_query_intent AI Error: {e}")
            # Senior Fallback: Keyword detection
            q_lower = query.lower()
            market_words = ["btc", "eth", "sol", "price", "chart", "crypto", "market", "bitcoin", "ethereum"]
            if any(w in q_lower for w in market_words):
                return {"intent": "MARKET", "subject": query}
            return {"intent": "CONCEPT", "subject": query}

    async def classify_intent(self, query: str) -> Dict[str, Any]:
        # Alias for backward compatibility if needed internally
        return await self.get_query_intent(query)

    async def create_plan(self, query: str) -> ExecutionPlan:
        # (Keeping existing for backward compatibility if needed, but API will move to classify_intent)
        ...
