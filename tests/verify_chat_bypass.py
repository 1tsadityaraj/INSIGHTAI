import unittest
from unittest.mock import MagicMock, AsyncMock, patch
import json
import asyncio

# Adjust path
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.api.chat import chat
from app.models.schemas import ChatRequest, ExecutionPlan, SubTask

class TestChatPipeline(unittest.IsolatedAsyncioTestCase):
    
    @patch('app.api.chat.planner')
    @patch('app.api.chat.fetcher')
    @patch('app.api.chat.analyzer')
    @patch('app.api.chat.summarizer')
    async def test_concept_bypass(self, mock_summarizer, mock_analyzer, mock_fetcher, mock_planner):
        print("\n🔹 Testing Concept Query Bypass")
        
        # 1. Setup Mock Plan (Concept Intent)
        mock_plan = ExecutionPlan(
            original_query="Explain DSA",
            subtasks=[
                SubTask(id=1, description="Fetch DSA", search_keywords=["dsa"], data_source="wikipedia")
            ]
        )
        mock_planner.create_plan.return_value = mock_plan
        
        # 2. Setup Mock Fetch (doesn't matter what it returns, analyzer input)
        # Fix: execute_plan is async, so it must return a Future
        future = asyncio.Future()
        future.set_result([])
        mock_fetcher.execute_plan.return_value = future
        
        # 3. Setup Mock Analysis (Return some text)
        mock_analysis = {"text_summary": "DSA stands for Data Structures and Algorithms.", "key_stats": {}}
        mock_analyzer.analyze.return_value = mock_analysis
        
        # 4. Call API
        request = ChatRequest(query="Explain DSA")
        response = await chat(request)
        
        # 5. Verify
        print(f"Response Explanation: {response.explanation}")
        
        # Assert Summarizer was NOT called
        mock_summarizer.summarize.assert_not_called()
        print("✅ Summarizer was correctly bypassed.")
        
        # Assert Response matches Analysis
        self.assertEqual(response.explanation, "DSA stands for Data Structures and Algorithms.")
        self.assertEqual(response.insights, ["Source: Wikipedia", "Direct Definition"])
        print("✅ Response content is correct.")

if __name__ == "__main__":
    unittest.main()
