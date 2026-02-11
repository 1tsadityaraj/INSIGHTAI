import json
import asyncio
import google.generativeai as genai
from typing import Dict, Any
from app.core.config import get_settings
from app.models.schemas import ChatResponse, ChartData, DeepDiveSection, ConceptKPI
from app.utils.logger import logger

from app.services.ai_provider import MockAIProvider

settings = get_settings()
genai.configure(api_key=settings.GEMINI_API_KEY)

class SummarizerService:
    def __init__(self):
        self.model = genai.GenerativeModel(
            model_name=settings.GEMINI_MODEL,
            system_instruction="""
            You are a senior multi-source analyst.
            Synthesize a comprehensive report using Market, News, and Social data.
            
            Output JSON format:
            {
                "explanation": "Clear, concise 2-3 paragraph answer.",
                "insights": ["List of 3-5 key bullet points."],
                "asset": "bitcoin | ethereum | null",
                "chart_data": {
                    "title": "Chart Title",
                    "labels": ["Label A", "Label B"],
                    "values": [10, 20],
                    "x_label": "X Axis",
                    "y_label": "Y Axis"
                } OR null
            }
            
            Rules:
            - "asset": Identify the specific CoinGecko ID (e.g., 'bitcoin', 'ethereum') ONLY if valid market data exists in 'analysis'. 
            - CRITICAL: If 'analysis' or 'stats' contains "error", "not found", or is empty, set "asset" to null. Do NOT guess.
            - "chart_data": Create only if numerical history exists.
            - If the user query is conceptual (e.g., "What is DSA?"), set "asset" to null.
            """
        )
        self.mock_provider = MockAIProvider()

    async def summarize(self, query: str, analysis: Dict[str, Any]) -> ChatResponse:
        """
        Generates the final response with explanation, insights, and optional chart (Async).
        """
        logger.info("Summarizer: Generating response...")
        
        user_content = f"""
        User Query: {query}
        Analysis: {analysis.get('text_summary')}
        Stats: {analysis.get('key_stats')}
        """

        try:
            # 0. Check DEV_MODE
            if settings.DEV_MODE:
                logger.info("DEV_MODE: Using MockAIProvider.")
                return await self.mock_provider.generate_response(query, user_content)

            # Ultra-Fast Fallback logic
            max_retries = 1 
            for attempt in range(max_retries + 1):
                try:
                    # Enforce strict 5s timeout.
                    response = await asyncio.wait_for(
                        self.model.generate_content_async(
                            user_content,
                            generation_config=genai.GenerationConfig(
                                response_mime_type="application/json",
                                temperature=0.3
                            )
                        ),
                        timeout=5.0
                    )
                    break 
                except Exception as e:
                    if attempt < max_retries:
                        logger.warning(f"Summarizer API Slow/Error. Retrying...")
                        await asyncio.sleep(1)
                    else:
                        raise e
            
            data = json.loads(response.text)
            
            return ChatResponse(**data)

        except Exception as e:
            logger.error(f"Summarizer Error: {e}")
            
            # --- Tier 1 Fallback: Mock AI Provider (e.g. for 429 API Limit) ---
            try:
                logger.warning("Attempting MockAIProvider fallback due to API error...")
                return await self.mock_provider.generate_response(query, user_content)
            except Exception as mock_e:
                logger.error(f"Mock Provider Failed: {mock_e}")
            
            # --- Rule-Based Fallback ---
            # If AI fails (likely 429), try to provide a useful response from raw data.
            
            fallback_asset = None
            q_lower = query.lower()
            
            # 1. Detect Asset for Chart
            common_coins = {
                "bitcoin": "bitcoin", "btc": "bitcoin",
                "ethereum": "ethereum", "eth": "ethereum",
                "solana": "solana", "sol": "solana",
                "dogecoin": "dogecoin", "doge": "dogecoin",
                "cardano": "cardano", "ada": "cardano",
                "ripple": "ripple", "xrp": "ripple",
                "polkadot": "polkadot", "dot": "polkadot",
                "polygon": "polygon", "matic": "polygon",
                "chainlink": "chainlink", "link": "chainlink",
                "litecoin": "litecoin", "ltc": "litecoin",
                "shiba": "shiba-inu", "shib": "shiba-inu",
                "pepe": "pepe", "avax": "avalanche-2"
            }
            
            for key, val in common_coins.items():
                if key in q_lower:
                    fallback_asset = val
                    break
            
            # 2. Construct Explanation (User-Friendly Fallback)
            raw_summary = analysis.get("text_summary", "")
            
            if fallback_asset:
                # Case A: Market Query (Asset Detected) -> Show Chart
                explanation = f"I've pulled up the live **{fallback_asset.title()}** market data for you."
                insights_list = ["Live Chart Updated", "AI Analysis: Temporarily Unavailable"]
                
            elif raw_summary and len(raw_summary) > 10:
                # Case B: Concept Query (Wikipedia/Data Available) -> Show Info
                # Clean up the raw summary for display
                explanation = f"{raw_summary}\n\n*(Standard search result found while AI is busy)*"
                insights_list = ["Quick Definition", "Source: External Data"]
                
            else:
                # Case C: Unknown Query -> Help Message
                explanation = "I couldn't retrieve analysis for that query. Try asking about a specific coin like **Bitcoin** or **Solana**."
                insights_list = ["Tip: Check spelling", "Tip: Ask for specific assets"]

            return ChatResponse(
                explanation=explanation,
                insights=insights_list,
                asset=fallback_asset,
                chart_data=None
            )

    async def get_concept_info(self, term: str) -> Dict[str, Any]:
        """
        Directly uses Gemini to generate info for a non-crypto concept.
        Falls back to Wikipedia if AI is down.
        """
        prompt = f"""
        Explain the concept of "{term}" for a high-level analytics dashboard.
        
        Output exact JSON:
        {{
            "explanation": "2-3 paragraph comprehensive definition.",
            "chat_summary": "A 1-sentence concise version focusing on 'Why this matters now' for a chat window.",
            "insights": ["Supplementary Insight 1", "Supplementary Insight 2", "Supplementary Insight 3"],
            "concept_kpis": [
                {{"label": "Category", "value": "e.g., Software"}},
                {{"label": "Metric 2", "value": "e.g., Origin Year"}},
                {{"label": "Metric 3", "value": "e.g., Usage Level"}}
            ]
        }}
        """
        
        source_url = None
        wiki_extract = ""
        
        # Pre-fetch Wikipedia for better context and source link
        try:
            from app.services.fetcher import FetcherService
            f = FetcherService()
            wiki_data = await f._fetch_wikipedia(term)
            if "error" not in wiki_data:
                source_url = wiki_data.get("content_urls", {}).get("desktop", {}).get("page")
                wiki_extract = wiki_data.get("extract", "")
        except:
            pass

        # If we have wiki data, nudge Gemini to use it or augment it
        full_prompt = prompt
        if wiki_extract:
            full_prompt += f"\n\nContext from Wikipedia: {wiki_extract}"

        try:
            response = await asyncio.wait_for(
                self.model.generate_content_async(
                    full_prompt,
                    generation_config=genai.GenerationConfig(
                        response_mime_type="application/json",
                        temperature=0.2
                    )
                ),
                timeout=7.0
            )
            data = json.loads(response.text)
            data["source_url"] = source_url
            return data
            
        except Exception as e:
            logger.error(f"get_concept_info Error: {e}")
            
            # Robust Fallback
            if wiki_extract:
                return {
                    "explanation": wiki_extract,
                    "chat_summary": f"Wikipedia definition for {term}.",
                    "insights": ["Source: Wikipedia", "Direct Definition", "AI Analysis Unavailable"],
                    "concept_kpis": [
                        {"label": "Source", "value": "Wikipedia"},
                        {"label": "Type", "value": "Definition"},
                        {"label": "Topic", "value": term.title()}
                    ],
                    "source_url": source_url
                }

            return {
                "explanation": f"I couldn't retrieve information for '{term}' at this time.",
                "chat_summary": "System error fetching data.",
                "insights": ["Check connectivity", "Try a different term"],
                "concept_kpis": [],
                "source_url": None
            }

    async def summarize_concept_deep_dive(self, query: str, fetched_data: list) -> Dict[str, Any]:
        """
        Agents 2.0: Synthesizes a deep dive report from multiple fetched sources.
        """
        logger.info(f"Summarizer: Generating Deep Dive for '{query}'...")

        # 1. Aggregation
        wiki_data = next((item.data for item in fetched_data if item.source == "wikipedia"), {})
        tech_data_str = next((item.data for item in fetched_data if item.source == "technical_docs"), "{}")
        social_data = next((item.data for item in fetched_data if item.source == "social_sentiment"), {})
        news_data = next((item.data for item in fetched_data if item.source == "news"), {})
        
        # Parse technical data if it's a JSON string (from TechnicalProvider)
        tech_ops = {}
        if isinstance(tech_data_str, str):
            try:
                tech_ops = json.loads(tech_data_str)
            except:
                pass
        
        deep_dive_sections = tech_ops.get("deep_dive_sections", [])
        technical_kpis = tech_ops.get("technical_kpis", [])

        # 2. Main Synthesis Prompt
        prompt = f"""
        Synthesize a Research Report for "{query}".
        
        Context:
        - Definition: {wiki_data.get('extract', 'N/A')}
        - Technical Internals: {tech_ops}
        - Social Sentiment: {social_data}
        - Recent News: {news_data.get('headlines', [])}
        
        Output JSON:
        {{
            "explanation": "A comprehensive introductory overview (2 paragraphs).",
            "chat_summary": "A concise insight for the chat window.",
            "insights": ["High-level insight 1", "High-level insight 2", "High-level insight 3"],
            "concept_kpis": {technical_kpis if technical_kpis else "Generate 5 technical KPIs [Label, Value]"}
        }}
        """
        
        # Use AI to smooth out the edges if needed, OR just compose if data is good.
        # For speed/reliability, we'll try AI synthesis but fallback to direct mapping.
        
        try:
             response = await asyncio.wait_for(
                self.model.generate_content_async(
                    prompt,
                    generation_config=genai.GenerationConfig(
                        response_mime_type="application/json",
                        temperature=0.3
                    )
                ),
                timeout=8.0
            )
             data = json.loads(response.text)
        except Exception as e:
            logger.error(f"Deep Dive Synthesis Error: {e}")
            # Fallback Synthesis
            data = {
                "explanation": wiki_data.get('extract', f"Deep dive analysis for {query}."),
                "chat_summary": f"Analysis complete for {query}.",
                "insights": ["Data aggregated from multiple sources."],
                "concept_kpis": technical_kpis
            }
            
        return {
            "explanation": data.get("explanation"),
            "chat_summary": data.get("chat_summary"),
            "insights": data.get("insights", []),
            "concept_kpis": data.get("concept_kpis", []),
            "deep_dive": deep_dive_sections,
            "source_url": wiki_data.get("content_urls", {}).get("desktop", {}).get("page")
        }
