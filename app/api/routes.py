from fastapi import APIRouter, HTTPException
from app.models.schemas import ChatRequest, ChatResponse
from app.modules.planner.service import PlannerService
from app.modules.fetcher.service import FetcherService
from app.modules.analyzer.service import AnalyzerService
from app.modules.summarizer.service import SummarizerService
from app.core.logger import logger

router = APIRouter()

# Instantiate services (Singleton pattern via module scope)
planner = PlannerService()
fetcher = FetcherService()
analyzer = AnalyzerService()
summarizer = SummarizerService()

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Main entry point for the InsightAI chatbot.
    """
    try:
        query = request.query
        logger.info(f"Received query: {query}")

        # 1. PLAN
        plan = planner.create_plan(query)
        logger.debug(f"Plan created: {plan}")

        # 2. FETCH
        fetched_data = await fetcher.execute_plan(plan)
        logger.debug(f"Fetched {len(fetched_data)} data points")

        # 3. ANALYZE
        analysis_result = analyzer.analyze(fetched_data)
        logger.debug("Analysis complete")

        # 4. SUMMARIZE
        response = summarizer.summarize(query, analysis_result)
        logger.info("Response generated successfully")

        return response

    except Exception as e:
        logger.error(f"Error processing request: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal Server Error processing your request.")
