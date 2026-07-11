-- Add Bio and Skills columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS skills TEXT[]; -- Using Text Array for simplicity

-- Create Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES public.jobs(id) NOT NULL,
  reviewer_id UUID REFERENCES public.users(id) NOT NULL,
  reviewee_id UUID REFERENCES public.users(id) NOT NULL,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(job_id, reviewer_id) -- One review per job per user
);

-- Enable RLS for Reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policies for Reviews
CREATE POLICY "Users can view reviews"
  ON public.reviews FOR SELECT USING (true);

CREATE POLICY "Users can create reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

-- Job board query indexes
CREATE INDEX IF NOT EXISTS jobs_open_created_at_idx
  ON public.jobs (created_at DESC)
  WHERE status = 'OPEN';

CREATE INDEX IF NOT EXISTS jobs_creator_created_at_idx
  ON public.jobs (creator_id, created_at DESC);

CREATE INDEX IF NOT EXISTS jobs_group_created_at_idx
  ON public.jobs (group_id, created_at DESC);
