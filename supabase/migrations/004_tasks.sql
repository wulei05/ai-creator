CREATE TYPE task_type AS ENUM ('image', 'video', 'chat');

CREATE TYPE task_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed'
);

CREATE TABLE tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id),
  type            task_type NOT NULL,
  model           TEXT NOT NULL,
  status          task_status NOT NULL DEFAULT 'pending',
  credits_cost    INTEGER NOT NULL,
  prompt          TEXT,
  input_url       TEXT,
  output_url      TEXT,
  output_urls     TEXT[],
  upstream_id     TEXT,
  error_message   TEXT,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

CREATE INDEX idx_tasks_user     ON tasks(user_id, created_at DESC);
CREATE INDEX idx_tasks_upstream ON tasks(upstream_id);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can view own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "service role can manage tasks"
  ON tasks FOR ALL
  USING (auth.role() = 'service_role');
