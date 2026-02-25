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

    localStorage.removeItem("admin-token");
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

      // Check user role and redirect accordingly
      const userId = data.user?.id;
      const metadataRole = data.user?.user_metadata?.role;

      let effectiveRole: string | undefined = metadataRole;
      if (userId) {
        const { data: profileRow, error: profileError } = (await withTimeout(
          supabase
            .from("profiles")
            .select("role")
            .eq("id", userId)
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
      }

      if (effectiveRole === "programme_coordinator") {
        navigate("/coordinator/documents");
      } else if (effectiveRole === "qa_officer") {
        navigate("/qa/dashboard");
      } else if (effectiveRole === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/learner/dashboard"); // Default dashboard for learners
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
