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

router = APIRouter(tags=["Home Interior Planner"])
templates = Jinja2Templates(directory=str(Path(__file__).resolve().parent.parent / "templates"))


@router.get("/home-planner", response_class=HTMLResponse)
async def home_planner_form(
    request: Request,
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Renders the Home Interior Planner input form.
    """
    return templates.TemplateResponse(
        request=request,
        name="home_planner.html",
        context={"user": current_user, "error": None}
    )


@router.post("/home-recommendations", response_class=HTMLResponse)
async def generate_home_recommendations(
    request: Request,
    budget: float = Form(...),
    room_type: str = Form("Living Room"),
    room_count: int = Form(1),
    lights_count: int = Form(4),
    fans_count: int = Form(1),
    sofa_requirement: str = Form("3-Seater"),
    dining_table: str = Form("None"),
    style_preference: str = Form("Modern Minimalist"),
    additional_notes: Optional[str] = Form(""),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Processes home interior budget submission and displays recommendations.
    """
    if budget <= 0:
        return templates.TemplateResponse(
            request=request,
            name="home_planner.html",
            context={"user": current_user, "error": "Budget must be greater than zero."}
        )

    input_payload = {
        "budget": budget,
        "rooms": [
            {
                "room_type": room_type,
                "room_count": room_count,
                "lights_count": lights_count,
                "fans_count": fans_count,
                "sofa_requirement": sofa_requirement,
                "dining_table": dining_table
            }
        ],
        "preferences": style_preference,
        "additional_notes": additional_notes or "None"
    }

    # Generate plan via Recommendation Service
    plan_result = recommendation_service.generate_plan(
        planner_type="home",
        input_data=input_payload
    )

    # If user is authenticated, persist to recommendation history
    saved_id = None
    if current_user:
        new_rec = Recommendation(
            user_id=current_user.id,
            planner_type="home",
            title=f"{room_type} Interior Plan",
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
        name="home_results.html",
        context={
            "user": current_user,
            "plan": plan_result,
            "inputs": input_payload,
            "saved_id": saved_id
        }
    )
