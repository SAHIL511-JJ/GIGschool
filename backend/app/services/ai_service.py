import json
from openai import OpenAI
from app.core.config import get_settings

settings = get_settings()

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=settings.OPENROUTER_API_KEY,
)

MODEL = "google/gemini-2.5-flash"

VALID_CATEGORIES = ["general", "tutoring", "design", "coding", "writing", "other"]

SUPPORT_EMAIL = "sahillamture511@gmail.com"

GIGSCHOOL_CONTEXT = """
GigSchool is a student freelance marketplace where college/school students can:
- Post gigs/jobs (e.g. "Need help with logo design", "Looking for a math tutor")
- Browse and search for available gigs posted by other students
- Apply to gigs with a pitch explaining why they're the right fit
- Accept or reject applicants as a gig creator
- Chat in real-time via direct messaging
- Leave reviews (1-5 stars + comment) after completing a gig
- Build a portfolio by uploading and showcasing past work
- Bookmark gigs to view later
- Get notifications about application status updates
- Edit their profile with bio, skills, and avatar

How to use GigSchool:
1. Sign up / Log in with email
2. Go to Dashboard to see all open gigs
3. Click "Post a Gig" to create a new job posting
4. Click on any gig to see details, apply, or message the creator
5. Go to Profile to edit your info, see your gigs, applications, saved gigs, and portfolio
6. Go to Messages to chat with other users
7. Go to Notifications to track application updates
8. Go to Settings to toggle dark mode
"""


def _call_ai(system_prompt: str, user_message: str) -> str:
    """Make a call to OpenRouter API."""
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        temperature=0.7,
        max_tokens=1024,
    )
    return response.choices[0].message.content or ""


def generate_gig(prompt: str) -> dict:
    """Generate a full gig post from a short description."""
    system_prompt = f"""You are a helpful assistant for GigSchool, a student freelance marketplace.
Generate a professional gig/job posting from the user's short description.

You MUST respond with ONLY valid JSON (no markdown, no code fences) in this exact format:
{{
    "title": "A clear, concise title (max 80 chars)",
    "description": "A detailed, professional description (2-4 paragraphs with markdown formatting)",
    "tags": ["tag1", "tag2", "tag3"],
    "category": "one of: {', '.join(VALID_CATEGORIES)}"
}}

Make the description professional but friendly since it's a student platform.
Include clear requirements, expectations, and what the student will gain.
Pick the most appropriate category from the list.
Generate 3-6 relevant tags."""

    result = _call_ai(system_prompt, f"Create a gig post for: {prompt}")

    # Clean up response - remove markdown code fences if present
    result = result.strip()
    if result.startswith("```"):
        # Handle ```json or ``` on first line
        first_newline = result.find("\n")
        if first_newline != -1:
            result = result[first_newline + 1:]
        else:
            result = result[3:]
    if result.endswith("```"):
        result = result[:-3]
    result = result.strip()

    try:
        parsed = json.loads(result)
        # Validate category
        if parsed.get("category") not in VALID_CATEGORIES:
            parsed["category"] = "general"
        return parsed
    except json.JSONDecodeError:
        return {
            "title": prompt.title(),
            "description": prompt,
            "tags": [],
            "category": "general"
        }


def edit_gig(current_gig: dict, instruction: str) -> dict:
    """Edit an existing gig post with natural language instructions."""
    system_prompt = f"""You are a helpful assistant for GigSchool, a student freelance marketplace.
The user has an existing gig post and wants to edit it based on their instructions.

You MUST respond with ONLY valid JSON (no markdown, no code fences) in this exact format:
{{
    "title": "updated title",
    "description": "updated description",
    "tags": ["tag1", "tag2"],
    "category": "one of: {', '.join(VALID_CATEGORIES)}"
}}

Only change what the user asks. Keep everything else the same."""

    user_msg = f"""Current gig:
Title: {current_gig.get('title', '')}
Description: {current_gig.get('description', '')}
Tags: {', '.join(current_gig.get('tags', []))}
Category: {current_gig.get('category', 'general')}

Edit instruction: {instruction}"""

    result = _call_ai(system_prompt, user_msg)

    result = result.strip()
    if result.startswith("```"):
        first_newline = result.find("\n")
        if first_newline != -1:
            result = result[first_newline + 1:]
        else:
            result = result[3:]
    if result.endswith("```"):
        result = result[:-3]
    result = result.strip()

    try:
        parsed = json.loads(result)
        if parsed.get("category") not in VALID_CATEGORIES:
            parsed["category"] = current_gig.get("category", "general")
        return parsed
    except json.JSONDecodeError:
        return current_gig


def generate_pitch(job_title: str, job_description: str, user_skills: list, user_bio: str) -> str:
    """Generate a personalized application pitch."""
    system_prompt = """You are a helpful assistant for GigSchool, a student freelance marketplace.
Write a compelling, personalized application pitch for a student applying to a gig.

Keep it:
- 3-5 sentences long
- Professional but friendly (it's a student platform)
- Specific to the gig requirements
- Highlighting relevant skills
- Enthusiastic but not over the top

Respond with ONLY the pitch text, no quotes or formatting."""

    user_msg = f"""Gig Title: {job_title}
Gig Description: {job_description}

Applicant's Skills: {', '.join(user_skills) if user_skills else 'Not specified'}
Applicant's Bio: {user_bio if user_bio else 'Not specified'}

Write a pitch for this application."""

    return _call_ai(system_prompt, user_msg).strip().strip('"')


def generate_review(job_title: str, rating: int) -> str:
    """Generate a review comment based on gig context and rating."""
    system_prompt = """You are a helpful assistant for GigSchool, a student freelance marketplace.
Write a brief, genuine review comment for a completed gig.

Keep it:
- 2-3 sentences long
- Matching the star rating in tone (1=bad, 3=okay, 5=excellent)
- Specific to the type of work
- Genuine and helpful for other students

Respond with ONLY the review text, no quotes or formatting."""

    rating_desc = {1: "terrible", 2: "poor", 3: "okay", 4: "good", 5: "excellent"}
    user_msg = f"""Gig: {job_title}
Rating: {rating}/5 stars ({rating_desc.get(rating, 'okay')})

Write a review comment matching this rating."""

    return _call_ai(system_prompt, user_msg).strip().strip('"')


def generate_bio(skills: list, username: str = "") -> str:
    """Generate a professional bio from skills."""
    system_prompt = """You are a helpful assistant for GigSchool, a student freelance marketplace.
Write a polished, professional bio for a student's profile.

Keep it:
- 2-3 sentences long
- Professional but approachable
- Highlighting their skills naturally
- Making them sound capable and enthusiastic

Respond with ONLY the bio text, no quotes or formatting."""

    name_part = f"for {username}" if username else ""
    user_msg = f"""Write a professional student bio {name_part} with these skills: {', '.join(skills)}"""

    return _call_ai(system_prompt, user_msg).strip().strip('"')


def helper_chat(messages: list) -> dict:
    """AI helper agent for answering questions about GigSchool."""
    system_prompt = f"""You are GigBot, the friendly AI assistant for GigSchool.
You help students understand how to use the platform.

{GIGSCHOOL_CONTEXT}

Rules:
1. Answer questions about GigSchool features, how to use them, and general help
2. Be friendly, concise, and helpful
3. If you genuinely cannot answer a question (it's not about GigSchool or you don't know), respond with EXACTLY this JSON:
   {{"escalate": true}}
4. For normal answers, respond with just the helpful text (no JSON)
5. Keep responses short — 2-4 sentences max
6. Use emojis sparingly for friendliness"""

    api_messages = [{"role": "system", "content": system_prompt}]
    for msg in messages:
        api_messages.append({
            "role": msg.get("role", "user"),
            "content": msg.get("content", "")
        })

    response = client.chat.completions.create(
        model=MODEL,
        messages=api_messages,
        temperature=0.7,
        max_tokens=512,
    )

    reply = response.choices[0].message.content or ""
    reply = reply.strip()

    # Check if AI wants to escalate
    try:
        parsed = json.loads(reply)
        if parsed.get("escalate"):
            return {
                "reply": f"I'm sorry, I'm not able to help with that. Please reach out to our team at **{SUPPORT_EMAIL}** and they'll get back to you! 📧",
                "escalate": True,
                "email": SUPPORT_EMAIL
            }
    except (json.JSONDecodeError, AttributeError):
        pass

    return {
        "reply": reply,
        "escalate": False,
        "email": None
    }


# Export as singleton-style module
ai_service = {
    "generate_gig": generate_gig,
    "edit_gig": edit_gig,
    "generate_pitch": generate_pitch,
    "generate_review": generate_review,
    "generate_bio": generate_bio,
    "helper_chat": helper_chat,
}
