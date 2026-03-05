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
      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: "learner",
          },
        },
      });

      if (error) throw error;

      // Create profile in Supabase after successful signup
      if (data.user) {
        try {
          // Create profile in profiles table
          await supabase.from("profiles").upsert(
            {
              id: data.user.id,
              email: email,
              full_name: fullName,
              role: "learner",
            },
            { onConflict: "id" },
          );

          // Create learner profile
          await supabase.from("learner_profiles").upsert(
            {
              user_id: data.user.id,
              learner_name: fullName,
              email: email,
              programme: "Software Development",
            },
            { onConflict: "user_id" },
          );
        } catch (profileError) {
          console.error("Profile creation error:", profileError);
          // Continue even if profile creation fails - tables might not exist yet
        }
      }

      setMessage(
        "Sign up successful! Please check your email for confirmation.",
      );
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      alert(`Sign up failed: ${errorMessage}`);
      setMessage(`Sign up failed: ${errorMessage}`);
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
              text={loading ? "Creating Account..." : "Create Account"}
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
