from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class SearchRequest(BaseModel):
    query: str
    user_id: Optional[str] = None
    limit: Optional[int] = 20
    catalog: List[Dict[str, Any]] = []

class ParsedIntent(BaseModel):
    max_price: Optional[float] = None
    min_price: Optional[float] = None
    category: Optional[str] = None
    sub_category: Optional[str] = None
    size: Optional[str] = None
    keywords: List[str] = []
    sort_preference: Optional[str] = None

class SearchResultItem(BaseModel):
    product_id: str
    name: str
    price: float
    category: str
    subCategory: Optional[str] = None
    score: float
    match_reasons: List[str] = []
    product: Dict[str, Any]

class SearchResponse(BaseModel):
    query: str
    parsed_intent: ParsedIntent
    total_matches: int
    results: List[Dict[str, Any]]
