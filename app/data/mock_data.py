
import datetime
import random

def generate_chart_data(start_price, volatility=0.02, days=30):
    prices = []
    current = start_price
    for i in range(days * 24): # hourly points? or daily. Let's do daily for simplicity of static data
        change = current * random.uniform(-volatility, volatility)
        current += change
        prices.append([
            (datetime.datetime.now() - datetime.timedelta(hours=days*24 - i)).timestamp() * 1000, 
            current
        ])
    return prices

# Static snapshots for consistency
MOCK_BITCOIN = {
    "kpi": {
        "name": "Bitcoin (Demo)",
        "symbol": "BTC",
        "current_price_usd": 68450.25,
        "market_cap_usd": 1350000000000,
        "price_change_percentage_24h": 2.45,
        "total_volume_usd": 45000000000,
        "high_24h": 69000.00,
        "low_24h": 67200.00,
        "last_updated": datetime.datetime.now().isoformat()
    },
    "market_score": {
        "score": 78,
        "status": "Strong Buy",
        "components": {
            "heatmap": 15,
            "rsi": 18,
            "macd": 20,
            "volatility": 15,
            "sentiment": 10
        }
    }
}

MOCK_NVIDIA = {
    "kpi": {
        "name": "NVIDIA Corp (Demo)",
        "symbol": "NVDA",
        "current_price_usd": 142.50,
        "market_cap_usd": 3500000000000,
        "price_change_percentage_24h": 1.85,
        "total_volume_usd": 25000000000,
        "high_24h": 144.00,
        "low_24h": 139.50,
        "last_updated": datetime.datetime.now().isoformat()
    },
    "market_score": {
        "score": 85,
        "status": "Strong Buy",
        "components": {
            "heatmap": 20,
            "rsi": 15,
            "macd": 20,
            "volatility": 10,
            "sentiment": 20
        }
    }
}

MOCK_USD_INR = {
    "kpi": {
        "name": "USD / INR (Demo)",
        "symbol": "USDINR",
        "current_price_usd": 84.12, # Technically rate
        "market_cap_usd": 0,
        "price_change_percentage_24h": 0.05,
        "total_volume_usd": 0,
        "high_24h": 84.15,
        "low_24h": 84.08,
        "last_updated": datetime.datetime.now().isoformat()
    },
    "market_score": {
        "score": 50,
        "status": "Neutral",
        "components": {
            "heatmap": 10,
            "rsi": 10,
            "macd": 10,
            "volatility": 20, # Very stable
            "sentiment": 0
        }
    }
}

def get_mock_data(coin_id):
    if coin_id == "demo-bitcoin":
        base = MOCK_BITCOIN
        # Regen chart to look fresh
        prices = generate_chart_data(65000, 0.03) 
        return base, prices
    elif coin_id == "demo-nvidia":
        base = MOCK_NVIDIA
        prices = generate_chart_data(130, 0.015)
        return base, prices
    elif coin_id == "demo-usdinr":
        base = MOCK_USD_INR
        prices = generate_chart_data(84.0, 0.001)
        return base, prices
    return None, None
