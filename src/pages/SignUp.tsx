import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import InputField from "../components/InputField";
import Button from "../components/Button";
import "./Auth.css";

const SignUp: React.FC = () => {
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            fullName,
          },
        },
      });

      if (error) throw error;
      setMessage("Sign up successful! Check your email for confirmation.");
      navigate("/login");
    } catch (error: unknown) {
      setMessage(
        `Sign up failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Sign Up</h1>

        <form className="auth-form" onSubmit={handleSignUp}>
          <InputField
            label="Full Name"
            value={fullName}
            onChange={setFullName}
            placeholder="John Doe"
            disabled={loading}
            name="fullName"
            autoComplete="name"
          />

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
            autoComplete="new-password"
          />

          <div className="auth-actions">
            <Button
              text={loading ? "Loading..." : "Create Account"}
              type="submit"
              className="auth-cta"
              disabled={loading}
            />
            <div className="auth-links">
              Already have an account? <Link to="/login">Login</Link>
            </div>
          </div>
        </form>

        {message && <p>{message}</p>}
      </div>
    </div>
  );
};

export default SignUp;
