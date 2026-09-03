-- Migration to add profile_picture_url to instagram_accounts and instagram_account_insights
ALTER TABLE public.instagram_accounts 
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

ALTER TABLE public.instagram_account_insights 
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
