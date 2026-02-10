from fastapi import APIRouter, HTTPException
from app.models.schemas import ChatRequest, UnifiedResponse, ExecutionPlan, SubTask
from app.services.planner import PlannerService
from app.services.fetcher import FetcherService
from app.services.analyzer import AnalyzerService
from app.services.summarizer import SummarizerService
from app.services.market import MarketService
from app.utils.logger import logger

router = APIRouter()

planner = PlannerService()
fetcher = FetcherService()
analyzer = AnalyzerService()
summarizer = SummarizerService()
market_service = MarketService()

@router.post("/chat", response_model=UnifiedResponse)
async def chat(request: ChatRequest):
    """
    Unified Chat Endpoint.
    Logic: Classify Intent -> Route (Market vs Concept) -> Standardized Response
    """
    try:
        query = request.query
        logger.info(f"API: Received query '{query}'")
        
        # 1. Intent Detection (Gemini)
        # Returns {"intent": "MARKET" | "CONCEPT", "subject": "string"}
        intent_data = await planner.get_query_intent(query)
        intent = intent_data.get("intent", "CONCEPT")
        subject = intent_data.get("subject", query)
        
        logger.info(f"API: Intent is {intent} for subject '{subject}'")

        if intent == "MARKET":
            # 2a. Dynamic Market Path
            asset_id = await market_service.search_coin(subject)
            
            if asset_id:
                # Build plan for Market Fetcher (Now with News and Social!)
                plan = ExecutionPlan(
                    original_query=query,
                    subtasks=[
                        SubTask(id=1, description="Price", search_keywords=[asset_id], data_source="crypto"),
                        SubTask(id=2, description="Chart", search_keywords=[asset_id], data_source="crypto_chart"),
                        SubTask(id=3, description="Social Pulse", search_keywords=[asset_id], data_source="social_sentiment"),
                        SubTask(id=4, description="News", search_keywords=[asset_id], data_source="news")
                    ]
                )
                fetched_data = await fetcher.execute_plan(plan)
                analysis = analyzer.analyze(fetched_data)
                
                # Extract news and social for the unified response
                social = next((item.data for item in fetched_data if item.source == "social_sentiment"), None)
                news = next((item.data for item in fetched_data if item.source == "news"), {"headlines": []})

                # AI synthesis
                ai_resp = await summarizer.summarize(query, analysis)
                
                return UnifiedResponse(
                    query=query,
                    type="market",
                    content=ai_resp.explanation,
                    chart_data=ai_resp.chart_data,
                    insights=ai_resp.insights,
                    social_sentiment=social,
                    news_headlines=news.get("headlines", []),
                    asset=asset_id,
                    is_error=False
                )

        # 2b. Concept Path (fallback for Market if fetch fails or explicit Concept)
        logger.info(f"API: Routing to Concept path for '{subject}'")
        
        # Build plan for Concept Fetcher (Wikipedia + Social + News)
        plan = ExecutionPlan(
            original_query=query,
            subtasks=[
                SubTask(id=1, description="Wikipedia", search_keywords=[subject], data_source="wikipedia"),
                SubTask(id=2, description="Social Pulse", search_keywords=[subject], data_source="social_sentiment"),
                SubTask(id=3, description="News", search_keywords=[subject], data_source="news")
            ]
        )
        fetched_data = await fetcher.execute_plan(plan)
        analysis = analyzer.analyze(fetched_data)
        
        # Use existing concept_info logic for the structured definition, but use summarize for the synthesis
        concept_info = await summarizer.get_concept_info(subject)
        ai_resp = await summarizer.summarize(query, analysis)
        
        # Extract news and social
        social = next((item.data for item in fetched_data if item.source == "social_sentiment"), None)
        news = next((item.data for item in fetched_data if item.source == "news"), {"headlines": []})

        return UnifiedResponse(
            query=query,
            type="concept",
            content=ai_resp.explanation, # Use the multi-source AI synthesis here!
            chat_summary=concept_info.get("chat_summary"),
            chart_data=None,
            insights=ai_resp.insights, # Use multi-source insights
            concept_kpis=concept_info.get("concept_kpis", []),
            social_sentiment=social,
            news_headlines=news.get("headlines", []),
            source_url=concept_info.get("source_url"),
            asset=None,
            is_error=False
        )

    except Exception as e:
        logger.error(f"API Error: {str(e)}", exc_info=True)
        return UnifiedResponse(
            query=request.query,
            type="error",
            content="Search unavailable. Please try again with a specific asset or term.",
            is_error=True
        )
