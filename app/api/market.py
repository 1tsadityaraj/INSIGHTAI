from fastapi import APIRouter, HTTPException, Query
from app.services.market import MarketService
from typing import Optional

router = APIRouter()
market_service = MarketService()

@router.get("/market/{coin_id}")
async def get_market_data(
    coin_id: str, 
    days: Optional[int] = Query(30, description="Number of days for historical data")
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
    if not chart_data:
        # Failure Schema
        return {
            "kpi": kpi_data,
            "asset": coin_id,
            "chart_error": True,
            "message": "Market data unavailable"
        }

    # Success Schema
    return {
        "kpi": kpi_data,
        "asset": coin_id,
        "chart_data": chart_data
    }
