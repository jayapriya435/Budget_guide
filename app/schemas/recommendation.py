from typing import List, Optional
from pydantic import BaseModel, Field


class BudgetAllocationItem(BaseModel):
    category: str
    allocated_budget: float
    percentage: Optional[float] = None


class RecommendationItem(BaseModel):
    name: str
    category: str
    estimated_price: float
    platform: str = "Amazon"
    search_url: Optional[str] = None
    reason: Optional[str] = None


class RecommendationResult(BaseModel):
    planner: str  # 'home', 'party', 'jewelry'
    budget: float
    summary: str
    allocation: List[BudgetAllocationItem] = []
    recommendations: List[RecommendationItem] = []
    total_estimated_cost: float = 0.0
    remaining_budget: float = 0.0
    savings_suggestions: List[str] = []
    notes: List[str] = []
    is_fallback: bool = False
