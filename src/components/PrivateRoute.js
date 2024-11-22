import React from 'react';
import { Navigate } from 'react-router-dom';
import {jwtDecode} from 'jwt-decode'; // Correct import

const PrivateRoute = ({ children, adminOnly = false }) => {
  const token = localStorage.getItem('auth-token'); // Get token from localStorage

  if (!token) {
    // If no token, redirect to login
    return <Navigate to="/login" />;
  }

  try {
    const decodedToken = jwtDecode(token);
    const isAdmin = decodedToken?.isAdmin; // Assuming the token contains 'isAdmin' flag

    if (adminOnly && !isAdmin) {
      // If the route is admin-only and user is not an admin, redirect to Home
      return <Navigate to="/" />;
    }
    
    return children; // Render the component if checks pass
  } catch (error) {
    // In case of token parsing errors, log the user out (optional)
    localStorage.removeItem('auth-token');
    return <Navigate to="/login" />;
  }
};

export default PrivateRoute;