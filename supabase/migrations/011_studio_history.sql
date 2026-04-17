-- studio_history 表
CREATE TABLE IF NOT EXISTS studio_history (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('web', 'image')),
  title      TEXT,
  thumbnail  TEXT,
  data       JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE studio_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_history"
  ON studio_history FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS studio_history_user_type_idx
  ON studio_history(user_id, type, created_at DESC);

-- Storage policy: allow authenticated users to upload to studio/{user_id}/ path
CREATE POLICY "Authenticated users can upload studio images" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'ai-creations' AND
    (storage.foldername(name))[1] = 'studio' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );
