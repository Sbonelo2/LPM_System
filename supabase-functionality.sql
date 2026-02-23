-- NOTE: This script is intended to extend the existing Supabase setup.
-- It assumes you already have:
-- - public.documents (and documents storage bucket) from supabase-setup.sql
-- - public.notifications (already created in your Supabase project)
--
-- Run this in Supabase SQL editor.

-- Required for uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------
-- Helpers
-- ------------------------------------------------------------

-- Convenience function for role checks using auth JWT.
-- Expected: user_metadata.role set to one of:
-- 'admin' | 'programme_coordinator' | 'qa_officer' | 'learner'
CREATE OR REPLACE FUNCTION public.current_app_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'learner');
$$;

-- ------------------------------------------------------------
-- Profiles (public user metadata for app)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  role text NOT NULL DEFAULT 'learner',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
CREATE POLICY "Admin can view all profiles" ON public.profiles
  FOR SELECT USING (public.current_app_role() = 'admin');

DROP POLICY IF EXISTS "Admin can manage profiles" ON public.profiles;
CREATE POLICY "Admin can manage profiles" ON public.profiles
  FOR ALL USING (public.current_app_role() = 'admin') WITH CHECK (public.current_app_role() = 'admin');

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'fullName', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'learner')
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ------------------------------------------------------------
-- Placements
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.placements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  learner_id uuid REFERENCES auth.users(id) NOT NULL,
  coordinator_id uuid REFERENCES auth.users(id),
  host_name text NOT NULL,
  programme text NOT NULL,
  status text NOT NULL DEFAULT 'Pending',
  start_date date,
  end_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.placements ENABLE ROW LEVEL SECURITY;

-- Learners can view their own placements
DROP POLICY IF EXISTS "Learners can view their placements" ON public.placements;
CREATE POLICY "Learners can view their placements" ON public.placements
  FOR SELECT
  USING (
    public.current_app_role() = 'learner'
    AND auth.uid() = learner_id
  );

-- Coordinators and QA and Admin can view all placements
DROP POLICY IF EXISTS "Staff can view placements" ON public.placements;
CREATE POLICY "Staff can view placements" ON public.placements
  FOR SELECT
  USING (
    public.current_app_role() IN ('admin', 'programme_coordinator', 'qa_officer')
  );

-- Coordinators/Admin can insert placements
DROP POLICY IF EXISTS "Coordinators or Admin can create placements" ON public.placements;
CREATE POLICY "Coordinators or Admin can create placements" ON public.placements
  FOR INSERT
  WITH CHECK (
    public.current_app_role() IN ('admin', 'programme_coordinator')
  );

-- Coordinators/Admin can update placements
DROP POLICY IF EXISTS "Coordinators or Admin can update placements" ON public.placements;
CREATE POLICY "Coordinators or Admin can update placements" ON public.placements
  FOR UPDATE
  USING (
    public.current_app_role() IN ('admin', 'programme_coordinator')
  )
  WITH CHECK (
    public.current_app_role() IN ('admin', 'programme_coordinator')
  );

-- ------------------------------------------------------------
-- Required document rules (admin-configured)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.required_document_rules (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  applies_to_role text NOT NULL, -- learners|facilitators|qa_officers|programme_coordinators (UI naming)
  document_name text NOT NULL,
  required boolean NOT NULL DEFAULT true,
  allowed_formats text NOT NULL DEFAULT 'PDF',
  max_size_mb integer NOT NULL DEFAULT 5,
  expiry_required boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.required_document_rules ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read rules (UI needs this)
DROP POLICY IF EXISTS "Authenticated users can read required document rules" ON public.required_document_rules;
CREATE POLICY "Authenticated users can read required document rules" ON public.required_document_rules
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Admin can manage rules
DROP POLICY IF EXISTS "Admin can manage required document rules" ON public.required_document_rules;
CREATE POLICY "Admin can manage required document rules" ON public.required_document_rules
  FOR ALL
  USING (public.current_app_role() = 'admin')
  WITH CHECK (public.current_app_role() = 'admin');

-- ------------------------------------------------------------
-- Notification settings (admin-configured)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.notification_settings (
  id text PRIMARY KEY,
  title text NOT NULL,
  channel text NOT NULL DEFAULT 'email', -- email|sms|in_app
  recipients jsonb NOT NULL DEFAULT '{}'::jsonb,
  subject text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read notification settings" ON public.notification_settings;
CREATE POLICY "Authenticated users can read notification settings" ON public.notification_settings
  FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin can manage notification settings" ON public.notification_settings;
CREATE POLICY "Admin can manage notification settings" ON public.notification_settings
  FOR ALL
  USING (public.current_app_role() = 'admin')
  WITH CHECK (public.current_app_role() = 'admin');

-- ------------------------------------------------------------
-- App settings (admin-configured key/value)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read app settings" ON public.app_settings;
CREATE POLICY "Authenticated users can read app settings" ON public.app_settings
  FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin can manage app settings" ON public.app_settings;
CREATE POLICY "Admin can manage app settings" ON public.app_settings
  FOR ALL
  USING (public.current_app_role() = 'admin')
  WITH CHECK (public.current_app_role() = 'admin');

-- ------------------------------------------------------------
-- Compliance rules (admin-configured)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.compliance_rules (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  area text NOT NULL, -- learner_placements|assessments|document_submissions|host_compliance
  rule_name text NOT NULL,
  applies_to text NOT NULL,
  doc_type text,
  max_size_mb integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.compliance_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read compliance rules" ON public.compliance_rules;
CREATE POLICY "Authenticated users can read compliance rules" ON public.compliance_rules
  FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin can manage compliance rules" ON public.compliance_rules;
CREATE POLICY "Admin can manage compliance rules" ON public.compliance_rules
  FOR ALL
  USING (public.current_app_role() = 'admin')
  WITH CHECK (public.current_app_role() = 'admin');

-- ------------------------------------------------------------
-- Security permissions (admin-configured)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.security_permissions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_key text NOT NULL, -- learners|facilitators|qa_officers
  view_learner_data boolean NOT NULL DEFAULT true,
  submit_assessments boolean NOT NULL DEFAULT true,
  approve_documents boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(role_key)
);

ALTER TABLE public.security_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read security permissions" ON public.security_permissions;
CREATE POLICY "Authenticated users can read security permissions" ON public.security_permissions
  FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin can manage security permissions" ON public.security_permissions;
CREATE POLICY "Admin can manage security permissions" ON public.security_permissions
  FOR ALL
  USING (public.current_app_role() = 'admin')
  WITH CHECK (public.current_app_role() = 'admin');

-- ------------------------------------------------------------
-- Maintenance settings (admin-configured)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.maintenance_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  status text NOT NULL DEFAULT 'inactive', -- active|inactive
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  allow_admins_only boolean NOT NULL DEFAULT true,
  allow_qa_officers boolean NOT NULL DEFAULT false,
  allow_programme_coordinators boolean NOT NULL DEFAULT false,
  allow_learners boolean NOT NULL DEFAULT false,
  notification_channel text NOT NULL DEFAULT 'email', -- email|sms|in_app
  recipients jsonb NOT NULL DEFAULT '{}'::jsonb,
  subject text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- If your maintenance_settings table already existed before adding allow_learners, run:
-- ALTER TABLE public.maintenance_settings ADD COLUMN IF NOT EXISTS allow_learners boolean NOT NULL DEFAULT false;

ALTER TABLE public.maintenance_settings ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read maintenance settings so UI can enforce it
DROP POLICY IF EXISTS "Authenticated users can read maintenance settings" ON public.maintenance_settings;
CREATE POLICY "Authenticated users can read maintenance settings" ON public.maintenance_settings
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Admin can manage
DROP POLICY IF EXISTS "Admin can manage maintenance settings" ON public.maintenance_settings;
CREATE POLICY "Admin can manage maintenance settings" ON public.maintenance_settings
  FOR ALL
  USING (public.current_app_role() = 'admin')
  WITH CHECK (public.current_app_role() = 'admin');

-- ------------------------------------------------------------
-- Document verification (QA workflow)
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.document_verifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id uuid REFERENCES public.documents(id) NOT NULL,
  qa_officer_id uuid REFERENCES auth.users(id) NOT NULL,
  status text NOT NULL DEFAULT 'Pending', -- Pending|Approved|Rejected
  rejection_reason text,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(document_id)
);

ALTER TABLE public.document_verifications ENABLE ROW LEVEL SECURITY;

-- Learner can view verifications for their own documents
DROP POLICY IF EXISTS "Learner can view verification status for their documents" ON public.document_verifications;
CREATE POLICY "Learner can view verification status for their documents" ON public.document_verifications
  FOR SELECT
  USING (
    public.current_app_role() = 'learner'
    AND EXISTS (
      SELECT 1
      FROM public.documents d
      WHERE d.id = document_id AND d.user_id = auth.uid()
    )
  );

-- QA/Admin/Coordinator can view all verifications
DROP POLICY IF EXISTS "Staff can view document verifications" ON public.document_verifications;
CREATE POLICY "Staff can view document verifications" ON public.document_verifications
  FOR SELECT
  USING (
    public.current_app_role() IN ('admin', 'qa_officer', 'programme_coordinator')
  );

-- QA/Admin can create/update verification
DROP POLICY IF EXISTS "QA or Admin can upsert document verifications" ON public.document_verifications;
CREATE POLICY "QA or Admin can upsert document verifications" ON public.document_verifications
  FOR INSERT
  WITH CHECK (
    public.current_app_role() IN ('admin', 'qa_officer')
    AND qa_officer_id = auth.uid()
  );

DROP POLICY IF EXISTS "QA or Admin can update document verifications" ON public.document_verifications;
CREATE POLICY "QA or Admin can update document verifications" ON public.document_verifications
  FOR UPDATE
  USING (
    public.current_app_role() IN ('admin', 'qa_officer')
  )
  WITH CHECK (
    public.current_app_role() IN ('admin', 'qa_officer')
  );

-- ------------------------------------------------------------
-- QA Issues
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.qa_issues (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id uuid REFERENCES public.documents(id) NOT NULL,
  raised_by uuid REFERENCES auth.users(id) NOT NULL,
  severity text NOT NULL DEFAULT 'Medium', -- Low|Medium|High
  title text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'Open', -- Open|Resolved
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.qa_issues ENABLE ROW LEVEL SECURITY;

-- Learner can view issues for their own documents
DROP POLICY IF EXISTS "Learner can view issues for their documents" ON public.qa_issues;
CREATE POLICY "Learner can view issues for their documents" ON public.qa_issues
  FOR SELECT
  USING (
    public.current_app_role() = 'learner'
    AND EXISTS (
      SELECT 1
      FROM public.documents d
      WHERE d.id = document_id AND d.user_id = auth.uid()
    )
  );

-- Staff can view all issues
DROP POLICY IF EXISTS "Staff can view QA issues" ON public.qa_issues;
CREATE POLICY "Staff can view QA issues" ON public.qa_issues
  FOR SELECT
  USING (
    public.current_app_role() IN ('admin', 'qa_officer', 'programme_coordinator')
  );

-- QA/Admin can create issues
DROP POLICY IF EXISTS "QA or Admin can create issues" ON public.qa_issues;
CREATE POLICY "QA or Admin can create issues" ON public.qa_issues
  FOR INSERT
  WITH CHECK (
    public.current_app_role() IN ('admin', 'qa_officer')
    AND raised_by = auth.uid()
  );

-- QA/Admin can update issues
DROP POLICY IF EXISTS "QA or Admin can update issues" ON public.qa_issues;
CREATE POLICY "QA or Admin can update issues" ON public.qa_issues
  FOR UPDATE
  USING (
    public.current_app_role() IN ('admin', 'qa_officer')
  )
  WITH CHECK (
    public.current_app_role() IN ('admin', 'qa_officer')
  );
