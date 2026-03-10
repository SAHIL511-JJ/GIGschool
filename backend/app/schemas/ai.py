from typing import Optional, List
from pydantic import BaseModel


# --- Gig Generation ---
class GigGenerateRequest(BaseModel):
    prompt: str  # e.g. "need logo design for my startup"


class GigGenerateResponse(BaseModel):
    title: str
    description: str
    tags: List[str]
    category: str  # general, tutoring, design, coding, writing, other


class GigEditRequest(BaseModel):
    title: str
    description: str
    tags: List[str]
    category: str
    instruction: str  # e.g. "make description shorter"


# --- Pitch Generation ---
class PitchGenerateRequest(BaseModel):
    job_title: str
    job_description: str
    user_skills: List[str] = []
    user_bio: str = ""


class PitchGenerateResponse(BaseModel):
    pitch: str


# --- Review Generation ---
class ReviewGenerateRequest(BaseModel):
    job_title: str
    rating: int  # 1-5


class ReviewGenerateResponse(BaseModel):
    comment: str


# --- Bio Generation ---
class BioGenerateRequest(BaseModel):
    skills: List[str]
    username: str = ""


class BioGenerateResponse(BaseModel):
    bio: str


# --- Helper Chat ---
class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class HelperChatRequest(BaseModel):
    messages: List[ChatMessage]


class HelperChatResponse(BaseModel):
    reply: str
    escalate: bool = False
    email: Optional[str] = None
