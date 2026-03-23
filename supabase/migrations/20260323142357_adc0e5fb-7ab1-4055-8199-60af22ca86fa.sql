
-- Voting categories table
CREATE TABLE public.voting_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category_type text NOT NULL DEFAULT 'general',
  year integer NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.voting_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Voting categories are viewable by everyone"
  ON public.voting_categories FOR SELECT
  TO public USING (true);

-- Voting nominees table
CREATE TABLE public.voting_nominees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.voting_categories(id) ON DELETE CASCADE NOT NULL,
  anime_id integer,
  anime_title text NOT NULL,
  anime_image text,
  character_name text,
  vote_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.voting_nominees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nominees are viewable by everyone"
  ON public.voting_nominees FOR SELECT
  TO public USING (true);

-- User votes table
CREATE TABLE public.user_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category_id uuid REFERENCES public.voting_categories(id) ON DELETE CASCADE NOT NULL,
  nominee_id uuid REFERENCES public.voting_nominees(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, category_id)
);

ALTER TABLE public.user_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all votes"
  ON public.user_votes FOR SELECT
  TO public USING (true);

CREATE POLICY "Authenticated users can insert their own vote"
  ON public.user_votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vote"
  ON public.user_votes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to increment vote count
CREATE OR REPLACE FUNCTION public.cast_vote(p_user_id uuid, p_category_id uuid, p_nominee_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_nominee_id uuid;
BEGIN
  -- Check if user already voted in this category
  SELECT nominee_id INTO old_nominee_id
  FROM public.user_votes
  WHERE user_id = p_user_id AND category_id = p_category_id;

  IF old_nominee_id IS NOT NULL THEN
    -- Decrement old nominee
    UPDATE public.voting_nominees SET vote_count = GREATEST(vote_count - 1, 0) WHERE id = old_nominee_id;
    -- Update vote
    UPDATE public.user_votes SET nominee_id = p_nominee_id WHERE user_id = p_user_id AND category_id = p_category_id;
  ELSE
    -- Insert new vote
    INSERT INTO public.user_votes (user_id, category_id, nominee_id) VALUES (p_user_id, p_category_id, p_nominee_id);
  END IF;

  -- Increment new nominee
  UPDATE public.voting_nominees SET vote_count = vote_count + 1 WHERE id = p_nominee_id;
END;
$$;

-- Enable realtime for live results
ALTER PUBLICATION supabase_realtime ADD TABLE public.voting_nominees;
