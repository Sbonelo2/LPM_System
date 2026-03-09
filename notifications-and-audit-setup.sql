-- Notification and Audit Setup

-- 1. Ensure is_super_admin function is defined correctly
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(
      auth.jwt() ->> 'role',
      auth.jwt() -> 'app_metadata' ->> 'role',
      auth.jwt() -> 'user_metadata' ->> 'role',
      ''
    ) = 'super_admin'
    OR COALESCE(lower(auth.email()), '') = 'office@admin.com';
$$;

-- 2. Create Notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  details text,
  read boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  can_reply boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 3. Create Audit Logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  action text NOT NULL,
  module text,
  details text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 4. Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 5. Notification Policies
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id OR public.is_super_admin());

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id OR public.is_super_admin())
WITH CHECK (auth.uid() = user_id OR public.is_super_admin());

DROP POLICY IF EXISTS "Super admins can insert notifications" ON public.notifications;
CREATE POLICY "Super admins can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Super admins can delete notifications" ON public.notifications;
CREATE POLICY "Super admins can delete notifications"
ON public.notifications FOR DELETE
USING (public.is_super_admin());

-- 6. Audit Log Policies
DROP POLICY IF EXISTS "Super admins can view all audit logs" ON public.audit_logs;
CREATE POLICY "Super admins can view all audit logs"
ON public.audit_logs FOR SELECT
USING (public.is_super_admin());

DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can insert audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- 7. Add to Realtime publication if exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;
