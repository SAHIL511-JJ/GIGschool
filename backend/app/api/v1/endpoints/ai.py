from typing import Any
from fastapi import APIRouter, HTTPException, Depends
from app.api.deps import get_current_user
from app.schemas.ai import (
    GigGenerateRequest, GigGenerateResponse,
    GigEditRequest, GigGenerateResponse as GigEditResponse,
    PitchGenerateRequest, PitchGenerateResponse,
    ReviewGenerateRequest, ReviewGenerateResponse,
    BioGenerateRequest, BioGenerateResponse,
    HelperChatRequest, HelperChatResponse,
)
from app.services.ai_service import ai_service

router = APIRouter()


@router.post("/generate-gig", response_model=GigGenerateResponse)
def generate_gig(request: GigGenerateRequest, current_user: Any = Depends(get_current_user)):
    """Generate a full gig post from a short description using AI."""
    try:
        result = ai_service["generate_gig"](request.prompt)
        return GigGenerateResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")


@router.post("/edit-gig", response_model=GigGenerateResponse)
def edit_gig(request: GigEditRequest, current_user: Any = Depends(get_current_user)):
    """Edit an existing gig post with natural language instructions."""
    try:
        current_gig = {
            "title": request.title,
            "description": request.description,
            "tags": request.tags,
            "category": request.category,
        }
        result = ai_service["edit_gig"](current_gig, request.instruction)
        return GigGenerateResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI edit failed: {str(e)}")


@router.post("/generate-pitch", response_model=PitchGenerateResponse)
def generate_pitch(request: PitchGenerateRequest, current_user: Any = Depends(get_current_user)):
    """Generate a personalized application pitch using AI."""
    try:
        pitch = ai_service["generate_pitch"](
            request.job_title,
            request.job_description,
            request.user_skills,
            request.user_bio,
        )
        return PitchGenerateResponse(pitch=pitch)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI pitch generation failed: {str(e)}")


@router.post("/generate-review", response_model=ReviewGenerateResponse)
def generate_review(request: ReviewGenerateRequest, current_user: Any = Depends(get_current_user)):
    """Generate a review comment based on gig context and rating."""
    if not 1 <= request.rating <= 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    try:
        comment = ai_service["generate_review"](request.job_title, request.rating)
        return ReviewGenerateResponse(comment=comment)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI review generation failed: {str(e)}")


@router.post("/generate-bio", response_model=BioGenerateResponse)
def generate_bio(request: BioGenerateRequest, current_user: Any = Depends(get_current_user)):
    """Generate a professional bio from skills."""
    try:
        bio = ai_service["generate_bio"](request.skills, request.username)
        return BioGenerateResponse(bio=bio)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI bio generation failed: {str(e)}")


@router.post("/chat", response_model=HelperChatResponse)
def helper_chat(request: HelperChatRequest, current_user: Any = Depends(get_current_user)):
    """AI helper agent conversation."""
    try:
        messages = [{"role": m.role, "content": m.content} for m in request.messages]
        result = ai_service["helper_chat"](messages)
        return HelperChatResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI chat failed: {str(e)}")
