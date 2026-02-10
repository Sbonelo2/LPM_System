import React, { useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useNavigate } from "react-router-dom";
import InputField from "../components/InputField";

const Login: React.FC = () => {
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      setMessage("Sign up successful! Check your email for confirmation.");
      // Optional: Automatically log in or redirect after sign up
    } catch (error: unknown) {
      setMessage(
        `Sign up failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Login / Sign Up</h2>
      <form onSubmit={handleLogin}>
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
          autoComplete="current-password"
        />
        <button type="submit" disabled={loading}>
          {loading ? "Loading..." : "Login"}
        </button>
        <button
          type="button"
          onClick={handleSignUp}
          disabled={loading}
          style={{ marginLeft: "10px" }}
        >
          {loading ? "Loading..." : "Sign Up"}
        </button>
      </form>
      {message && <p>{message}</p>}

      <div
        style={{
          marginTop: "20px",
          padding: "10px",
          border: "1px solid #ccc",
          borderRadius: "5px",
        }}
      >
        <h3>Dummy User Credentials for Testing:</h3>
        <p>
          <strong>Email:</strong> <code>test@mail.co.za</code>
        </p>
        <p>
          <strong>Password:</strong> <code>Pass123</code>
        </p>
        <p style={{ fontSize: "0.8em", color: "#666" }}>
          <em>
            Please use the "Sign Up" button above to register this user in
            Supabase first, then you can log in.
          </em>
        </p>
      </div>
    </div>
  );
};

export default Login;
