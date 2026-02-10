from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.chat import router as chat_router
from app.api.market import router as market_router
from app.core.config import get_settings
from app.utils.logger import logger

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="InsightAI Production Backend",
    docs_url="/docs",  # Explicitly enable Swagger UI
    redoc_url="/redoc",  # Explicitly enable ReDoc
    openapi_url="/openapi.json"  # Explicitly enable OpenAPI schema
)

# CORS Configuration
# Allowing localhost:5173 for the React Frontend
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routes
app.include_router(chat_router, prefix=settings.API_PREFIX) # /api/v1/chat
app.include_router(market_router, prefix=settings.API_PREFIX) # /api/v1/market

@app.get("/")
def health_check():
    return {"status": "ok", "app": settings.APP_NAME}

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting InsightAI Backend...")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=settings.DEBUG)
