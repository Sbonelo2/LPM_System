import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../services/supabaseClient";

const SuperAdminProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, loading } = useAuth();
  const [profileRole, setProfileRole] = useState<string | null>(null);
  const [profileRoleLoading, setProfileRoleLoading] = useState<boolean>(false);
  const [profileRoleError, setProfileRoleError] = useState<string>("");

  const metadataRole = user?.user_metadata?.role;

  useEffect(() => {
    const loadRole = async () => {
      if (!user?.id) return;
      if (metadataRole) return;

      setProfileRoleLoading(true);
      setProfileRoleError("");
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          setProfileRole(null);
          setProfileRoleError(error.message);
          return;
        }

        setProfileRole(data?.role ?? null);
      } finally {
        setProfileRoleLoading(false);
      }
    };

    void loadRole();
  }, [user?.id, metadataRole]);

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!metadataRole && profileRoleLoading) {
    return null;
  }

  const effectiveRole = metadataRole ?? profileRole;
  if (effectiveRole !== "super_admin") {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
          Unauthorized
        </div>
        <div style={{ color: "#666", marginBottom: 12 }}>
          You are signed in, but your role is not recognized as{" "}
          <code>super_admin</code>.
        </div>
        <div
          style={{
            fontFamily: "monospace",
            fontSize: 12,
            whiteSpace: "pre-wrap",
          }}
        >
          metadataRole: {String(metadataRole ?? "null")}
          {"\n"}
          profileRole: {String(profileRole ?? "null")}
          {"\n"}
          profileRoleLoading: {String(profileRoleLoading)}
          {"\n"}
          profileRoleError: {profileRoleError ? profileRoleError : ""}
        </div>
        <div style={{ marginTop: 12, color: "#666" }}>
          Check <code>public.profiles.role</code> for your user id and ensure
          RLS allows reading it.
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default SuperAdminProtectedRoute;
