import logging
from typing import Dict, Any, Optional, List
from app.services.gemini_service import gemini_service
from app.services.platform_link_service import platform_link_service
from app.prompts.home_prompt import build_home_prompt
from app.prompts.party_prompt import build_party_prompt
from app.prompts.jewelry_prompt import build_jewelry_prompt
from app.schemas.recommendation import RecommendationResult, BudgetAllocationItem, RecommendationItem

logger = logging.getLogger(__name__)


class RecommendationService:
    """
    Unified recommendation pipeline coordinating prompts, Gemini generation,
    arithmetic validation, and platform link resolution per Phase 11.
    """

    def generate_plan(
        self,
        planner_type: str,
        input_data: Dict[str, Any],
        image_path: Optional[str] = None
    ) -> RecommendationResult:
        """
        Executes end-to-end plan generation for any of the 3 supported planners.
        """
        budget = float(input_data.get("budget", 10000))

        # 1. Build domain-specific prompt
        if planner_type == "home":
            prompt = build_home_prompt(input_data)
        elif planner_type == "party":
            prompt = build_party_prompt(input_data)
        elif planner_type == "jewelry":
            prompt = build_jewelry_prompt(input_data, has_image=bool(image_path))
        else:
            raise ValueError(f"Unsupported planner type: {planner_type}")

        # 2. Call Gemini AI service
        raw_result = gemini_service.generate_recommendation(prompt, image_path=image_path)

        # 3. If Gemini is in fallback/offline mode or returned empty recommendations
        if raw_result.get("is_fallback") or not raw_result.get("recommendations"):
            return self._build_domain_fallback(planner_type, budget, input_data)

        # 4. Normalize and calculate allocations & items
        return self._normalize_and_validate(planner_type, budget, raw_result)

    def _normalize_and_validate(
        self,
        planner_type: str,
        budget: float,
        data: Dict[str, Any]
    ) -> RecommendationResult:
        """
        Verifies arithmetic calculations and augments items with platform search links.
        """
        # Parse allocations
        raw_allocations = data.get("budget_allocation", [])
        allocation_items: List[BudgetAllocationItem] = []
        for item in raw_allocations:
            cat = str(item.get("category", "General"))
            amt = float(item.get("allocated_budget", 0))
            pct = round((amt / budget) * 100, 1) if budget > 0 else 0
            allocation_items.append(BudgetAllocationItem(category=cat, allocated_budget=amt, percentage=pct))

        # Parse recommendations & generate search links
        raw_recs = data.get("recommendations", [])
        recommendation_items: List[RecommendationItem] = []
        total_estimated = 0.0

        for rec in raw_recs:
            name = str(rec.get("name", "Recommended Item"))
            cat = str(rec.get("category", "General"))
            price = float(rec.get("estimated_price", 0))
            platform = str(rec.get("platform", "Amazon"))
            reason = str(rec.get("reason", "Curated for your preferences."))

            # Generate external platform search link
            search_url = platform_link_service.generate_search_url(
                item_name=name,
                platform=platform,
                domain=planner_type
            )

            total_estimated += price
            recommendation_items.append(
                RecommendationItem(
                    name=name,
                    category=cat,
                    estimated_price=price,
                    platform=platform,
                    search_url=search_url,
                    reason=reason
                )
            )

        # Application-verified arithmetic (Phase 8.5)
        remaining = max(0.0, budget - total_estimated)
        summary = str(data.get("summary", f"Custom {planner_type.capitalize()} plan built for ₹{budget:,.2f}."))
        savings = data.get("savings_suggestions", [])
        notes = data.get("notes", [])

        return RecommendationResult(
            planner=planner_type,
            budget=budget,
            summary=summary,
            allocation=allocation_items,
            recommendations=recommendation_items,
            total_estimated_cost=round(total_estimated, 2),
            remaining_budget=round(remaining, 2),
            savings_suggestions=savings,
            notes=notes,
            is_fallback=False
        )

    def _build_domain_fallback(
        self,
        planner_type: str,
        budget: float,
        input_data: Dict[str, Any]
    ) -> RecommendationResult:
        """
        Sensible offline/fallback recommendations when Gemini API is unconfigured.
        """
        if planner_type == "home":
            allocations = [
                BudgetAllocationItem(category="Furniture", allocated_budget=budget * 0.55, percentage=55.0),
                BudgetAllocationItem(category="Lighting", allocated_budget=budget * 0.20, percentage=20.0),
                BudgetAllocationItem(category="Decor & Curtains", allocated_budget=budget * 0.15, percentage=15.0),
                BudgetAllocationItem(category="Buffer", allocated_budget=budget * 0.10, percentage=10.0),
            ]
            items = [
                RecommendationItem(
                    name="Ergonomic Fabric Sofa Set",
                    category="Furniture",
                    estimated_price=budget * 0.40,
                    platform="Amazon",
                    search_url=platform_link_service.generate_search_url("Ergonomic Fabric Sofa Set", "Amazon", "home"),
                    reason="Comfortable living room centerpiece."
                ),
                RecommendationItem(
                    name="Warm White LED Ceiling Light Fixture",
                    category="Lighting",
                    estimated_price=budget * 0.15,
                    platform="IKEA",
                    search_url=platform_link_service.generate_search_url("Warm White LED Ceiling Light", "IKEA", "home"),
                    reason="Energy-efficient ambiance illumination."
                )
            ]
        elif planner_type == "party":
            allocations = [
                BudgetAllocationItem(category="Food & Catering", allocated_budget=budget * 0.50, percentage=50.0),
                BudgetAllocationItem(category="Venue", allocated_budget=budget * 0.25, percentage=25.0),
                BudgetAllocationItem(category="Decoration", allocated_budget=budget * 0.15, percentage=15.0),
                BudgetAllocationItem(category="Entertainment", allocated_budget=budget * 0.10, percentage=10.0),
            ]
            items = [
                RecommendationItem(
                    name="Party Buffet & Snack Spread",
                    category="Food & Catering",
                    estimated_price=budget * 0.45,
                    platform="Zomato",
                    search_url=platform_link_service.generate_search_url("Party Catering Buffet", "Zomato", "party"),
                    reason="Multi-course food packages for guests."
                ),
                RecommendationItem(
                    name="Celebration Theme Party Decor Kit",
                    category="Decoration",
                    estimated_price=budget * 0.12,
                    platform="Amazon",
                    search_url=platform_link_service.generate_search_url("Party Decor Set Balloons Lights", "Amazon", "party"),
                    reason="Comprehensive theme banners and lighting."
                )
            ]
        else:  # jewelry
            allocations = [
                BudgetAllocationItem(category="Necklace / Choker", allocated_budget=budget * 0.60, percentage=60.0),
                BudgetAllocationItem(category="Earrings / Jhumkas", allocated_budget=budget * 0.25, percentage=25.0),
                BudgetAllocationItem(category="Accessories", allocated_budget=budget * 0.15, percentage=15.0),
            ]
            items = [
                RecommendationItem(
                    name="Traditional Kundan Layered Choker Set",
                    category="Necklace / Choker",
                    estimated_price=budget * 0.50,
                    platform="Amazon",
                    search_url=platform_link_service.generate_search_url("Traditional Kundan Choker Set", "Amazon", "jewelry"),
                    reason="Versatile festive piece pairing with classic Indian attire."
                ),
                RecommendationItem(
                    name="Gold-Toned Antique Jhumkas",
                    category="Earrings / Jhumkas",
                    estimated_price=budget * 0.20,
                    platform="Myntra",
                    search_url=platform_link_service.generate_search_url("Gold-Toned Antique Jhumkas", "Myntra", "jewelry"),
                    reason="Detailed traditional motifs matching ethnic necklines."
                )
            ]

        total = sum(i.estimated_price for i in items)
        remaining = max(0.0, budget - total)

        return RecommendationResult(
            planner=planner_type,
            budget=budget,
            summary=f"Optimized budget distribution for your {planner_type.capitalize()} request (Offline Mode).",
            allocation=allocations,
            recommendations=items,
            total_estimated_cost=round(total, 2),
            remaining_budget=round(remaining, 2),
            savings_suggestions=[
                "Compare seasonal discounts and multi-pack options to save up to 20%.",
                "Review verified buyer ratings before placing bulk orders."
            ],
            notes=["Offline fallback mode active. Add GEMINI_API_KEY in .env for live AI custom curation."],
            is_fallback=True
        )


recommendation_service = RecommendationService()
