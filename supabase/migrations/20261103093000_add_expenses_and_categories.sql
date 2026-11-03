-- Migration: Add expenses and expense categories for financial tracking
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#f59e0b',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expense_categories' AND policyname = 'Users view own expense categories') THEN
    CREATE POLICY "Users view own expense categories" ON public.expense_categories
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expense_categories' AND policyname = 'Users insert own expense categories') THEN
    CREATE POLICY "Users insert own expense categories" ON public.expense_categories
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expense_categories' AND policyname = 'Users update own expense categories') THEN
    CREATE POLICY "Users update own expense categories" ON public.expense_categories
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expense_categories' AND policyname = 'Users delete own expense categories') THEN
    CREATE POLICY "Users delete own expense categories" ON public.expense_categories
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.expense_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expenses' AND policyname = 'Users view own expenses') THEN
    CREATE POLICY "Users view own expenses" ON public.expenses
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expenses' AND policyname = 'Users insert own expenses') THEN
    CREATE POLICY "Users insert own expenses" ON public.expenses
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expenses' AND policyname = 'Users update own expenses') THEN
    CREATE POLICY "Users update own expenses" ON public.expenses
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'expenses' AND policyname = 'Users delete own expenses') THEN
    CREATE POLICY "Users delete own expenses" ON public.expenses
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON public.expenses(user_id, expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category_id);

