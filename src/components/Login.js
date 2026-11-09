import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import { errorMessage, getSession, saveSession } from '../utils/auth';
import AuthLayout from './AuthLayout';
import PasswordInput from './PasswordInput';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const session = getSession();
  if (session) return <Navigate to={session.isAdmin ? '/admin-dashboard' : '/'} replace />;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      saveSession(data.token, data.isAdmin);
      navigate(data.isAdmin ? '/admin-dashboard' : '/');
    } catch (err) {
      setError(err.response?.status === 400 ? 'Incorrect email or password.' : errorMessage(err));
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to book a cab near you."
      footer={<>Don't have an account? <Link to="/signup">Sign up</Link></>}
    >
      {error && <div className="alert-box alert-box--error" role="alert">{error}</div>}
      <form onSubmit={handleLogin}>
        <div className="field">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            className="input"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="login-password">Password</label>
          <PasswordInput
            id="login-password"
            autoComplete="current-password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-accent btn-block" disabled={loading}>
          {loading ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </AuthLayout>
  );
};

export default Login;
