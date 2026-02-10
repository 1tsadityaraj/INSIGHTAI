import sys
import os
import unittest
from unittest.mock import MagicMock

# Add project root
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.summarizer import SummarizerService

class TestSummarizerFallback(unittest.TestCase):
    def setUp(self):
        self.service = SummarizerService()
        # Force the model to always raise an exception
        self.service.model.generate_content = MagicMock(side_effect=Exception("Simulated API Error"))

    def test_concept_fallback(self):
        print("\n🔹 Testing Concept Fallback (e.g. 'dollar')")
        query = "dollar"
        # Mock analysis with key text
        analysis = {"text_summary": "Wikipedia (Dollar): The dollar is common currency.", "key_stats": {}}
        
        response = self.service.summarize(query, analysis)
        
        print(f"Explanation: {response.explanation}")
        print(f"Insights: {response.insights}")
        
        self.assertIn("Standard search result", response.explanation)
        self.assertIn("Quick Definition", response.insights)
        self.assertIsNone(response.asset)

    def test_market_fallback(self):
        print("\n🔹 Testing Market Fallback (e.g. 'bitcoin')")
        query = "analyze bitcoin"
        # Mock analysis with some text
        analysis = {"text_summary": "Bitcoin price is 50k", "key_stats": {"Bitcoin Price": 50000}}
        
        response = self.service.summarize(query, analysis)
        
        print(f"Explanation: {response.explanation}")
        print(f"Insights: {response.insights}")
        
        self.assertIn("pulled up the live **Bitcoin**", response.explanation)
        self.assertIn("Live Chart Updated", response.insights)
        self.assertEqual(response.asset, "bitcoin")

    def test_unknown_fallback(self):
        print("\n🔹 Testing Unknown/Error Fallback (e.g. 'asdf')")
        query = "asdf"
        analysis = {} # No data found
        
        response = self.service.summarize(query, analysis)
        
        print(f"Explanation: {response.explanation}")
        print(f"Insights: {response.insights}")
        
        self.assertIn("couldn't retrieve analysis", response.explanation)
        self.assertIn("Tip: Check spelling", response.insights)

if __name__ == "__main__":
    unittest.main()
