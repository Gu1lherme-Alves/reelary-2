-- Add proxy_port column to instagram_accounts for sticky proxy per account
-- Each account gets a unique port (11000+) for consistent IP when publishing

ALTER TABLE public.instagram_accounts
ADD COLUMN IF NOT EXISTS proxy_port integer;

-- Auto-assign ports to all existing accounts (11000, 11001, 11002, ...)
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) - 1 AS rn
  FROM public.instagram_accounts
  WHERE proxy_port IS NULL
)
UPDATE public.instagram_accounts
SET proxy_port = 11000 + numbered.rn
FROM numbered
WHERE public.instagram_accounts.id = numbered.id;

-- Add unique constraint to prevent duplicate port assignments
ALTER TABLE public.instagram_accounts
ADD CONSTRAINT unique_proxy_port UNIQUE (proxy_port);

-- Create index for quick lookup
CREATE INDEX IF NOT EXISTS idx_instagram_accounts_proxy_port
ON public.instagram_accounts(proxy_port);

-- Function to auto-assign next available proxy port when a new account is added
CREATE OR REPLACE FUNCTION public.assign_proxy_port()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.proxy_port IS NULL THEN
    SELECT COALESCE(MAX(proxy_port), 10999) + 1
    INTO NEW.proxy_port
    FROM public.instagram_accounts;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to auto-assign port on insert
DROP TRIGGER IF EXISTS trg_assign_proxy_port ON public.instagram_accounts;
CREATE TRIGGER trg_assign_proxy_port
  BEFORE INSERT ON public.instagram_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_proxy_port();

-- Update grab_pending_posts_to_publish to include proxy_port
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
  updated_at timestamp with time zone,
  proxy_port integer
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
      ep.rn_account ASC,
      ep.rn_user ASC,
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
    lp.updated_at,
    ia.proxy_port
  FROM locked_posts lp
  JOIN public.instagram_accounts ia ON lp.instagram_account_id = ia.id;
END;
$$;

