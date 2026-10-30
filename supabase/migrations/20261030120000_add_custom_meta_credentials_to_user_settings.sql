-- Migration: Add custom Meta Developer credentials and 'custom' profile to user_settings table

ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS custom_meta_app_id TEXT,
  ADD COLUMN IF NOT EXISTS custom_meta_app_secret TEXT;

ALTER TABLE public.user_settings
  DROP CONSTRAINT IF EXISTS check_profile_value;

ALTER TABLE public.user_settings
  ADD CONSTRAINT check_profile_value CHECK (meta_credential_profile IN ('guilherme', 'matheus', 'pedro', 'antonio', 'greg', 'esperanca', 'custom'));
