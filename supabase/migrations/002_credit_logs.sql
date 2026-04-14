CREATE TYPE credit_action AS ENUM (
  'purchase',
  'consume',
  'refund',
  'bonus'
);

CREATE TABLE credit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id),
  action      credit_action NOT NULL,
  amount      INTEGER NOT NULL,
  balance     INTEGER NOT NULL,
  description TEXT,
  task_id     UUID,
  order_id    UUID,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_credit_logs_user ON credit_logs(user_id, created_at DESC);

ALTER TABLE credit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can view own logs"
  ON credit_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "service role can insert logs"
  ON credit_logs FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
