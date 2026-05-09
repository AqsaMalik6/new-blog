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
