from fastapi import APIRouter, HTTPException, Query, Request, BackgroundTasks, WebSocket, WebSocketDisconnect
from app.services.market import MarketService
from typing import Optional, List
from app.services.rate_limiter import limiter
import asyncio

router = APIRouter()
market_service = MarketService()

@router.get("/market/{coin_id}")
@limiter.limit("40/minute") # Increased for better DX
async def get_market_data(
    request: Request,
    coin_id: str, 
    background_tasks: BackgroundTasks,
    days: Optional[str] = Query("30", description="Number of days for historical data (1, 7, 30, 90, 365, max)")
):
    """
    Get market data, historical chart, and AI score for a specific coin.
    """
    # Unified fetch with Stale-While-Revalidate support
    data = await market_service.get_market_data(coin_id, days, background_tasks=background_tasks)
    
    kpi_data = data.get("kpi")
    chart_data = data.get("chart")
    market_score = data.get("market_score")
    
    # Error Handling
    if kpi_data and "error" in kpi_data:
        return {
            "kpi": None,
            "asset": coin_id,
            "chart_error": True,
            "message": f"Market Data Error: {kpi_data['error']}"
        }

    # Chart Validation
    if not chart_data or (isinstance(chart_data, dict) and "error" in chart_data):
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
        "chart_data": chart_data,
        "market_score": market_score
    }

@router.get("/compare")
@limiter.limit("10/minute")
async def compare_markets(
    request: Request,
    symbols: str = Query(..., description="Comma separated symbols (e.g. bitcoin,ethereum)"),
    range: str = Query("30", description="Range in days"),
    background_tasks: BackgroundTasks = None
):
    """
    Get normalized comparison data for multiple assets.
    """
    symbol_list = [s.strip() for s in symbols.split(",")]
    return await market_service.get_comparison_data(symbol_list, range, background_tasks)

@router.get("/heatmap")
@limiter.limit("30/minute") # Increased for better DX
async def market_heatmap(
    request: Request,
    limit: int = Query(10, le=50),
    background_tasks: BackgroundTasks = None
):
    """
    Get top coins heatmap data.
    """
    return await market_service.get_market_heatmap(limit, background_tasks)

@router.get("/explain")
@limiter.limit("5/minute")
async def explain_chart(
    request: Request,
    symbol: str, 
    days: str = "30",
    background_tasks: BackgroundTasks = None
):
    """
    Get AI-generated explanation for chart movement.
    """
    return await market_service.get_chart_explanation(symbol, days, background_tasks)
@router.websocket("/ws/{symbol}")
async def websocket_price_stream(websocket: WebSocket, symbol: str):
    await websocket.accept()
    try:
        while True:
            # Fetch latest price (relies on cache to protect API limits)
            # In a real app, a background worker would update cache frequently.
            data = await market_service.get_coin_data(symbol)
            
            if data and "current_price_usd" in data:
                await websocket.send_json({
                    "symbol": symbol,
                    "price": data.get("current_price_usd"), 
                    "change_24h": data.get("price_change_percentage_24h"),
                    "timestamp": asyncio.get_event_loop().time()
                })
            
            await asyncio.sleep(5)
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket Error: {e}")
        try:
            await websocket.close()
        except:
            pass
