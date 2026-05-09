from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.models.user import User
from app.database import get_db

# The "Token" is now just the user's email address
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

def hash_password(password: str) -> str:
    # No hashing! Just return plain text
    return password

def verify_password(plain_password: str, stored_password: str) -> bool:
    # Direct comparison
    return plain_password == stored_password

def create_access_token(data: dict):
    # The token is just the email string
    return data.get("sub", "")

async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalars().first()

async def create_user(db: AsyncSession, email: str, password_hash: str, brand_name: str) -> User:
    new_user = User(
        email=email,
        password_hash=password_hash, # This is plain text
        brand_name=brand_name
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    # We find the user directly by their "token" (email)
    user = await get_user_by_email(db, email=token)
    if user is None:
        raise HTTPException(status_code=401, detail="Please login first")
    return user
