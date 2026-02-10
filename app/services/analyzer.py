import pandas as pd
from typing import List, Dict, Any
from app.models.schemas import FetchedData
from app.utils.logger import logger

class AnalyzerService:
    def analyze(self, fetched_data: List[FetchedData]) -> Dict[str, Any]:
        """
        Analyzes fetched data to extract key statistics and trends.
        """
        logger.info("Analyzer: Processing data...")
        
        summary_text = []
        stats = {}
        
        for item in fetched_data:
            source = item.source
            data = item.data
            
            if "error" in data:
                continue

            # Text Analysis (Simple concatenation for LLM context)
            if source == "wikipedia":
                title = data.get("title", "Unknown")
                extract = data.get("extract", "")
                summary_text.append(f"Wikipedia ({title}): {extract}")

            # Numeric Analysis
            elif source in ["crypto", "stock_mock"]:
                try:
                    df = pd.DataFrame([data])
                    
                    # Store key stats
                    if "current_price_usd" in df.columns:
                        price = df.iloc[0]["current_price_usd"]
                        name = df.iloc[0].get("name", "Crypto")
                        stats[f"{name} Price"] = price
                        
                        # Trend
                        change = df.iloc[0].get("price_change_percentage_24h", 0)
                        trend = "UP" if change > 0 else "DOWN"
                        summary_text.append(f"{name} is {trend} by {change:.2f}% in 24h.")

                    if "price" in df.columns:
                        ticker = df.iloc[0].get("ticker", "Stock")
                        price = df.iloc[0]["price"]
                        stats[f"{ticker} Price"] = price
                except Exception as e:
                    logger.error(f"Pandas Error: {e}")

            elif source == "social_sentiment":
                score = data.get("score", 0.5)
                status = data.get("status", "Neutral")
                vol = data.get("volume_24h", 0)
                stats["Global Sentiment"] = f"{status} ({score*100:.0f}%)"
                stats["Social Volume"] = vol
                summary_text.append(f"Social Pulse: {status} with {vol} active mentions across X/Reddit.")

            elif source == "news":
                headlines = data.get("headlines", [])
                titles = [h.get("title") for h in headlines[:3] if h.get("title")]
                if titles:
                    summary_text.append(f"Recent Developments: {', '.join(titles)}")
                    stats["News Activity"] = "High" if len(titles) >= 3 else "Moderate"

        return {
            "text_summary": "\n".join(summary_text),
            "key_stats": stats,
            "raw_data_count": len(fetched_data)
        }
