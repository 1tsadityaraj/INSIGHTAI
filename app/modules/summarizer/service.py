import json
from openai import OpenAI
from app.core.config import get_settings
from app.models.schemas import AnalysisResult, ChatResponse, ChartData
from app.core.logger import logger

settings = get_settings()

class SummarizerService:
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_MODEL

    def summarize(self, query: str, analysis: AnalysisResult) -> ChatResponse:
        """
        Synthesizes the analysis into a user-friendly response.
        """
        logger.info("Generating summary...")

        system_prompt = """
        You are a senior data analyst.
        Your goal is to synthesize structured analysis data into a clear, helpful response for a user.

        Input:
        - User Query
        - Analysis text
        - Key statistics
        - Trends
        
        Output:
        - 'explanation': A coherent, natural language answer (2-3 paragraphs).
        - 'key_insights': A list of 3-5 distinct bullet points highlighting the most important facts.
        - 'chart_data': Optional. If the data contains numerical comparisons or trends, provide chart data (labels and values) for a bar or line chart. If no suitable data, return null.

        Return valid JSON matching the ChatResponse schema.
        """

        user_prompt = f"""
        Query: {query}
        
        Analysis Summary: {analysis.summary}
        Key Stats: {analysis.key_statistics}
        Trends: {analysis.trends}
        """

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.3
            )

            content = response.choices[0].message.content
            response_dict = json.loads(content)
            
            # Validation / conversion to Pydantic model
            return ChatResponse(**response_dict)

        except Exception as e:
            logger.error(f"Summarization failed: {e}")
            # Fallback
            return ChatResponse(
                explanation="I gathered the data but couldn't generate a summary due to an internal error.",
                key_insights=["Error: Summarization service failure."],
                chart_data=None
            )
