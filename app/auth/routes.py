from datetime import timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from pathlib import Path

from app.database.connection import get_db
from app.models.user import User
from app.schemas.auth import UserRegister, UserLogin, UserResponse, Token, SessionInfo
from app.auth.security import verify_password, get_password_hash, create_access_token
from app.dependencies import get_current_user, get_current_user_optional

router = APIRouter(tags=["Authentication"])
templates = Jinja2Templates(directory=str(Path(__file__).resolve().parent.parent / "templates"))


# --- HTML Template Views ---

@router.get("/login", response_class=HTMLResponse)
async def login_page(request: Request, current_user: Optional[User] = Depends(get_current_user_optional)):
    if current_user:
        return RedirectResponse(url="/dashboard", status_code=status.HTTP_302_FOUND)
    return templates.TemplateResponse(
        request=request,
        name="login.html",
        context={"user": None, "error": None}
    )


@router.get("/register", response_class=HTMLResponse)
async def register_page(request: Request, current_user: Optional[User] = Depends(get_current_user_optional)):
    if current_user:
        return RedirectResponse(url="/dashboard", status_code=status.HTTP_302_FOUND)
    return templates.TemplateResponse(
        request=request,
        name="register.html",
        context={"user": None, "error": None}
    )


# --- API Endpoints ---

@router.post("/register", response_model=UserResponse)
async def register_user(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    User registration endpoint (handles both JSON and HTML form submissions).
    """
    content_type = request.headers.get("content-type", "")
    is_json = "application/json" in content_type or "application/json" in request.headers.get("accept", "")

    if "application/json" in content_type:
        body = await request.json()
        reg_name = body.get("name")
        reg_email = body.get("email")
        reg_password = body.get("password")
    else:
        form = await request.form()
        reg_name = form.get("name")
        reg_email = form.get("email")
        reg_password = form.get("password")

    if not reg_name or not reg_email or not reg_password:
        raise HTTPException(status_code=400, detail="Name, email, and password are required.")

    # Check for existing email
    existing_user = db.query(User).filter(User.email == reg_email.lower().strip()).first()
    if existing_user:
        if not is_json:
            return templates.TemplateResponse(
                request=request,
                name="register.html",
                context={"user": None, "error": "An account with this email already exists."},
                status_code=400
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    # Hash password and create user
    new_user = User(
        name=reg_name.strip(),
        email=reg_email.lower().strip(),
        password_hash=get_password_hash(reg_password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # If submitted from browser form, auto-login and redirect
    if not is_json:
        token = create_access_token({"sub": str(new_user.id), "email": new_user.email})
        redirect = RedirectResponse(url="/dashboard", status_code=status.HTTP_302_FOUND)
        redirect.set_cookie(key="access_token", value=f"Bearer {token}", httponly=True, max_age=86400)
        return redirect

    return new_user


@router.post("/login")
async def login_user(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    User login endpoint (handles JSON and form submissions).
    """
    content_type = request.headers.get("content-type", "")
    is_json = "application/json" in content_type or "application/json" in request.headers.get("accept", "")

    if "application/json" in content_type:
        body = await request.json()
        login_email = body.get("email")
        login_password = body.get("password")
    else:
        form = await request.form()
        login_email = form.get("email")
        login_password = form.get("password")

    if not login_email or not login_password:
        raise HTTPException(status_code=400, detail="Email and password are required.")

    user = db.query(User).filter(User.email == login_email.lower().strip()).first()
    if not user or not verify_password(login_password, user.password_hash):
        if not is_json:
            return templates.TemplateResponse(
                request=request,
                name="login.html",
                context={"user": None, "error": "Invalid email or password."},
                status_code=400
            )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token({"sub": str(user.id), "email": user.email})

    # If submitted from browser form, redirect to dashboard with cookie
    if not is_json:
        redirect = RedirectResponse(url="/dashboard", status_code=status.HTTP_302_FOUND)
        redirect.set_cookie(key="access_token", value=f"Bearer {token}", httponly=True, max_age=86400)
        return redirect

    return {"access_token": token, "token_type": "bearer", "user": UserResponse.model_validate(user)}


@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    OAuth2 compatible token endpoint.
    """
    user = db.query(User).filter(User.email == form_data.username.lower().strip()).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token({"sub": str(user.id), "email": user.email})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/session-info", response_model=SessionInfo)
async def session_info(current_user: User = Depends(get_current_user)):
    """
    Returns user session info for authenticated requests.
    """
    return SessionInfo(
        user=UserResponse.model_validate(current_user),
        is_authenticated=True
    )


@router.get("/session-data")
async def session_data(current_user: User = Depends(get_current_user)):
    """
    Returns authenticated user session details and metadata.
    """
    return {
        "user_id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "created_at": current_user.created_at.isoformat()
    }


@router.get("/logout")
@router.post("/logout")
async def logout():
    """
    Logs out the user and clears authentication cookie.
    """
    redirect = RedirectResponse(url="/", status_code=status.HTTP_302_FOUND)
    redirect.delete_cookie("access_token")
    return redirect
