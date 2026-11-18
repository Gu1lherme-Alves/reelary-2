-- Migration: Add custom_redirect_uri to user_settings table
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS custom_redirect_uri TEXT;
