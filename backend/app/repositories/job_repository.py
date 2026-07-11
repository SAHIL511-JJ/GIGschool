from threading import Lock
from time import monotonic
from typing import List, Optional
from uuid import UUID
from fastapi.encoders import jsonable_encoder
from app.repositories.user_repository import IBugSchoolRepository
from app.schemas.job import Job, JobCreate, JobUpdate, CreatorInfo
from app.db.client import supabase

JOB_SELECT = (
    "id,creator_id,group_id,title,description,tags,category,"
    "resume_required,status,created_at,users(id,email,username,avatar_url)"
)

class JobRepository(IBugSchoolRepository[Job, JobCreate, JobUpdate]):
    def __init__(self, model, table_name: str):
        super().__init__(model, table_name)
        self._open_jobs_cache: tuple[float, List[Job]] | None = None
        self._cache_lock = Lock()

    def _invalidate_open_jobs_cache(self) -> None:
        with self._cache_lock:
            self._open_jobs_cache = None

    def _enrich_with_creator(self, job_data: dict) -> dict:
        """Add creator info to job data"""
        if 'users' in job_data and job_data['users']:
            job_data['creator'] = CreatorInfo(**job_data['users'])
            del job_data['users']
        return job_data

    def get_by_group(self, group_id: str) -> List[Job]:
        try:
            response = supabase.table(self.table_name).select(JOB_SELECT).eq(
                "group_id", group_id
            ).order("created_at", desc=True).execute()
            return [self.model(**self._enrich_with_creator(item)) for item in response.data]
        except Exception as e:
            print(f"Error fetching jobs for group {group_id}: {e}")
            return []

    def get_all(self) -> List[Job]:
        from app.core.config import get_settings

        ttl_seconds = get_settings().JOB_LIST_CACHE_TTL_SECONDS
        now = monotonic()
        with self._cache_lock:
            if self._open_jobs_cache and now < self._open_jobs_cache[0]:
                return self._open_jobs_cache[1]

        try:
            response = supabase.table(self.table_name).select(JOB_SELECT).eq(
                "status", "OPEN"
            ).order("created_at", desc=True).limit(50).execute()
            jobs = [self.model(**self._enrich_with_creator(item)) for item in response.data]
            with self._cache_lock:
                self._open_jobs_cache = (monotonic() + ttl_seconds, jobs)
            return jobs
        except Exception as e:
            print(f"Error fetching all jobs: {e}")
            return []

    def get_by_creator(self, creator_id: str) -> List[Job]:
        try:
            response = supabase.table(self.table_name).select(JOB_SELECT).eq(
                "creator_id", creator_id
            ).order("created_at", desc=True).execute()
            return [self.model(**self._enrich_with_creator(item)) for item in response.data]
        except Exception as e:
            print(f"Error fetching jobs for creator {creator_id}: {e}")
            return []

    def get(self, id: UUID) -> Optional[Job]:
        try:
            response = supabase.table(self.table_name).select(JOB_SELECT).eq(
                "id", str(id)
            ).single().execute()
            if response.data:
                return self.model(**self._enrich_with_creator(response.data))
            return None
        except Exception as e:
            print(f"Error fetching job {id}: {e}")
            return None

    def create(self, obj_in: JobCreate) -> Job:
        job = super().create(obj_in)
        self._invalidate_open_jobs_cache()
        return job

    def update(self, id: UUID, obj_in: JobUpdate, client=None) -> Optional[Job]:
        db = client or supabase
        obj_data = jsonable_encoder(obj_in, exclude_unset=True)
        obj_data = {k: v for k, v in obj_data.items() if v is not None}
        try:
            response = db.table(self.table_name).update(obj_data).eq("id", str(id)).execute()
            if response.data:
                job = self.get(id)  # Re-fetch with creator
                self._invalidate_open_jobs_cache()
                return job
            return None
        except Exception as e:
            print(f"Error updating job: {e}")
            raise e

    def delete(self, id: UUID, client=None) -> bool:
        db = client or supabase
        try:
            # Delete related entities first (manual cascade)
            db.table("applications").delete().eq("job_id", str(id)).execute()
            db.table("reviews").delete().eq("job_id", str(id)).execute()
            db.table("bookmarks").delete().eq("job_id", str(id)).execute()
            
            # Now delete the job
            response = db.table(self.table_name).delete().eq("id", str(id)).execute()
            deleted = len(response.data) > 0
            if deleted:
                self._invalidate_open_jobs_cache()
            return deleted
        except Exception as e:
            print(f"Error deleting job: {e}")
            return False

job_repository = JobRepository(Job, "jobs")

