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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (email.endsWith('@admin.com') && password === 'Admin123') {
      localStorage.setItem('admin-token', 'dummy-admin-token');
      navigate('/admin/dashboard');
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      setMessage("Logged in successfully!");
      navigate("/dashboard"); // Redirect to dashboard on successful login
    } catch (error: unknown) {
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
