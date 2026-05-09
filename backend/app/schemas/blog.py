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
