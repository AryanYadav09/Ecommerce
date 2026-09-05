from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.recommendations import router as rec_router

app = FastAPI(
    title="AI Product Recommendation Microservice",
    description="Microservice computing personalized product recommendations via content-based and collaborative filtering",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(rec_router)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "recommendation-service",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8001, reload=True)
