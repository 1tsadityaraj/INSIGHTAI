import asyncio
import os
import sys

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.planner import PlannerService
from app.services.fetcher import FetcherService
from app.services.market import MarketService

async def test_backend_flow():
    print("🚀 Starting Backend Flow Verification...")
    
    # 1. Test MarketService Direct
    print("\n🔹 Testing MarketService Direct...")
    market = MarketService()
    try:
        data = await market.get_market_chart("bitcoin", days=1)
        if "prices" in data and len(data["prices"]) > 0:
             print(f"✅ MarketService Chart Fetch Success: {len(data['prices'])} data points")
        else:
             print(f"❌ MarketService Chart Fetch Failed: {data}")
    except Exception as e:
        print(f"❌ MarketService Error: {e}")

    # 2. Test Planner Intent
    print("\n🔹 Testing Planner Intent for 'Show Bitcoin chart'...")
    planner = PlannerService()
    try:
        plan = planner.create_plan("Show me a chart of Bitcoin prices")
        chart_task = next((t for t in plan.subtasks if t.data_source == "crypto_chart"), None)
        if chart_task:
            print(f"✅ Planner correctly identified 'crypto_chart' intent: {chart_task.description}")
        else:
            print(f"❌ Planner failed to identify chart intent. Subtasks: {[t.data_source for t in plan.subtasks]}")
            return
    except Exception as e:
        print(f"❌ Planner Error: {e}")
        return

    # 3. Test Fetcher Execution
    print("\n🔹 Testing Fetcher Execution...")
    fetcher = FetcherService()
    try:
        results = await fetcher.execute_plan(plan)
        chart_result = next((r for r in results if r.source == "crypto_chart"), None)
        
        if chart_result and "prices" in chart_result.data:
            print(f"✅ Fetcher successfully retrieved chart data via MarketService")
        else:
            print(f"❌ Fetcher failed to retrieve chart data: {chart_result.data if chart_result else 'No result'}")

    except Exception as e:
        print(f"❌ Fetcher Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_backend_flow())
