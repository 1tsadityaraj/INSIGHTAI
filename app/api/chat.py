from fastapi import APIRouter, HTTPException, Request
from app.models.schemas import ChatRequest, UnifiedResponse, ExecutionPlan, SubTask
from app.services.planner import PlannerService
from app.services.fetcher import FetcherService
from app.services.analyzer import AnalyzerService
from app.services.summarizer import SummarizerService
from app.services.market import MarketService
from app.utils.logger import logger
from app.services.rate_limiter import limiter

from app.core.config import get_settings
from app.services.ai_provider import MockAIProvider

router = APIRouter()
settings = get_settings()
mock_provider = MockAIProvider()

planner = PlannerService()
fetcher = FetcherService()
analyzer = AnalyzerService()
summarizer = SummarizerService()
market_service = MarketService()

@router.post("/chat", response_model=UnifiedResponse)
@limiter.limit("5/minute") # Strict 5 req/min for expensive AI calls
async def chat(request: Request, body: ChatRequest):
    """
    Unified Chat Endpoint.
    Logic: Classify Intent -> Route (Market vs Concept vs Comparison vs Forex) -> Standardized Response
    """
    try:
        query = body.query
        logger.info(f"API: Received query '{query}'")
        
        # 0. DEV_MODE Orchestration Bypass
        if settings.DEV_MODE:
             logger.warning(" DEV_MODE is ACTIVE. Bypassing external APIs.")
             return await mock_provider.get_unified_response(query)
        
        # 1. Intent Detection (Gemini)
        # Returns {"intent": "MARKET" | "CONCEPT" | "COMPARISON" | "FOREX", "subject": ..., "assets": ...}
        intent_data = await planner.get_query_intent(query)
        intent = intent_data.get("intent", "CONCEPT")
        subject = intent_data.get("subject", query)
        
        logger.info(f"API: Intent is {intent} for subject '{subject}'")

        # 3. COMPARISON MODE
        if intent == "COMPARISON":
            assets = intent_data.get("assets", [])
            comparison_results = []
            
            # Fetch data for each asset
            for asset_name in assets:
                # Resolve ID
                coin_id = await market_service.search_coin(asset_name)
                if coin_id:
                    chart = await market_service.get_market_chart(coin_id, days="30")
                    kpi = await market_service.get_coin_data(coin_id)
                    
                    if chart and kpi:
                        comparison_results.append({
                            "symbol": kpi.get("symbol", asset_name).upper(),
                            "name": kpi.get("name", asset_name),
                            "chart_data": chart,
                            "current_price": kpi.get("current_price_usd"),
                            "market_cap": kpi.get("market_cap_usd")
                        })
            
            return UnifiedResponse(
                query=query,
                type="comparison",
                content=f"Comparing {', '.join(assets)} based on recent market data.",
                comparison_assets=comparison_results,
                research_plan=[] # No complex plan for simple comparison yet
            )

        # 4. FOREX MODE
        if intent == "FOREX":
            base = intent_data.get("base", "USD")
            target = intent_data.get("target", "EUR")
            
            rate_data = await market_service.get_forex_rate(base, target)
            chart_data = await market_service.get_forex_chart(base, target, days="30")
            
            return UnifiedResponse(
                query=query,
                type="forex",
                content=f"Current exchange rate for {base}/{target}.",
                forex_data={
                    "rate": rate_data,
                    "chart": chart_data
                },
                research_plan=[]
            )

        if intent == "MARKET":
            # 2a. Dynamic Market Path (Planner now handles structure)
            asset_id = await market_service.search_coin(subject)
            
            if asset_id:
                # Update Intent Data with precise subject
                intent_data['subject'] = asset_id
                plan = await planner.create_plan(query, intent_data)
                
                fetched_data = await fetcher.execute_plan(plan)
                analysis = analyzer.analyze(fetched_data)
                
                # Extract news and social for the unified response
                social = next((item.data for item in fetched_data if item.source == "social_sentiment"), None)
                news = next((item.data for item in fetched_data if item.source == "news"), {"headlines": []})

                # AI synthesis
                ai_resp = await summarizer.summarize(query, analysis)
                
                return UnifiedResponse(
                    # Passing query, type, plan for UI progress
                    query=query,
                    type="market",
                    research_plan=plan.subtasks,
                    content=ai_resp.explanation,
                    chart_data=ai_resp.chart_data,
                    insights=ai_resp.insights,
                    social_sentiment=social,
                    news_headlines=news.get("headlines", []),
                    asset=asset_id,
                    is_error=False
                )

        # 2b. Concept Path (Multi-Step Deep Dive)
        logger.info(f"API: Routing to Concept path for '{subject}'")
        
        # Generative Planning
        plan = await planner.create_plan(query, intent_data)
        
        # execute
        fetched_data = await fetcher.execute_plan(plan)
        
        # Deep Synthesis
        deep_analysis = await summarizer.summarize_concept_deep_dive(subject, fetched_data)
        
        # Extract news and social
        social = next((item.data for item in fetched_data if item.source == "social_sentiment"), None)
        news = next((item.data for item in fetched_data if item.source == "news"), {"headlines": []})

        return UnifiedResponse(
            query=query,
            type="concept",
            research_plan=plan.subtasks,
            content=deep_analysis.get("explanation"), 
            chat_summary=deep_analysis.get("chat_summary"),
            chart_data=None,
            insights=deep_analysis.get("insights", []), 
            concept_kpis=deep_analysis.get("concept_kpis", []),
            deep_dive=deep_analysis.get("deep_dive", []), # Detailed technical sections
            social_sentiment=social,
            news_headlines=news.get("headlines", []),
            source_url=deep_analysis.get("source_url"),
            asset=None,
            is_error=False
        )

    except Exception as e:
        logger.error(f"API Error: {str(e)}", exc_info=True)
        # Fallback to Mock Provider on critical failure (e.g. 429, Network)
        logger.warning("Critical Error encountered. Falling back to Mock Orchestrator.")
        return await mock_provider.get_unified_response(query)
