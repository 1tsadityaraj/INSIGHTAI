import asyncio
import os
import sys

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.planner import PlannerService

def test_planner_intent():
    print("🚀 Testing Planner Intent Classification...")
    planner = PlannerService()
    
    queries = [
        "Visualize Bitcoin price trends",
        "What is DSA in computer science?",
        "Show me Ethereum chart",
        "Explain binary search algorithms"
    ]
    
    for q in queries:
        print(f"\n🔹 Query: '{q}'")
        try:
            plan = planner.create_plan(q)
            # Check the first subtask's source
            if not plan.subtasks:
                print("❌ No subtasks found")
                continue
                
            source = plan.subtasks[0].data_source
            print(f"👉 Source: {source}")
            
            if "DSA" in q or "binary" in q:
                if source == "wikipedia":
                    print("✅ Correct: Classified as CONCEPT (wikipedia)")
                else:
                    print(f"❌ Incorrect: Classified as {source} (Expected wikipedia)")
            elif "Bitcoin" in q or "Ethereum" in q:
                if "crypto" in source:
                    print("✅ Correct: Classified as MARKET (crypto)")
                else:
                    print(f"❌ Incorrect: Classified as {source} (Expected crypto)")
                    
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_planner_intent()
