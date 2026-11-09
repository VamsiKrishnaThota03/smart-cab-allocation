import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { clearSession, getSession } from '../utils/auth';

// Requires a valid, unexpired token. Admin-only routes also need the isAdmin claim.
const PrivateRoute = ({ children, adminOnly = false }) => {
  const location = useLocation();
  const session = getSession();

  if (!session) {
    clearSession();
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (adminOnly && !session.isAdmin) return <Navigate to="/" replace />;

  return children;
};

export default PrivateRoute;
