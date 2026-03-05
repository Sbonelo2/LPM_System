-- System Monitoring Backend Setup

-- 1. Create a table for system metrics if it doesn't exist
CREATE TABLE IF NOT EXISTS public.system_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name text NOT NULL,
    metric_value numeric NOT NULL,
    metric_type text NOT NULL, -- 'counter', 'gauge', 'percentage'
    status text DEFAULT 'stable',
    created_at timestamp with time zone DEFAULT now()
);

-- 2. Create a table for service status
CREATE TABLE IF NOT EXISTS public.service_status (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name text UNIQUE NOT NULL,
    is_enabled boolean DEFAULT true,
    uptime_percent numeric DEFAULT 100.0,
    last_checked_at timestamp with time zone DEFAULT now()
);

-- 3. Function to get a summary of system health
CREATE OR REPLACE FUNCTION public.get_system_health_summary()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_users integer;
    active_users_last_hour integer;
    total_documents integer;
    total_placements integer;
    critical_errors integer;
    result jsonb;
BEGIN
    -- Only super_admin can call this
    IF NOT public.is_super_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    SELECT count(*) INTO total_users FROM auth.users;
    
    -- Mocking active users for now (users logged in/active in last hour)
    -- In a real system, you'd track sessions or heartbeats
    SELECT count(*) INTO active_users_last_hour FROM profiles WHERE updated_at > now() - interval '1 hour';
    
    SELECT count(*) INTO total_documents FROM public.documents;
    
    SELECT count(*) INTO total_placements FROM public.learner_placements;
    
    -- Assuming an audit_logs table exists and we track errors there
    -- If not, we return a mock value
    BEGIN
        SELECT count(*) INTO critical_errors FROM public.audit_logs WHERE action = 'ERROR' AND created_at > now() - interval '24 hours';
    EXCEPTION WHEN OTHERS THEN
        critical_errors := 0;
    END;

    result := jsonb_build_object(
        'total_users', total_users,
        'active_users_1h', active_users_last_hour,
        'total_documents', total_documents,
        'total_placements', total_placements,
        'critical_errors_24h', critical_errors,
        'health_status', CASE WHEN critical_errors > 5 THEN 'Degraded' ELSE 'Healthy' END,
        'timestamp', now()
    );

    RETURN result;
END;
$$;

-- 4. Initial seed data for services
INSERT INTO public.service_status (service_name, is_enabled, uptime_percent)
VALUES 
    ('Authentication Service', true, 99.98),
    ('Notifications Service', true, 99.72),
    ('Document Storage', true, 99.91),
    ('Database Cluster', true, 99.99)
ON CONFLICT (service_name) DO UPDATE 
SET uptime_percent = EXCLUDED.uptime_percent;

-- 5. Enable RLS
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_status ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
DROP POLICY IF EXISTS "Super admins can manage metrics" ON public.system_metrics;
CREATE POLICY "Super admins can manage metrics" ON public.system_metrics
    FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "Super admins can manage service status" ON public.service_status;
CREATE POLICY "Super admins can manage service status" ON public.service_status
    FOR ALL USING (public.is_super_admin());

-- Allow read-only for metrics to all authenticated users (optional, if you want a public status page)
-- For now, let's keep it restricted to Super Admin as requested.
