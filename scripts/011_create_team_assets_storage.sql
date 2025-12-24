-- Create Supabase Storage bucket for team assets (logos, metadata)
INSERT INTO storage.buckets (id, name, public)
VALUES ('team-assets', 'team-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to team assets
CREATE POLICY "Public read access to team assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'team-assets');

-- Allow authenticated users to upload team assets
CREATE POLICY "Authenticated users can upload team assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'team-assets');

-- Allow service role full access to team assets
CREATE POLICY "Service role can manage team assets"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'team-assets');
