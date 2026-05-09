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
