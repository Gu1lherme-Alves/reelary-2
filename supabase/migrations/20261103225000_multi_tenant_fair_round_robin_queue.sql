-- Multi-tenant fair round-robin scheduling for scheduled_posts
-- Prevents any single user or account from monopolizing the queue

CREATE INDEX IF NOT EXISTS idx_scheduled_posts_video_url ON scheduled_posts(video_url);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_cover_url ON scheduled_posts(cover_url);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_queue_lookup ON scheduled_posts(status, scheduled_at, locked_at);

CREATE OR REPLACE FUNCTION public.grab_pending_posts_to_publish(limit_count integer)
RETURNS TABLE(
  id uuid,
  video_url text,
  caption text,
  scheduled_at timestamp with time zone,
  ig_container_id text,
  cover_url text,
  retry_count integer,
  instagram_account_id uuid,
  instagram_user_id text,
  access_token text,
  username text,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH eligible_posts AS (
    SELECT 
      p.id,
      p.user_id,
      p.instagram_account_id,
      p.scheduled_at,
      ROW_NUMBER() OVER (
        PARTITION BY p.user_id, p.instagram_account_id 
        ORDER BY p.scheduled_at ASC
      ) as rn_account,
      ROW_NUMBER() OVER (
        PARTITION BY p.user_id 
        ORDER BY p.scheduled_at ASC
      ) as rn_user
    FROM public.scheduled_posts p
    JOIN public.instagram_accounts ia ON p.instagram_account_id = ia.id
    WHERE p.status = 'pending'
      AND p.scheduled_at <= now()
      AND (p.locked_at IS NULL OR p.locked_at < now() - interval '5 minutes')
      AND (ia.token_invalid IS NOT TRUE)
  ),
  fair_selection AS (
    SELECT ep.id
    FROM eligible_posts ep
    ORDER BY 
      ep.rn_account ASC, -- 1st reel of every account gets processed before 2nd reel of any account!
      ep.rn_user ASC,    -- Fair round-robin across users!
      ep.scheduled_at ASC
    LIMIT limit_count
  ),
  locked_posts AS (
    UPDATE public.scheduled_posts
    SET locked_at = now()
    WHERE public.scheduled_posts.id IN (
      SELECT p.id 
      FROM public.scheduled_posts p 
      WHERE p.id IN (SELECT fs.id FROM fair_selection fs)
      FOR UPDATE OF p SKIP LOCKED
    )
    RETURNING *
  )
  SELECT 
    lp.id, 
    lp.video_url, 
    lp.caption, 
    lp.scheduled_at, 
    lp.ig_container_id, 
    lp.cover_url,
    lp.retry_count,
    lp.instagram_account_id,
    ia.instagram_user_id,
    ia.access_token,
    ia.username,
    lp.updated_at
  FROM locked_posts lp
  JOIN public.instagram_accounts ia ON lp.instagram_account_id = ia.id;
END;
$$;
