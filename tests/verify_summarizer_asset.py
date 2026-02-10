import asyncio
import os
import sys

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.summarizer import SummarizerService

async def test_summarizer_dynamic_asset():
    print("🚀 Starting Summarizer Asset Detection Verification...")
    
    summarizer = SummarizerService()
    
    # Test Case 1: Crypto Query
    query_crypto = "Analyze Bitcoin price trends"
    print(f"\n🔹 Testing Query: '{query_crypto}'")
    mock_analysis = {
        "text_summary": "Bitcoin is showing volatility.",
        "key_stats": {"price": 50000}
    }
    try:
        response = summarizer.summarize(query_crypto, mock_analysis)
        print(f"Response Asset: {response.asset}")
        if response.asset == "bitcoin":
             print("✅ Success: Detected 'bitcoin'")
        else:
             print(f"❌ Failed: Expected 'bitcoin', got '{response.asset}'")
    except Exception as e:
        print(f"❌ Error: {e}")

    # Test Case 2: Non-Crypto Query
    query_generic = "What is DSA in computer science?"
    print(f"\n🔹 Testing Query: '{query_generic}'")
    mock_analysis_generic = {
        "text_summary": "Data Structures and Algorithms...",
        "key_stats": {}
    }
    try:
        response = summarizer.summarize(query_generic, mock_analysis_generic)
        print(f"Response Asset: {response.asset}")
        if response.asset is None:
             print("✅ Success: Detected None (conceptual)")
        else:
             print(f"❌ Failed: Expected None, got '{response.asset}'")

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_summarizer_dynamic_asset())
