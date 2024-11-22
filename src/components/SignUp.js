import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Import eye icons
import './SignUp.css'; // Import custom styles

const Signup = () => {
  const [credentials, setCredentials] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear any existing error message
    try {
      const response = await axios.post('http://localhost:5001/api/auth/register', {
        name: credentials.name,
        email: credentials.email,
        password: credentials.password,
      });
  
      const { token } = response.data;
      localStorage.setItem('auth-token', token);
      navigate('/'); // Redirect to the home page after successful sign-up
    } catch (error) {
      if (error.response) {
        const errorMessage = error.response.data.message || 'Something went wrong. Please try again later.';
        setError(errorMessage); // Set the error message from the server
      } else {
        setError('Unable to connect to the server. Please try again later.');
      }
    }
  };
  
  

  const onChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  return (
    <div className="signup-wrapper">
      <div className="signup-container">
        <h2>Sign Up</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Name"
            name="name"
            value={credentials.name}
            onChange={onChange}
            required
            style={{ width: '92%' }}
          />
          <input
            type="email"
            placeholder="Email"
            name="email"
            value={credentials.email}
            onChange={onChange}
            required
            style={{ width: '92%' }}
          />
          <div className="password-input-container">
            <input
              type={showPassword ? 'text' : 'password'} // Toggle between password and text
              placeholder="Password"
              name="password"
              value={credentials.password}
              onChange={onChange}
              required
            />
            <span
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)} // Toggle visibility
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />} {/* Show eye or eye-slash icon */}
            </span>
          </div>
          <button type="submit">Sign Up</button>
        </form>
        {error && <p className="error-message">{error}</p>}
        <p>
          Already have an account?{' '}
          <span onClick={() => navigate('/login')} style={{ cursor: 'pointer', color: 'blue' }}>
            Log In
          </span>
        </p>
      </div>
    </div>
  );
};

export default Signup;
