from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ProductItem(BaseModel):
    id: Optional[str] = None
    _id: Optional[str] = None
    name: str
    description: Optional[str] = ""
    category: Optional[str] = "General"
    subCategory: Optional[str] = "General"
    price: Optional[float] = 0.0
    bestseller: Optional[bool] = False
    averageRating: Optional[float] = 0.0
    image: Optional[List[str]] = []

class UserEvent(BaseModel):
    user_id: Optional[str] = None
    product_id: Optional[str] = None
    event_type: str
    metadata: Optional[Dict[str, Any]] = {}

class RecommendationRequest(BaseModel):
    user_id: Optional[str] = None
    product_id: Optional[str] = None
    limit: Optional[int] = 8
    catalog: List[Dict[str, Any]] = []
    events: Optional[List[Dict[str, Any]]] = []

class RecommendationItem(BaseModel):
    product_id: str
    score: float
    reason: str
    product: Dict[str, Any]

class RecommendationResponse(BaseModel):
    user_id: Optional[str] = None
    recommendations: List[RecommendationItem]
    model: str = "hybrid-content-collaborative"
