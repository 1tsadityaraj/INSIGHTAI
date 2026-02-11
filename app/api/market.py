from fastapi import APIRouter, HTTPException, Query, Request
from app.services.market import MarketService
from typing import Optional
from app.services.rate_limiter import limiter

router = APIRouter()
market_service = MarketService()

@router.get("/market/{coin_id}")
@limiter.limit("20/minute") # Strict limit for free Tier
async def get_market_data(
    request: Request,
    coin_id: str, 
    days: Optional[str] = Query("30", description="Number of days for historical data (1, 7, 30, 90, 365, max)")
):
    """
    Get market data and historical chart data for a specific coin.
    """
    # 1. Fetch Current KPI Data
    kpi_data = await market_service.get_coin_data(coin_id)
    
    if "error" in kpi_data:
        # Resolve to standard failure schema even if KPI fails
        return {
            "kpi": None,
            "asset": coin_id,
            "chart_error": True,
            "message": f"Market Data Error: {kpi_data['error']}"
        }

    # 2. Fetch Chart Data (Returns {labels, values} or None)
    chart_data = await market_service.get_market_chart(coin_id, days)
    
    # 🔒 STRICT SCHEMA CONTRACT
    if not chart_data or (isinstance(chart_data, dict) and "error" in chart_data):
        # Failure Schema
        error_msg = chart_data["error"] if chart_data and "error" in chart_data else "Market data unavailable"
        return {
            "kpi": kpi_data,
            "asset": coin_id,
            "chart_error": True,
            "message": error_msg
        }

    # Success Schema
    return {
        "kpi": kpi_data,
        "asset": coin_id,
        "chart_data": chart_data
    }
