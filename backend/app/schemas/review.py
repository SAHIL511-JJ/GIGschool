from uuid import UUID
from datetime import datetime
from pydantic import BaseModel
from typing import Optional

class ReviewCreate(BaseModel):
    job_id: Optional[UUID] = None
    reviewee_id: UUID
    rating: int  # 1-5
    comment: Optional[str] = None

class Review(BaseModel):
    id: UUID
    job_id: Optional[UUID] = None
    reviewer_id: UUID
    reviewee_id: UUID
    rating: int
    comment: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
