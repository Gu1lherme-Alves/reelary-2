-- Migration: Assign proxy ports only on post schedule (or on manual test)
-- Removes pre-allocation on account creation. Ports grow sequentially per user (11000..proxy_port_end).

-- 1. Remover trigger antigo de alocação automática ao adicionar conta
DROP TRIGGER IF EXISTS trg_assign_proxy_port ON public.instagram_accounts;

-- 2. Garantir unicidade da porta por usuário (e não global)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_proxy_port') THEN
    ALTER TABLE public.instagram_accounts DROP CONSTRAINT unique_proxy_port;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_proxy_port') THEN
    ALTER TABLE public.instagram_accounts ADD CONSTRAINT unique_user_proxy_port UNIQUE (user_id, proxy_port);
  END IF;
END $$;

-- 3. Função que aloca a próxima porta sequencial para uma conta dentro da faixa do usuário
CREATE OR REPLACE FUNCTION public.assign_next_proxy_port(p_account_id uuid, p_user_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_port int;
  start_p int;
  end_p int;
  next_p int;
BEGIN
  -- Se a conta já tiver porta, retorna ela mesma
  SELECT proxy_port INTO existing_port
  FROM public.instagram_accounts
  WHERE id = p_account_id;

  IF existing_port IS NOT NULL THEN
    RETURN existing_port;
  END IF;

  -- Obter intervalo configurado pelo usuário
  SELECT COALESCE(proxy_port_start, 11000), COALESCE(proxy_port_end, 15000)
  INTO start_p, end_p
  FROM public.user_settings
  WHERE user_id = p_user_id;

  IF start_p IS NULL THEN
    start_p := 11000;
    end_p := 15000;
  END IF;

  -- Encontrar a menor porta livre dentro do range do usuário
  SELECT g.p INTO next_p
  FROM generate_series(start_p, end_p) AS g(p)
  LEFT JOIN public.instagram_accounts ia ON ia.user_id = p_user_id AND ia.proxy_port = g.p
  WHERE ia.proxy_port IS NULL
  ORDER BY g.p
  LIMIT 1;

  IF next_p IS NULL THEN
    RAISE EXCEPTION 'Todas as portas entre % e % já estão em uso por suas contas.', start_p, end_p;
  END IF;

  -- Atribuir à conta
  UPDATE public.instagram_accounts
  SET proxy_port = next_p
  WHERE id = p_account_id;

  RETURN next_p;
END;
$$;

-- 4. Trigger para alocar porta automaticamente quando um post for agendado
CREATE OR REPLACE FUNCTION public.assign_port_on_post_schedule()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.assign_next_proxy_port(NEW.instagram_account_id, NEW.user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_port_on_post_schedule ON public.scheduled_posts;

CREATE TRIGGER trg_assign_port_on_post_schedule
BEFORE INSERT ON public.scheduled_posts
FOR EACH ROW
EXECUTE FUNCTION public.assign_port_on_post_schedule();

-- 5. Limpar portas de contas que não possuem agendamentos pendentes ativos
UPDATE public.instagram_accounts
SET proxy_port = NULL
WHERE id NOT IN (
  SELECT DISTINCT instagram_account_id
  FROM public.scheduled_posts
  WHERE status = 'pending'
);
