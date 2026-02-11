
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from typing import List
from app.services.watchlist import WatchlistService
from app.services.market import MarketService

router = APIRouter()
watchlist_service = WatchlistService()
market_service = MarketService()

class WatchlistAddRequest(BaseModel):
    asset_id: str

@router.get("/watchlist", response_model=List[str])
async def get_watchlist():
    return await watchlist_service.get_watchlist()

@router.post("/watchlist", response_model=List[str])
async def add_to_watchlist(req: WatchlistAddRequest):
    # Validate asset exists
    exists = await market_service.get_coin_data(req.asset_id)
    if "error" in exists:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    return await watchlist_service.add_asset(req.asset_id)

@router.delete("/watchlist/{asset_id}", response_model=List[str])
async def remove_from_watchlist(asset_id: str):
    return await watchlist_service.remove_asset(asset_id)
