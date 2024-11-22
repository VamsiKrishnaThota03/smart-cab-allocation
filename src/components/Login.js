import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css"; // Optional: Add your CSS styles here
import { FaEye, FaEyeSlash } from "react-icons/fa"; // Import eye icons

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await axios.post(
        "http://localhost:5001/api/auth/login",
        {
          email,
          password,
        }
      );
      const { token, isAdmin } = response.data;

      console.log("Token:", token);
      console.log("isAdmin:", isAdmin);

      // Save token to localStorage (using the same key as in middleware)
      localStorage.setItem("auth-token", token);
      localStorage.setItem("isAdmin", isAdmin);

      // Redirect based on user role
      if (isAdmin) {
        console.log("Navigating to admin dashboard");
        navigate("/admin-dashboard"); // Redirect to Admin Dashboard if user is admin
      } else {
        console.log("Navigating to home page");
        navigate("/"); // Redirect to Home for normal users
      }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        setError("Incorrect Credentials.");
      } else {
        setError("Something went wrong. Please try again later.");
      }
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        <h2>Log In</h2>
        <form onSubmit={handleLogin}>
          <div className="password-input-container">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="password-input-container">
            <input
              type={showPassword ? "text" : "password"} // Toggle between password and text
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)} // Toggle visibility
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}{" "}
              {/* Show either eye or eye-slash icon */}
            </span>
          </div>
          <button type="submit">Log In</button>
        </form>
        {error && (
          <p className="error-message" style={{ color: "red" }}>
            {error}
          </p>
        )}
        <p>
          Don't have an account?{" "}
          <span
            onClick={() => navigate("/signup")}
            style={{ cursor: "pointer", color: "blue" }}
          >
            Sign Up
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
