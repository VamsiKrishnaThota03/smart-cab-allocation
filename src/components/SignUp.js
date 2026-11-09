import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';
import { errorMessage, getSession, saveSession } from '../utils/auth';
import AuthLayout from './AuthLayout';
import PasswordInput from './PasswordInput';

const Signup = () => {
  const [credentials, setCredentials] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (getSession()) return <Navigate to="/" replace />;

  const onChange = (e) => setCredentials({ ...credentials, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_URL}/api/auth/register`, credentials);
      saveSession(data.token, data.isAdmin);
      navigate(data.isAdmin ? '/admin-dashboard' : '/');
    } catch (err) {
      setError(errorMessage(err));
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="It takes less than a minute."
      footer={<>Already have an account? <Link to="/login">Log in</Link></>}
    >
      {error && <div className="alert-box alert-box--error" role="alert">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="signup-name">Name</label>
          <input
            id="signup-name"
            className="input"
            type="text"
            name="name"
            autoComplete="name"
            placeholder="Your full name"
            minLength={3}
            value={credentials.name}
            onChange={onChange}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="signup-email">Email</label>
          <input
            id="signup-email"
            className="input"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={credentials.email}
            onChange={onChange}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="signup-password">Password</label>
          <PasswordInput
            id="signup-password"
            name="password"
            autoComplete="new-password"
            placeholder="At least 5 characters"
            minLength={5}
            value={credentials.password}
            onChange={onChange}
            required
          />
        </div>
        <button type="submit" className="btn btn-accent btn-block" disabled={loading}>
          {loading ? 'Creating account…' : 'Sign up'}
        </button>
      </form>
    </AuthLayout>
  );
};

export default Signup;
