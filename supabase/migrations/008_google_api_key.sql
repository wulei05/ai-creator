-- Add Google API Key for Gemini models
INSERT INTO app_config (key, description) VALUES
  ('GOOGLE_API_KEY', 'Google API Key (Gemini 对话)')
ON CONFLICT (key) DO NOTHING;
