
-- Watch stats table to track user anime watching activity
CREATE TABLE public.watch_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  anime_id integer NOT NULL,
  anime_title text NOT NULL,
  anime_image text,
  anime_genres text[],
  episodes_watched integer NOT NULL DEFAULT 0,
  total_episodes integer,
  rewatch_count integer NOT NULL DEFAULT 0,
  total_watch_time_minutes integer NOT NULL DEFAULT 0,
  last_watched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, anime_id)
);

ALTER TABLE public.watch_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own watch stats" ON public.watch_stats
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own watch stats" ON public.watch_stats
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own watch stats" ON public.watch_stats
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Public watch stats are viewable" ON public.watch_stats
  FOR SELECT TO anon USING (true);

-- Badges table
CREATE TABLE public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_id text NOT NULL,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Badges are viewable by everyone" ON public.user_badges
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own badges" ON public.user_badges
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Add banner_url to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banner_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;
