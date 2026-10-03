import os
import json
import uuid
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, Request, Form, UploadFile, File, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from PIL import Image

from app.database.connection import get_db
from app.models.user import User
from app.models.recommendation import Recommendation
from app.dependencies import get_current_user_optional
from app.services.recommendation_service import recommendation_service

router = APIRouter(tags=["Jewelry Planner"])
BASE_DIR = Path(__file__).resolve().parent.parent
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))
UPLOADS_DIR = BASE_DIR / "static" / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


@router.get("/jewelry-planner", response_class=HTMLResponse)
async def jewelry_planner_form(
    request: Request,
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Renders the Jewelry Planner input form with optional outfit image upload.
    """
    return templates.TemplateResponse(
        request=request,
        name="jewelry_planner.html",
        context={"user": current_user, "error": None}
    )


@router.post("/jewelry-recommendations", response_class=HTMLResponse)
async def generate_jewelry_recommendations(
    request: Request,
    budget: float = Form(...),
    occasion: str = Form("Wedding Reception"),
    style: str = Form("Traditional Kundan"),
    outfit_description: str = Form(""),
    jewelry_types: str = Form("Necklace, Earrings"),
    additional_notes: Optional[str] = Form(""),
    outfit_image: Optional[UploadFile] = File(None),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Processes jewelry requirements and optional outfit photo for multimodal Gemini analysis.
    """
    if budget <= 0:
        return templates.TemplateResponse(
            request=request,
            name="jewelry_planner.html",
            context={"user": current_user, "error": "Budget must be greater than zero."}
        )

    saved_image_path = None
    saved_image_url = None

    # Handle optional image upload (Phase 10.2 & 10.3)
    if outfit_image and outfit_image.filename:
        # Check MIME type
        if outfit_image.content_type not in ALLOWED_IMAGE_TYPES:
            return templates.TemplateResponse(
                request=request,
                name="jewelry_planner.html",
                context={"user": current_user, "error": "Only JPEG, PNG, or WebP images are supported."}
            )

        contents = await outfit_image.read()
        if len(contents) > MAX_FILE_SIZE:
            return templates.TemplateResponse(
                request=request,
                name="jewelry_planner.html",
                context={"user": current_user, "error": "Image file size exceeds the 5MB limit."}
            )

        # Generate unique safe filename
        ext = Path(outfit_image.filename).suffix or ".jpg"
        unique_name = f"{uuid.uuid4().hex}{ext}"
        destination = UPLOADS_DIR / unique_name

        try:
            with open(destination, "wb") as f:
                f.write(contents)

            # Validate that PIL can open the image
            with Image.open(destination) as img:
                img.verify()

            saved_image_path = str(destination)
            saved_image_url = f"/static/uploads/{unique_name}"
        except Exception:
            if destination.exists():
                os.remove(destination)
            return templates.TemplateResponse(
                request=request,
                name="jewelry_planner.html",
                context={"user": current_user, "error": "Uploaded image file is corrupted or invalid."}
            )

    input_payload = {
        "budget": budget,
        "occasion": occasion,
        "style": style,
        "outfit_description": outfit_description or "Not specified",
        "jewelry_types": jewelry_types,
        "additional_notes": additional_notes or "None",
        "has_image": bool(saved_image_path),
        "image_url": saved_image_url
    }

    # Call recommendation service (with image if uploaded)
    plan_result = recommendation_service.generate_plan(
        planner_type="jewelry",
        input_data=input_payload,
        image_path=saved_image_path
    )

    # Save to history if logged in
    saved_id = None
    if current_user:
        new_rec = Recommendation(
            user_id=current_user.id,
            planner_type="jewelry",
            title=f"{occasion} Jewelry ({style})",
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
        name="jewelry_results.html",
        context={
            "user": current_user,
            "plan": plan_result,
            "inputs": input_payload,
            "image_url": saved_image_url,
            "saved_id": saved_id
        }
    )
