
-- Followers table
CREATE TABLE public.followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view follows" ON public.followers FOR SELECT TO public USING (true);
CREATE POLICY "Users can follow others" ON public.followers FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON public.followers FOR DELETE TO authenticated USING (auth.uid() = follower_id);

-- Add watch_status column to favorites
ALTER TABLE public.favorites ADD COLUMN IF NOT EXISTS watch_status text NOT NULL DEFAULT 'plan_to_watch';

-- Activity log table
CREATE TABLE public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  anime_id integer,
  anime_title text,
  anime_image text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Activity is viewable by everyone" ON public.activity_log FOR SELECT TO public USING (true);
CREATE POLICY "Users can insert own activity" ON public.activity_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
