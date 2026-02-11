from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field

# --- Internal Models (Available for Reference) ---

class SubTask(BaseModel):
    id: int
    description: str
    search_keywords: List[str]
    data_source: str  # e.g. "wikipedia", "crypto", "stock_mock", "technical_docs"

class ExecutionPlan(BaseModel):
    original_query: str
    subtasks: List[SubTask]

class FetchedData(BaseModel):
    source: str
    data: Any

# --- Request/Response Models ---

class ChatRequest(BaseModel):
    query: str = Field(..., min_length=2, description="User's natural language query")

class ChartData(BaseModel):
    title: str
    labels: List[str]
    values: List[float]
    x_label: Optional[str] = None
    y_label: Optional[str] = None

class ConceptKPI(BaseModel):
    label: str
    value: str

class DeepDiveSection(BaseModel):
    title: str
    content: str
    icon: Optional[str] = None  # e.g. "code", "book", "server"

class UnifiedResponse(BaseModel):
    query: str
    type: str = Field(..., description="'market', 'concept', or 'error'")
    content: str
    chat_summary: Optional[str] = None
    chart_data: Optional[ChartData] = None
    insights: List[str] = Field(default_factory=list)
    concept_kpis: List[ConceptKPI] = Field(default_factory=list)
    social_sentiment: Optional[Dict[str, Any]] = None
    news_headlines: List[Dict[str, Any]] = Field(default_factory=list)
    source_url: Optional[str] = None
    asset: Optional[str] = None
    is_error: bool = False
    
    # New Multi-Step Agent Fields
    research_plan: List[SubTask] = Field(default_factory=list)
    deep_dive: List[DeepDiveSection] = Field(default_factory=list)

class ChatResponse(BaseModel):
    explanation: str
    insights: List[str] = Field(default_factory=list)
    asset: Optional[str] = Field(None, description="CoinGecko ID of the cryptocurrency if relevant, else null")
    chart_data: Optional[ChartData] = None
