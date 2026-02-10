import os
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
    
    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings():
    return Settings()
