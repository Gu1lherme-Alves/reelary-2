-- Fix multi-tenant proxy port assignment to guarantee 100% unique ports across all users
CREATE OR REPLACE FUNCTION public.assign_proxy_port()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_port int;
BEGIN
  IF NEW.proxy_port IS NULL THEN
    SELECT g.p INTO next_port
    FROM generate_series(11000, 20000) AS g(p)
    LEFT JOIN public.instagram_accounts ia ON ia.proxy_port = g.p
    WHERE ia.proxy_port IS NULL
    ORDER BY g.p
    LIMIT 1;

    IF next_port IS NULL THEN
      SELECT COALESCE(MAX(proxy_port), 10999) + 1 INTO next_port FROM public.instagram_accounts;
    END IF;

    NEW.proxy_port := next_port;
  END IF;

  RETURN NEW;
END;
$$;

-- Enforce unique constraint across the entire table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_proxy_port'
  ) THEN
    ALTER TABLE public.instagram_accounts ADD CONSTRAINT unique_proxy_port UNIQUE (proxy_port);
  END IF;
END $$;
