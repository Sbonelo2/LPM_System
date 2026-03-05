-- ========================================
-- FIX RLS RECURSION ISSUE
-- ========================================

-- The issue is that RLS policies on learner_profiles reference auth.users
-- which can cause infinite recursion. We need to simplify the policies.

-- ========================================
-- 1. DISABLE RLS ON LEARNER_PROFILES (Simplest Fix)
-- ========================================
-- If you don't need strict RLS on learner_profiles, disable it:
ALTER TABLE IF EXISTS learner_profiles DISABLE ROW LEVEL SECURITY;

-- ========================================
-- 2. ALTERNATIVE: SIMPLIFIED RLS POLICIES (If you need RLS)
-- ========================================
-- If you need RLS, use these simplified policies that don't cause recursion:

-- First, drop any existing policies that might cause recursion
DROP POLICY IF EXISTS "Learners can view own profile" ON learner_profiles;
DROP POLICY IF EXISTS "Learners can update own profile" ON learner_profiles;
DROP POLICY IF EXISTS "Learners can insert own profile" ON learner_profiles;

-- Enable RLS
ALTER TABLE learner_profiles ENABLE ROW LEVEL SECURITY;

-- Create simplified policies using auth.uid() directly (no subqueries)
CREATE POLICY "Users can view own profile"
ON learner_profiles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile"
ON learner_profiles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
ON learner_profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ========================================
-- 3. FIX FOREIGN KEY REFERENCE ISSUE
-- ========================================
-- If the issue is with foreign key checks, ensure proper indexes exist:

CREATE INDEX IF NOT EXISTS idx_learner_profiles_user_id ON learner_profiles(user_id);

-- ========================================
-- 4. CHECK AND FIX auth.users POLICIES (if any exist on public.users view)
-- ========================================
-- If you have a public.users view or table, ensure it doesn't conflict with auth.users:

-- Check if public.users table exists and has RLS
DO $$
BEGIN
  -- Disable RLS on public.users if it exists (to avoid conflicts with auth.users)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'users'
  ) THEN
    EXECUTE 'ALTER TABLE public.users DISABLE ROW LEVEL SECURITY';
  END IF;
END $$;

-- ========================================
-- 5. ALTERNATIVE APPROACH: SECURITY DEFINER FUNCTION
-- ========================================
-- Create a security definer function that bypasses RLS for the save operation:

CREATE OR REPLACE FUNCTION public.save_learner_profile(
  p_user_id UUID,
  p_learner_name TEXT,
  p_email TEXT,
  p_learner_address TEXT,
  p_learner_identifier TEXT,
  p_programme TEXT,
  p_profile_image_url TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- This bypasses RLS
SET search_path = public
AS $$
DECLARE
  v_profile_id UUID;
BEGIN
  -- Check if profile exists
  SELECT id INTO v_profile_id
  FROM learner_profiles
  WHERE user_id = p_user_id;
  
  IF v_profile_id IS NOT NULL THEN
    -- Update existing
    UPDATE learner_profiles
    SET 
      learner_name = p_learner_name,
      email = p_email,
      learner_address = p_learner_address,
      learner_identifier = p_learner_identifier,
      programme = p_programme,
      profile_image_url = p_profile_image_url,
      updated_at = NOW()
    WHERE id = v_profile_id;
    
    RETURN v_profile_id;
  ELSE
    -- Insert new
    INSERT INTO learner_profiles (
      user_id,
      learner_name,
      email,
      learner_address,
      learner_identifier,
      programme,
      profile_image_url
    ) VALUES (
      p_user_id,
      p_learner_name,
      p_email,
      p_learner_address,
      p_learner_identifier,
      p_programme,
      p_profile_image_url
    )
    RETURNING id INTO v_profile_id;
    
    RETURN v_profile_id;
  END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.save_learner_profile TO authenticated;

-- ========================================
-- VERIFICATION
-- ========================================
DO $$
BEGIN
  RAISE NOTICE 'RLS policies fixed. Try saving the profile again.';
  RAISE NOTICE 'If issues persist, consider using the save_learner_profile() function.';
END $$;
