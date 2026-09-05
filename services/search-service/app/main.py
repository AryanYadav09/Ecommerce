from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.search import router as search_router

app = FastAPI(
    title="AI Intelligent Product Search Microservice",
    description="Microservice providing natural language intent parsing, price constraint filtering, and semantic product search",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search_router)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "search-service",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8002, reload=True)
