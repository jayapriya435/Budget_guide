import json
from pathlib import Path
from fastapi import APIRouter, Depends, Request, HTTPException, status
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.user import User
from app.models.recommendation import Recommendation
from app.dependencies import get_current_user
from app.schemas.recommendation import RecommendationResult

router = APIRouter(tags=["Recommendation History"])
templates = Jinja2Templates(directory=str(Path(__file__).resolve().parent.parent / "templates"))


@router.get("/history", response_class=HTMLResponse)
async def view_history(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Renders user's complete saved recommendation history per Phase 14.
    """
    records = (
        db.query(Recommendation)
        .filter(Recommendation.user_id == current_user.id)
        .order_by(Recommendation.created_at.desc())
        .all()
    )

    return templates.TemplateResponse(
        request=request,
        name="history.html",
        context={
            "user": current_user,
            "records": records
        }
    )


@router.get("/recommendation-details/{rec_id}", response_class=HTMLResponse)
async def view_recommendation_details(
    rec_id: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Reopens a past recommendation record and renders its full results.
    """
    rec = (
        db.query(Recommendation)
        .filter(Recommendation.id == rec_id, Recommendation.user_id == current_user.id)
        .first()
    )
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation record not found.")

    try:
        plan_dict = json.loads(rec.ai_response)
        input_data = json.loads(rec.input_data)
        plan_result = RecommendationResult(**plan_dict)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to parse saved plan data.")

    # Select appropriate domain results template
    template_name = f"{rec.planner_type}_results.html"

    return templates.TemplateResponse(
        request=request,
        name=template_name,
        context={
            "user": current_user,
            "plan": plan_result,
            "inputs": input_data,
            "saved_id": rec.id,
            "is_historical_view": True,
            "image_url": input_data.get("image_url")
        }
    )


@router.get("/delete-recommendation/{rec_id}")
async def delete_recommendation(
    rec_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Deletes a recommendation record from history.
    """
    rec = (
        db.query(Recommendation)
        .filter(Recommendation.id == rec_id, Recommendation.user_id == current_user.id)
        .first()
    )
    if rec:
        db.delete(rec)
        db.commit()
    return RedirectResponse(url="/history", status_code=status.HTTP_302_FOUND)
