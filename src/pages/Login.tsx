import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setMessage('Logged in successfully!');
      navigate('/dashboard'); // Redirect to dashboard on successful login
    } catch (error: any) {
      setMessage(`Login failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { data: _data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      setMessage('Sign up successful! Check your email for confirmation.');
      // Optional: Automatically log in or redirect after sign up
    } catch (error: any) {
      setMessage(`Sign up failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Login / Sign Up</h2>
      <form onSubmit={handleLogin}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'Login'}
        </button>
        <button type="button" onClick={handleSignUp} disabled={loading} style={{ marginLeft: '10px' }}>
          {loading ? 'Loading...' : 'Sign Up'}
        </button>
      </form>
      {message && <p>{message}</p>}

      <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <h3>Dummy User Credentials for Testing:</h3>
        <p><strong>Email:</strong> <code>test@email.co.za</code></p>
        <p><strong>Password:</strong> <code>Pass123</code></p>
        <p style={{ fontSize: '0.8em', color: '#666' }}>
          <em>Please use the "Sign Up" button above to register this user in Supabase first,
          then you can log in.</em>
        </p>
      </div>
    </div>
  );
};

export default Login;
