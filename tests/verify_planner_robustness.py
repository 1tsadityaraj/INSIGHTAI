import asyncio
import os
import sys
import logging

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.services.planner import PlannerService

# Configure logging
logging.basicConfig(level=logging.INFO)

def test_planner_robustness():
    print("🚀 Testing Planner Robustness...")
    planner = PlannerService()
    
    # Test 1: Conceptual Query (should be wikipedia)
    q1 = "Explain DSA concepts"
    print(f"\n🔹 Query 1: '{q1}'")
    try:
        plan1 = planner.create_plan(q1)
        source1 = plan1.subtasks[0].data_source
        print(f"👉 Source: {source1}")
        if source1 == "wikipedia":
            print("✅ PASS: Correctly identified as Wikipedia.")
        else:
            print(f"❌ FAIL: Expected wikipedia, got {source1}")
    except Exception as e:
        print(f"❌ Error: {e}")

    # Test 2: Market Query (should be crypto)
    q2 = "Analyze Bitcoin price"
    print(f"\n🔹 Query 2: '{q2}'")
    try:
        plan2 = planner.create_plan(q2)
        source2 = plan2.subtasks[0].data_source
        print(f"👉 Source: {source2}")
        if "crypto" in source2:
            print("✅ PASS: Correctly identified as Crypto.")
        else:
            print(f"❌ FAIL: Expected crypto, got {source2}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_planner_robustness()
