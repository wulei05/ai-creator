CREATE TYPE order_status AS ENUM (
  'pending',
  'paid',
  'expired',
  'refunded'
);

CREATE TABLE orders (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id),
  amount_fen  INTEGER NOT NULL,
  credits     INTEGER NOT NULL,
  status      order_status NOT NULL DEFAULT 'pending',
  pay_id      TEXT,
  pay_url     TEXT,
  paid_at     TIMESTAMPTZ,
  expired_at  TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 minutes',
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_user   ON orders(user_id, created_at DESC);
CREATE INDEX idx_orders_pay_id ON orders(pay_id);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "service role can manage orders"
  ON orders FOR ALL
  USING (auth.role() = 'service_role');
