# InsightAI - Production-Ready AI Data Platform

## Setup

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Environment Configuration**:
   Create a `.env` file in the root directory:
   ```env
   OPENAI_API_KEY=sk-your-openai-api-key
   DEBUG=True
   ```

3. **Run the Server**:
   ```bash
   uvicorn app.main:app --reload
   ```

## Usage

**Endpoint**: `POST http://localhost:8000/api/v1/chat`

**Request**:
```json
{
  "query": "Explain Bitcoin and its current market trends"
}
```

**Response**:
```json
{
  "explanation": "Bitcoin is a decentralized digital currency...",
  "key_insights": [
    "Created by Satoshi Nakamoto in 2009.",
    "Current trading price is $ ...",
    "Market sentiment is bullish."
  ],
  "chart_data": {
    "title": "Bitcoin Price History",
    "labels": ["Jan", "Feb", "Mar"],
    "values": [42000, 45000, 48000]
  }
}
```

## Architecture

- **Planner**: Decomposes natural language queries into executable steps.
- **Fetcher**: Retrieves data from Wikipedia, CoinGecko (Crypto), or Simulated Market data.
- **Analyzer**: Uses Pandas to compute trends and statistics.
- **Summarizer**: Synthesizes a human-readable response.
