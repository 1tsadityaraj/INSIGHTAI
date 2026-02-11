import asyncio
from typing import Dict, Any, List
import google.generativeai as genai
from app.core.config import get_settings
from app.utils.logger import logger

settings = get_settings()
genai.configure(api_key=settings.GEMINI_API_KEY)

class TechnicalProvider:
    """
    Simulates a specialized improved knowledge retrieval for deep technical concepts.
    Role: Senior Technical Writer / Architecture Extractor
    """
    def __init__(self):
        self.model = genai.GenerativeModel(
            model_name=settings.GEMINI_MODEL,
        )

    async def fetch_technical_details(self, topic: str) -> Dict[str, Any]:
        """
        Uses Gemini to hallucinate/retrieve "Technical Deep Dive" content
        mimicking a scrape of developer docs.
        """
        logger.info(f"TechnicalProvider: Deep diving into '{topic}'...")

        # Prompt designed to extract structured technical depth
        prompt = f"""
        Act as a Principal Engineer writing a technical deep-dive on: "{topic}".
        
        Generate a JSON response with 3 specific technical sections and 5 specific KPIs.
        
        Format:
        {{
            "deep_dive_sections": [
                {{
                    "title": "Architecture / Internals",
                    "content": "Detailed paragraph about how it works under the hood (threads, memory, consensus, etc).",
                    "icon": "server"
                }},
                {{
                    "title": "Performance Characteristics",
                    "content": "Big O notation, throughput limits, latency specs, or scalability analysis.",
                    "icon": "zap"
                }},
                {{
                    "title": "Real-World Use Case",
                    "content": "A concrete example of where this is used in FAANG/Enterprise (e.g. 'Netflix uses this for...').",
                    "icon": "briefcase"
                }}
            ],
            "technical_kpis": [
                {{"label": "Time Complexity", "value": "O(log n)"}},
                {{"label": "Concurrency", "value": "Thread-Safe"}},
                {{"label": "Protocol", "value": "TCP/UDP"}},
                {{"label": "Origin", "value": "Google (2004)"}},
                {{"label": "Type", "value": "Algorithm"}}
            ]
        }}
        """

        try:
            response = await asyncio.wait_for(
                self.model.generate_content_async(
                    prompt,
                    generation_config=genai.GenerationConfig(
                        response_mime_type="application/json",
                        temperature=0.4 # Slightly creative for good examples
                    )
                ),
                timeout=8.0
            )
            return response.text # Return raw JSON string for higher up parsing
            
        except Exception as e:
            logger.error(f"TechnicalProvider Error: {e}")
            return "{}"

