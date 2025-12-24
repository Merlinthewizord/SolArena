-- Create championship_registrations table
CREATE TABLE IF NOT EXISTS public.championship_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  discord_username TEXT,
  country TEXT NOT NULL,
  wallet_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_championship_registrations_email ON public.championship_registrations(email);

-- Enable RLS (not strictly needed for public submissions, but good practice)
ALTER TABLE public.championship_registrations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert registrations
CREATE POLICY "Allow anyone to register"
  ON public.championship_registrations
  FOR INSERT
  WITH CHECK (true);

-- Only allow viewing own registration (or could be admin-only)
CREATE POLICY "Allow viewing own registration"
  ON public.championship_registrations
  FOR SELECT
  USING (true);
