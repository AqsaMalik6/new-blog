from pydantic import BaseModel, EmailStr
import uuid
from datetime import datetime

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    brand_name: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    brand_name: str
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
