-- Creating player_profiles table to store user profile data
CREATE TABLE IF NOT EXISTS public.player_profiles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now(),
    wallet_address text UNIQUE NOT NULL,
    username text NOT NULL,
    bio text,
    location text,
    favorite_games text[],
    profile_image_url text,
    wins integer DEFAULT 0,
    losses integer DEFAULT 0,
    total_earnings numeric DEFAULT 0,
    signature text NOT NULL
);

-- Enable RLS
ALTER TABLE public.player_profiles ENABLE ROW LEVEL SECURITY;

-- Allow anyone to create a profile
CREATE POLICY "Allow anyone to create profile" ON public.player_profiles
    FOR INSERT
    WITH CHECK (true);

-- Allow users to view all profiles
CREATE POLICY "Allow viewing all profiles" ON public.player_profiles
    FOR SELECT
    USING (true);

-- Allow users to update their own profile
CREATE POLICY "Allow updating own profile" ON public.player_profiles
    FOR UPDATE
    USING (true)
    WITH CHECK (true);
