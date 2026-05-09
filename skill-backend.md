# skill-backend.md — Backend Build Instructions
## AI Blog Generator SaaS Platform

---

## OVERVIEW

Build the backend using FastAPI (Python 3.11+), SQLAlchemy 2.0 async ORM, PostgreSQL, and JWT authentication. All LLM calls happen here — never in the frontend. Follow these instructions exactly in order.

---

## STEP 1 — PROJECT SETUP

```bash
mkdir backend && cd backend
python -m venv venv
source venv/bin/activate
pip install fastapi uvicorn[standard] sqlalchemy[asyncio] asyncpg alembic \
  python-jose[cryptography] passlib[bcrypt] python-multipart httpx \
  beautifulsoup4 openai google-generativeai groq python-dotenv \
  pydantic pydantic-settings Pillow
pip freeze > requirements.txt
```

---

## STEP 2 — ENVIRONMENT CONFIGURATION

### Create `.env.example`
```
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/ai_blog_db
SECRET_KEY=replace-with-minimum-32-char-random-string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
GEMINI_API_KEY=your-gemini-api-key
GROQ_API_KEY=your-groq-api-key
ALLOWED_ORIGINS=http://localhost:3000
```

Copy to `.env` and fill in real values. Never commit `.env` to version control.

### Create `app/config.py`
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080
    GEMINI_API_KEY: str
    GROQ_API_KEY: str
    ALLOWED_ORIGINS: str = "http://localhost:3000"

    class Config:
        env_file = ".env"

settings = Settings()
```

---

## STEP 3 — DATABASE SETUP

### Create `app/database.py`
```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
```

### Create `app/models/user.py`
```python
import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    brand_name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
```

### Create `app/models/blog.py`
```python
import uuid
from datetime import datetime
from sqlalchemy import String, Text, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.database import Base

class Blog(Base):
    __tablename__ = "blogs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    brand_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    meta_description: Mapped[str] = mapped_column(String(160), nullable=True)
    image_url: Mapped[str] = mapped_column(Text, nullable=True)
    source_url: Mapped[str] = mapped_column(Text, nullable=True)
    keyword_targets: Mapped[dict] = mapped_column(JSONB, nullable=True)
    word_count: Mapped[int] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, index=True)
```

---

## STEP 4 — ALEMBIC MIGRATIONS

```bash
alembic init alembic
```

Edit `alembic/env.py`:
- Import `Base` from `app.database`
- Import all models: `from app.models.user import User` and `from app.models.blog import Blog`
- Set `target_metadata = Base.metadata`
- Set `config.set_main_option("sqlalchemy.url", settings.DATABASE_URL.replace("+asyncpg", "+psycopg2"))` (Alembic uses sync driver for migrations)

```bash
alembic revision --autogenerate -m "initial_schema"
alembic upgrade head
```

---

## STEP 5 — PYDANTIC SCHEMAS

### `app/schemas/user.py`
```python
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
```

### `app/schemas/blog.py`
```python
from pydantic import BaseModel
from typing import Optional, List
import uuid
from datetime import datetime

class GenerateRequest(BaseModel):
    query: str
    source_url: Optional[str] = None

class BlogOut(BaseModel):
    id: uuid.UUID
    brand_id: uuid.UUID
    title: str
    content: str
    meta_description: Optional[str]
    image_url: Optional[str]
    source_url: Optional[str]
    keyword_targets: Optional[List[str]]
    word_count: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True

class BlogListItem(BaseModel):
    id: uuid.UUID
    title: str
    meta_description: Optional[str]
    image_url: Optional[str]
    word_count: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True

class BlogListResponse(BaseModel):
    blogs: List[BlogListItem]
    total: int
```

---

## STEP 6 — AUTH SERVICE

### `app/services/auth_service.py`

```python
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.config import settings
from app.models.user import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None

async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()

async def get_user_by_id(db: AsyncSession, user_id: str) -> Optional[User]:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()
```

### Create FastAPI dependency for current user

In `app/services/auth_service.py`, add:
```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

bearer_scheme = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    token = credentials.credentials
    user_id = decode_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Token expired. Please log in again.")
    user = await get_user_by_id(db, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found.")
    return user
```

---

## STEP 7 — AUTH ROUTER

### `app/routers/auth.py`
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.user import SignupRequest, LoginRequest, TokenResponse, UserOut
from app.models.user import User
from app.services.auth_service import (
    hash_password, verify_password, create_access_token,
    get_user_by_email, get_current_user
)

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/signup", response_model=TokenResponse, status_code=201)
async def signup(payload: SignupRequest, db: AsyncSession = Depends(get_db)):
    existing = await get_user_by_email(db, payload.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered.")
    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        brand_name=payload.brand_name
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))

@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await get_user_by_email(db, payload.email)
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))

@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return current_user
```

---

## STEP 8 — SCRAPER SERVICE

### `app/services/scraper_service.py`

```python
import httpx
from bs4 import BeautifulSoup
from typing import Optional
from dataclasses import dataclass

@dataclass
class ScrapedData:
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[str] = None
    image_url: Optional[str] = None
    raw_text: Optional[str] = None
    success: bool = False
    error: Optional[str] = None

async def scrape_url(url: str) -> ScrapedData:
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
    }
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
    except Exception as e:
        return ScrapedData(success=False, error=str(e))

    soup = BeautifulSoup(response.text, "html.parser")

    # Extract title
    title = None
    og_title = soup.find("meta", property="og:title")
    if og_title:
        title = og_title.get("content")
    elif soup.title:
        title = soup.title.string

    # Extract description
    description = None
    og_desc = soup.find("meta", property="og:description")
    if og_desc:
        description = og_desc.get("content")
    else:
        meta_desc = soup.find("meta", attrs={"name": "description"})
        if meta_desc:
            description = meta_desc.get("content")

    # Extract price (common e-commerce patterns)
    price = None
    price_selectors = [
        soup.find("span", class_=lambda c: c and "price" in c.lower()),
        soup.find("div", class_=lambda c: c and "price" in c.lower()),
        soup.find(itemprop="price"),
    ]
    for el in price_selectors:
        if el and el.get_text(strip=True):
            price = el.get_text(strip=True)
            break

    # Extract image
    image_url = None
    og_image = soup.find("meta", property="og:image")
    if og_image:
        image_url = og_image.get("content")

    # Extract raw text for context (first 2000 chars of body text)
    body_text = soup.get_text(separator=" ", strip=True)[:2000]

    return ScrapedData(
        title=title,
        description=description,
        price=price,
        image_url=image_url,
        raw_text=body_text,
        success=True
    )
```

---

## STEP 9 — BLOG SERVICE (DATABASE OPERATIONS)

### `app/services/blog_service.py`
```python
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.blog import Blog
import uuid
from typing import Optional, List

async def create_blog(db: AsyncSession, brand_id: uuid.UUID, data: dict) -> Blog:
    blog = Blog(brand_id=brand_id, **data)
    db.add(blog)
    await db.commit()
    await db.refresh(blog)
    return blog

async def get_blogs_by_brand(db: AsyncSession, brand_id: uuid.UUID) -> tuple[List[Blog], int]:
    query = select(Blog).where(Blog.brand_id == brand_id).order_by(Blog.created_at.desc())
    result = await db.execute(query)
    blogs = result.scalars().all()
    return blogs, len(blogs)

async def get_blog_by_id(db: AsyncSession, blog_id: uuid.UUID, brand_id: uuid.UUID) -> Optional[Blog]:
    result = await db.execute(
        select(Blog).where(Blog.id == blog_id, Blog.brand_id == brand_id)
    )
    return result.scalar_one_or_none()

async def delete_blog(db: AsyncSession, blog_id: uuid.UUID, brand_id: uuid.UUID) -> bool:
    blog = await get_blog_by_id(db, blog_id, brand_id)
    if not blog:
        return False
    await db.delete(blog)
    await db.commit()
    return True
```

---

## STEP 10 — BLOG ROUTER

### `app/routers/blog.py`
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
from app.database import get_db
from app.models.user import User
from app.schemas.blog import GenerateRequest, BlogOut, BlogListResponse, BlogListItem
from app.services.auth_service import get_current_user
from app.services.blog_service import create_blog, get_blogs_by_brand, get_blog_by_id, delete_blog
from app.agents.orchestrator import run_blog_generation

router = APIRouter(prefix="/api/blog", tags=["blog"])

@router.post("/generate", response_model=BlogOut, status_code=201)
async def generate_blog(
    payload: GenerateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await run_blog_generation(
        query=payload.query,
        source_url=payload.source_url,
        brand_name=current_user.brand_name
    )
    blog = await create_blog(db, current_user.id, result)
    return blog

@router.get("/list", response_model=BlogListResponse)
async def list_blogs(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    blogs, total = await get_blogs_by_brand(db, current_user.id)
    items = [BlogListItem.model_validate(b) for b in blogs]
    return BlogListResponse(blogs=items, total=total)

@router.get("/{blog_id}", response_model=BlogOut)
async def get_blog(
    blog_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    blog = await get_blog_by_id(db, blog_id, current_user.id)
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found.")
    return blog

@router.delete("/{blog_id}", status_code=204)
async def remove_blog(
    blog_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    deleted = await delete_blog(db, blog_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Blog not found.")
```

---

## STEP 11 — MAIN APPLICATION ENTRY POINT

### `main.py`
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import auth, blog

app = FastAPI(title="AI Blog Generator API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(blog.router)

@app.get("/health")
async def health():
    return {"status": "ok"}
```

---

## STEP 12 — RUNNING THE SERVER

```bash
uvicorn main:app --reload --port 8000
```

API docs available at: `http://localhost:8000/docs`

---

## STEP 13 — BACKEND QUALITY CHECKLIST

- [ ] `alembic upgrade head` runs without errors
- [ ] POST /api/auth/signup returns token
- [ ] POST /api/auth/login returns token
- [ ] GET /api/auth/me returns user (with valid token)
- [ ] GET /api/auth/me returns 401 (without token)
- [ ] POST /api/blog/generate runs and saves blog to DB
- [ ] GET /api/blog/list returns only current brand's blogs
- [ ] GET /api/blog/{id} returns 404 for another brand's blog
- [ ] DELETE /api/blog/{id} removes the blog
- [ ] CORS headers present on all responses
- [ ] No API keys printed in logs
- [ ] All passwords stored as bcrypt hashes (never plaintext)
