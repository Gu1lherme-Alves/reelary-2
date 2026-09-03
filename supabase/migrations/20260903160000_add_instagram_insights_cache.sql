-- Create tables for caching Instagram performance insights

CREATE TABLE IF NOT EXISTS public.instagram_account_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instagram_account_id UUID NOT NULL REFERENCES public.instagram_accounts(id) ON DELETE CASCADE,
  followers_count INTEGER DEFAULT 0,
  follows_count INTEGER DEFAULT 0,
  media_count INTEGER DEFAULT 0,
  total_views BIGINT DEFAULT 0,
  total_reach BIGINT DEFAULT 0,
  total_likes BIGINT DEFAULT 0,
  total_comments BIGINT DEFAULT 0,
  total_shares BIGINT DEFAULT 0,
  total_saved BIGINT DEFAULT 0,
  engagement_rate NUMERIC(6, 2) DEFAULT 0.00,
  last_synced_at TIMESTAMPTZ DEFAULT now(),
  raw_insights JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_account_insights_account UNIQUE(instagram_account_id)
);

CREATE TABLE IF NOT EXISTS public.instagram_media_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instagram_account_id UUID NOT NULL REFERENCES public.instagram_accounts(id) ON DELETE CASCADE,
  ig_media_id TEXT NOT NULL,
  caption TEXT,
  media_type TEXT,
  permalink TEXT,
  thumbnail_url TEXT,
  media_url TEXT,
  views_count BIGINT DEFAULT 0,
  reach_count BIGINT DEFAULT 0,
  like_count BIGINT DEFAULT 0,
  comments_count BIGINT DEFAULT 0,
  shares_count BIGINT DEFAULT 0,
  saved_count BIGINT DEFAULT 0,
  engagement_rate NUMERIC(6, 2) DEFAULT 0.00,
  published_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT uq_media_insights_media UNIQUE(instagram_account_id, ig_media_id)
);

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_account_insights_user_id ON public.instagram_account_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_account_insights_account_id ON public.instagram_account_insights(instagram_account_id);
CREATE INDEX IF NOT EXISTS idx_media_insights_user_id ON public.instagram_media_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_media_insights_account_id ON public.instagram_media_insights(instagram_account_id);
CREATE INDEX IF NOT EXISTS idx_media_insights_published_at ON public.instagram_media_insights(published_at DESC);

-- Enable RLS
ALTER TABLE public.instagram_account_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_media_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for instagram_account_insights
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'instagram_account_insights' AND policyname = 'Users can manage own account insights'
  ) THEN
    CREATE POLICY "Users can manage own account insights"
      ON public.instagram_account_insights
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- RLS Policies for instagram_media_insights
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'instagram_media_insights' AND policyname = 'Users can manage own media insights'
  ) THEN
    CREATE POLICY "Users can manage own media insights"
      ON public.instagram_media_insights
      FOR ALL
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
