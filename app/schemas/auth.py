from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, json_schema_extra={"example": "Alex Smith"})
    email: EmailStr = Field(..., json_schema_extra={"example": "alex@example.com"})
    password: str = Field(..., min_length=6, max_length=100, json_schema_extra={"example": "securePassword123"})


class UserLogin(BaseModel):
    email: EmailStr = Field(..., json_schema_extra={"example": "alex@example.com"})
    password: str = Field(..., json_schema_extra={"example": "securePassword123"})


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None


class SessionInfo(BaseModel):
    user: UserResponse
    is_authenticated: bool
