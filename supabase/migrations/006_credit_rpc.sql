-- 原子扣减（余额不足返回 false）
CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id UUID,
  p_amount   INTEGER,
  p_task_id  UUID,
  p_desc     TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  SELECT balance INTO v_balance
  FROM user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_balance IS NULL OR v_balance < p_amount THEN
    RETURN FALSE;
  END IF;

  UPDATE user_credits
  SET balance = balance - p_amount, updated_at = NOW()
  WHERE user_id = p_user_id;

  INSERT INTO credit_logs (user_id, action, amount, balance, task_id, description)
  VALUES (p_user_id, 'consume', -p_amount, v_balance - p_amount, p_task_id, p_desc);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 退还积分（任务失败）
CREATE OR REPLACE FUNCTION refund_credits(
  p_user_id UUID,
  p_amount   INTEGER,
  p_task_id  UUID
) RETURNS VOID AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  UPDATE user_credits
  SET balance = balance + p_amount, updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING balance INTO v_balance;

  INSERT INTO credit_logs (user_id, action, amount, balance, task_id, description)
  VALUES (p_user_id, 'refund', p_amount, v_balance, p_task_id, '任务失败退款');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 充值（支付成功回调）
CREATE OR REPLACE FUNCTION add_credits(
  p_user_id UUID,
  p_amount   INTEGER,
  p_order_id UUID
) RETURNS VOID AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  UPDATE user_credits
  SET balance = balance + p_amount, updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING balance INTO v_balance;

  INSERT INTO credit_logs (user_id, action, amount, balance, order_id, description)
  VALUES (p_user_id, 'purchase', p_amount, v_balance, p_order_id, '积分充值');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
