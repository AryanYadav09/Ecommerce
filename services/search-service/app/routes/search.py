from fastapi import APIRouter
from app.models.schemas import SearchRequest, SearchResponse, ParsedIntent
from app.services.search_engine import search_engine

router = APIRouter()

@router.post("/search", response_model=SearchResponse)
async def perform_search(req: SearchRequest):
    intent_dict, results = search_engine.search(
        query=req.query,
        catalog=req.catalog,
        limit=req.limit or 20
    )

    return SearchResponse(
        query=req.query,
        parsed_intent=ParsedIntent(**intent_dict),
        total_matches=len(results),
        results=results
    )
