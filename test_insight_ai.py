import os
# Mock env var before importing app config
os.environ["OPENAI_API_KEY"] = "sk-mock-key-for-testing"

from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.main import app
from app.models.schemas import ExecutionPlan, SubTask, FetchedData, AnalysisResult, ChatResponse

client = TestClient(app)

# Mock Data
MOCK_PLAN = ExecutionPlan(
    original_query="Explain Bitcoin",
    subtasks=[
        SubTask(id=1, description="Define Bitcoin", search_keywords=["Bitcoin definition"], data_source_type="general_knowledge"),
        SubTask(id=2, description="Get price", search_keywords=["bitcoin"], data_source_type="crypto_data")
    ]
)

MOCK_FETCHED_DATA = [
    FetchedData(source="Wikipedia", data={"summary": "Bitcoin is a decentralized digital currency."}),
    FetchedData(source="CoinGecko", data={"name": "Bitcoin", "current_price_usd": 50000, "price_change_percentage_24h": 2.5})
]

MOCK_RESPONSE_DICT = {
    "explanation": "Bitcoin is a digital currency. It is trading at $50,000.",
    "key_insights": ["Decentralized", "Price: $50k"],
    "chart_data": {"title": "Price", "labels": ["Now"], "values": [50000]}
}

@patch("app.modules.planner.service.PlannerService.create_plan")
@patch("app.modules.fetcher.service.FetcherService.execute_plan")
@patch("app.modules.summarizer.service.SummarizerService.summarize")
def test_chat_flow(mock_summarize, mock_execute_fetch, mock_create_plan):
    # Setup Mocks
    mock_create_plan.return_value = MOCK_PLAN
    mock_execute_fetch.return_value = MOCK_FETCHED_DATA
    mock_summarize.return_value = ChatResponse(**MOCK_RESPONSE_DICT)

    # Test Request
    response = client.post("/api/v1/chat", json={"query": "Explain Bitcoin"})
    
    # Assertions
    assert response.status_code == 200
    data = response.json()
    
    print("\n--- Test Response ---")
    print(data)
    print("---------------------")

    assert data["explanation"] == MOCK_RESPONSE_DICT["explanation"]
    assert len(data["key_insights"]) == 2
    assert "chart_data" in data
    
    # Verify calls
    mock_create_plan.assert_called_once()
    mock_execute_fetch.assert_called_once()
    mock_summarize.assert_called_once()
    
    print("\n✅ Verification Passed: Full flow logic is correct.")

if __name__ == "__main__":
    try:
        test_chat_flow()
    except AssertionError as e:
        print(f"\n❌ Verification Failed: {e}")
    except Exception as e:
        print(f"\n❌ An error occurred: {e}")
