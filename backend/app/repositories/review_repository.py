from typing import List, Optional
from uuid import UUID
from app.db.client import supabase
from app.schemas.review import ReviewCreate, Review

class ReviewRepository:
    def __init__(self):
        self.supabase = supabase

    def create(self, review_in: ReviewCreate, reviewer_id: UUID) -> Review:
        data = review_in.model_dump()
        data["reviewer_id"] = str(reviewer_id)
        data["job_id"] = str(data["job_id"]) if data.get("job_id") else None
        data["reviewee_id"] = str(data["reviewee_id"])
        
        response = self.supabase.table("reviews").insert(data).execute()
        return Review(**response.data[0])

    def get_by_reviewee(self, user_id: UUID) -> List[Review]:
        response = self.supabase.table("reviews")\
            .select("*")\
            .eq("reviewee_id", str(user_id))\
            .order("created_at", desc=True)\
            .execute()
        return [Review(**item) for item in response.data]

    def get_average_rating(self, user_id: UUID) -> float:
        # Supabase doesn't support aggregate functions directly in the JS/Python client easily without RPC
        # So we fetch all ratings and calculate manually for now (fine for specific user pages)
        reviews = self.get_by_reviewee(user_id)
        if not reviews:
            return 0.0
        total = sum(r.rating for r in reviews)
        return round(total / len(reviews), 1)

review_repository = ReviewRepository()
