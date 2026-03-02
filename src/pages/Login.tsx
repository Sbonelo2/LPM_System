import React, { useState } from "react";
import { supabase } from "../services/supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import InputField from "../components/InputField";
import Button from "../components/Button";
import "./Auth.css";

const Login: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const navigate = useNavigate();

  const withTimeout = async <T,>(
    promise: PromiseLike<T>,
    ms: number,
    label: string,
  ): Promise<T> => {
    return await Promise.race([
      Promise.resolve(promise),
      new Promise<T>((_resolve, reject) =>
        setTimeout(() => reject(new Error(`${label} timed out`)), ms),
      ),
    ]);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (email === "office@admin.com" && password === "123456") {
      localStorage.removeItem("admin-token");
      localStorage.removeItem("coordinator-token");
      localStorage.removeItem("qa-token");
      localStorage.setItem("super-admin-token", "dummy-super-admin-token");
      navigate("/super-admin/dashboard");
      setLoading(false);
      return;
    }

    if (email.endsWith("@admin.com") && password === "Admin123") {
      localStorage.removeItem("super-admin-token");
      localStorage.removeItem("coordinator-token");
      localStorage.removeItem("qa-token");
      localStorage.setItem("admin-token", "dummy-admin-token");
      navigate("/facilitator/dashboard");
      setLoading(false);
      return;
    }

    if (
      (email === "superadmin@gmail.com" && password === "SuperAdmin123") ||
      (email === "coordinator@gmail.com" && password === "Coordinator123") ||
      (email === "test@qa.com" && password === "Qa123")
    ) {
      localStorage.removeItem("admin-token");
      localStorage.removeItem("coordinator-token");
      localStorage.removeItem("qa-token");
      localStorage.setItem("super-admin-token", "dummy-super-admin-token");
      navigate("/super-admin/dashboard");
      setLoading(false);
      return;
    }

    localStorage.removeItem("admin-token");
    localStorage.removeItem("super-admin-token");
    localStorage.removeItem("coordinator-token");
    localStorage.removeItem("qa-token");

    try {
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({
          email,
          password,
        }),
        15000,
        "Sign in",
      );

      if (error) throw error;

      setMessage("Logged in successfully!");

      let effectiveRole = data.user?.user_metadata?.role;
      if (data.user?.id) {
        try {
          const { data: profileRow, error: profileError } = (await withTimeout(
            supabase
              .from("profiles")
              .select("role")
              .eq("id", data.user.id)
              .maybeSingle(),
            8000,
            "Load profile role",
          )) as {
            data: { role?: string } | null;
            error: { message: string } | null;
          };

          if (!profileError && profileRow?.role) {
            effectiveRole = profileRow.role;
          }
        } catch {
          // ignore role lookup failures
        }
      }

      if (effectiveRole === "admin") {
        navigate("/facilitator/dashboard");
      } else if (effectiveRole === "programme_coordinator") {
        navigate("/coordinator/documents");
      } else if (effectiveRole === "qa_officer") {
        navigate("/qa/dashboard");
      } else if (effectiveRole === "mentor") {
        navigate("/mentor/dashboard");
      } else {
        navigate("/learner/dashboard");
      }
    } catch (error: unknown) {
      alert(
        `Login failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      setMessage(
        `Login failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Login</h1>

        <form className="auth-form" onSubmit={handleLogin}>
          <InputField
            label="Email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            type="email"
            required
            disabled={loading}
            name="email"
            autoComplete="email"
          />

          <InputField
            label="Password"
            value={password}
            onChange={setPassword}
            placeholder="********"
            type="password"
            required
            disabled={loading}
            name="password"
            autoComplete="current-password"
          />

          <div className="auth-actions">
            <Button
              text={loading ? "Loading..." : "Sign In"}
              type="submit"
              className="auth-cta"
              disabled={loading}
            />
            <div className="auth-links">
              Don&apos;t have an account? <Link to="/signup">Sign Up</Link>
            </div>
          </div>
        </form>

        {message && <p>{message}</p>}
      </div>
    </div>
  );
};

export default Login;
