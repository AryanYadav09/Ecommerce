from fastapi import APIRouter
from app.models.schemas import RecommendationRequest, RecommendationResponse, RecommendationItem
from app.services.engine import recommender

router = APIRouter()

@router.post("/recommendations", response_model=RecommendationResponse)
async def get_recommendations(req: RecommendationRequest):
    results = recommender.recommend(
        catalog=req.catalog,
        user_id=req.user_id,
        product_id=req.product_id,
        events=req.events,
        limit=req.limit or 8
    )

    items = [RecommendationItem(**item) for item in results]

    return RecommendationResponse(
        user_id=req.user_id,
        recommendations=items,
        model="hybrid-content-collaborative"
    )
