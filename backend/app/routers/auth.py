from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.user import SignupRequest, LoginRequest, TokenResponse, UserOut
from app.models.user import User
from app.services.auth_service import (
    hash_password, verify_password, create_access_token,
    get_user_by_email, create_user, get_current_user
)

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(payload: SignupRequest, db: AsyncSession = Depends(get_db)):
    existing = await get_user_by_email(db, payload.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered.")
    
    # Store password as plain text (no more bcrypt!)
    user = await create_user(
        db, 
        email=payload.email, 
        password_hash=payload.password, 
        brand_name=payload.brand_name
    )
    
    # Simple token: just the email
    token = user.email
    
    return TokenResponse(
        access_token=token, 
        user=UserOut.model_validate(user)
    )

@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await get_user_by_email(db, payload.email)
    if not user or user.password_hash != payload.password:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    
    # Simple token: just the email
    token = user.email
    
    return TokenResponse(
        access_token=token, 
        user=UserOut.model_validate(user)
    )

@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return current_user
