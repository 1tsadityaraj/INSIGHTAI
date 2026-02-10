import pandas as pd
from typing import List, Dict, Any
from app.models.schemas import FetchedData, AnalysisResult
from app.core.logger import logger

class AnalyzerService:
    def analyze(self, fetched_data_list: List[FetchedData]) -> AnalysisResult:
        """
        Process raw fetched data using Pandas.
        """
        logger.info("Analyzing fetched data...")
        
        summary_parts = []
        key_stats = {}
        trends = []
        raw_snapshots = []

        for item in fetched_data_list:
            source = item.source
            data = item.data
            
            # Store raw snapshot
            raw_snapshots.append({"source": source, "data": data})

            if source == "general_knowledge" or source == "Wikipedia":
                # Textual analysis (simple for now)
                if "summary" in data:
                    summary_parts.append(f"From {source}: {data['summary'][:200]}...")
            
            elif source in ["crypto_data", "market_data", "CoinGecko", "MarketData (Simulated)"]:
                # Numerical analysis
                # We'll create a mini DataFrame to demonstrate pandas usage
                try:
                    df = pd.DataFrame([data])
                    
                    # Example logic: specific to CoinGecko structure
                    if "current_price_usd" in df.columns:
                        price = df.iloc[0]["current_price_usd"]
                        key_stats[f"{data.get('name', 'Asset')} Price"] = f"${price}"
                    
                    if "price_change_percentage_24h" in df.columns:
                        change = df.iloc[0]["price_change_percentage_24h"]
                        trend_direction = "UP" if change > 0 else "DOWN"
                        trends.append(f"{data.get('name', 'Asset')} is {trend_direction} ({change:.2f}%) in the last 24h.")
                    
                    # Example logic: specific to Mock Market structure
                    if "price" in df.columns and "change_percent" in df.columns:
                         price = df.iloc[0]["price"]
                         change = df.iloc[0]["change_percent"]
                         trend_direction = "bullish" if change > 0 else "bearish"
                         trends.append(f"Market sentiment for {data.get('ticker')} is {trend_direction} ({change}%)")
                         key_stats[f"{data.get('ticker')} Price"] = f"${price}"
                         
                except Exception as e:
                    logger.error(f"Pandas analysis failed for {source}: {e}")

        combined_summary = "\n".join(summary_parts) if summary_parts else "No textual summary available."
        
        return AnalysisResult(
            summary=combined_summary,
            key_statistics=key_stats,
            trends=trends,
            raw_data_snapshot=raw_snapshots
        )
