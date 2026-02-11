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
        
        Intents:
        1. MARKET: Info about a SINGLE cryptocurrency (price, chart, market cap).
        2. COMPARISON: Request to COMPARE multiple assets (e.g. "Bitcoin vs Ethereum", "Compare SOL and ADA").
        3. FOREX: Request for fiat currency exchange rates (e.g. "USD to INR", "100 EUR in GBP").
        4. CONCEPT: General knowledge, definitions, history, science.
        
        User Query: "{query}"
        
        Output exact JSON:
        {{
            "intent": "MARKET" | "CONCEPT" | "COMPARISON" | "FOREX",
            "subject": "string (main topic)",
            "assets": ["asset1", "asset2"] (ONLY for COMPARISON, else null),
            "base": "USD" (ONLY for FOREX),
            "target": "EUR" (ONLY for FOREX)
        }}
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

    async def create_plan(self, query: str, intent_data: Dict[str, Any]) -> ExecutionPlan:
        """
        Agents 2.0: Generates a multi-step research plan based on intent.
        """
        intent = intent_data.get("intent")
        subject = intent_data.get("subject", query)

        # 1. Market Plan (Fixed Schema for Speed)
        if intent == "MARKET":
            return ExecutionPlan(
                original_query=query,
                subtasks=[
                    SubTask(id=1, description="Price", search_keywords=[subject], data_source="crypto"),
                    SubTask(id=2, description="Chart", search_keywords=[subject], data_source="crypto_chart"),
                    SubTask(id=3, description="Social Pulse", search_keywords=[subject], data_source="social_sentiment"),
                    SubTask(id=4, description="News", search_keywords=[subject], data_source="news")
                ]
            )

        # 2. Concept Plan (Dynamic Deep Dive)
        # We ask Gemini to structure the investigation
        prompt = f"""
        You are a Senior Research Architect.
        Create a 4-step execution plan to investigate the technical concept: "{subject}".
        
        The plan must include:
        1. A high-level definition (Source: wikipedia)
        2. A technical deep-dive into architecture/internals (Source: technical_docs)
        3. Real-world usage or social perception (Source: social_sentiment)
        4. Recent news or developments (Source: news)
        
        Output JSON:
        {{
            "subtasks": [
                {{ "id": 1, "description": "Fetch Definition", "data_source": "wikipedia", "search_keywords": ["{subject}"] }},
                {{ "id": 2, "description": "Analyze Architecture", "data_source": "technical_docs", "search_keywords": ["{subject}"] }},
                {{ "id": 3, "description": "Check Community Pulse", "data_source": "social_sentiment", "search_keywords": ["{subject}"] }},
                {{ "id": 4, "description": "Find Recent News", "data_source": "news", "search_keywords": ["{subject}"] }}
            ]
        }}
        """

        try:
            response = await asyncio.wait_for(
                self.model.generate_content_async(
                    prompt,
                    generation_config=genai.GenerationConfig(
                        response_mime_type="application/json",
                        temperature=0.2
                    )
                ),
                timeout=5.0
            )
            data = json.loads(response.text)
            subtasks = [SubTask(**t) for t in data.get("subtasks", [])]
            return ExecutionPlan(original_query=query, subtasks=subtasks)

        except Exception as e:
            logger.error(f"Planner Error: {e}")
            # Fallback Plan
            return ExecutionPlan(
                original_query=query,
                subtasks=[
                    SubTask(id=1, description="Definition", search_keywords=[subject], data_source="wikipedia"),
                    SubTask(id=2, description="Technical Depth", search_keywords=[subject], data_source="technical_docs"),
                    SubTask(id=3, description="Social", search_keywords=[subject], data_source="social_sentiment")
                ]
            )
