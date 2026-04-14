-- Create the ai-creations storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ai-creations',
  'ai-creations',
  true,
  52428800, -- 50MB
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to read files
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'ai-creations');

-- Allow service role to upload (INSERT) files
-- (service role bypasses RLS, but explicit policy helps with anon/authenticated clients)
CREATE POLICY "Authenticated users can upload own files" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'ai-creations' AND
    (storage.foldername(name))[1] = 'images' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );
