import os
from typing import List
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    APP_NAME: str = "InsightAI"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api/v1"
    
    # AI Configuration (Google Gemini)
    GEMINI_API_KEY: str
    GEMINI_MODEL: str = "gemini-flash-lite-latest" 
    
    
    # App Environment
    DEBUG: bool = True
    DEV_MODE: bool = False  # If True, forces use of MockAIProvider
    
    # Redis Configuration
    REDIS_URL: str = "redis://localhost:6379/0"

    # CORS Configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://insightai-five.vercel.app",
        "https://insightai-teal.vercel.app"
    ]
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow" # Allow extra fields like REDIS_URL from env

@lru_cache()
def get_settings():
    return Settings()
