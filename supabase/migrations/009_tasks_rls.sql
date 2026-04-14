-- Users need INSERT and UPDATE on their own tasks
-- (SELECT already exists; service_role ALL already exists)
CREATE POLICY "users can insert own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can update own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);
