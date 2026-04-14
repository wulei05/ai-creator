CREATE TABLE app_config (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL DEFAULT '',
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only service_role can access (server-side only, never exposed to client)
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role only"
  ON app_config FOR ALL
  USING (auth.role() = 'service_role');

-- Seed default config keys (empty values, filled via admin UI)
INSERT INTO app_config (key, description) VALUES
  ('FAL_KEY', 'fal.ai API Key (图像生成)'),
  ('KLING_API_KEY', 'Kling API Key (视频生成)'),
  ('OPENAI_API_KEY', 'OpenAI API Key (GPT-4o 对话)'),
  ('DEEPSEEK_API_KEY', 'DeepSeek API Key (DeepSeek 对话)'),
  ('ANTHROPIC_API_KEY', 'Anthropic API Key (Claude 对话)'),
  ('XUNHU_APPID', '虎皮椒 AppID (支付宝收款)'),
  ('XUNHU_KEY', '虎皮椒密钥 (支付宝收款)')
ON CONFLICT (key) DO NOTHING;
