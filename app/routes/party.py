import json
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, Request, Form, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.user import User
from app.models.recommendation import Recommendation
from app.dependencies import get_current_user_optional
from app.services.recommendation_service import recommendation_service

router = APIRouter(tags=["Party Planner"])
templates = Jinja2Templates(directory=str(Path(__file__).resolve().parent.parent / "templates"))


@router.get("/party-planner", response_class=HTMLResponse)
async def party_planner_form(
    request: Request,
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Renders the Party & Event Planner input form.
    """
    return templates.TemplateResponse(
        request=request,
        name="party_planner.html",
        context={"user": current_user, "error": None}
    )


@router.post("/party-recommendations", response_class=HTMLResponse)
async def generate_party_recommendations(
    request: Request,
    budget: float = Form(...),
    guest_count: int = Form(25),
    event_type: str = Form("Birthday"),
    venue_type: str = Form("Home / Backyard"),
    food_preference: str = Form("Mixed Veg & Non-Veg Buffet"),
    decor_preference: str = Form("Theme Backdrop & Fairy Lights"),
    entertainment: str = Form("Music Playlist & Interactive Games"),
    additional_notes: Optional[str] = Form(""),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Processes party planner budget submission and renders recommendations.
    """
    if budget <= 0:
        return templates.TemplateResponse(
            request=request,
            name="party_planner.html",
            context={"user": current_user, "error": "Budget must be greater than zero."}
        )

    if guest_count <= 0:
        return templates.TemplateResponse(
            request=request,
            name="party_planner.html",
            context={"user": current_user, "error": "Guest count must be at least 1."}
        )

    input_payload = {
        "budget": budget,
        "guest_count": guest_count,
        "event_type": event_type,
        "venue_type": venue_type,
        "food_preference": food_preference,
        "decor_preference": decor_preference,
        "entertainment": entertainment,
        "additional_notes": additional_notes or "None"
    }

    # Generate plan via Recommendation Service
    plan_result = recommendation_service.generate_plan(
        planner_type="party",
        input_data=input_payload
    )

    # Persist to history if user is logged in
    saved_id = None
    if current_user:
        new_rec = Recommendation(
            user_id=current_user.id,
            planner_type="party",
            title=f"{event_type} Plan ({guest_count} Guests)",
            budget=budget,
            input_data=json.dumps(input_payload),
            ai_response=json.dumps(plan_result.model_dump())
        )
        db.add(new_rec)
        db.commit()
        db.refresh(new_rec)
        saved_id = new_rec.id

    return templates.TemplateResponse(
        request=request,
        name="party_results.html",
        context={
            "user": current_user,
            "plan": plan_result,
            "inputs": input_payload,
            "saved_id": saved_id
        }
    )
