import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import Signup from './components/SignUp';
import MyCab from './components/MyCab';
import AdminDashboard from './components/AdminDashboard';
import AdminUsers from './components/AdminUsers'; // Import AdminUsers component
import UserDetails from './components/UserDetails'; // Import UserDetails component
import PrivateRoute from './components/PrivateRoute';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/myCab" 
          element={
            <PrivateRoute>
              <MyCab />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/admin-dashboard" 
          element={
            <PrivateRoute adminOnly={true}>
              <AdminDashboard />
            </PrivateRoute>
          } 
        />
        {/* Add Profile route */}
        <Route 
          path="/profile" 
          element={
            <PrivateRoute>
              <UserDetails />
            </PrivateRoute>
          } 
        />
        {/* Add Admin Users route */}
        <Route 
          path="/admin/users" 
          element={
            <PrivateRoute adminOnly={true}>
              <AdminUsers />
            </PrivateRoute>
          } 
        />
      </Routes>
    </Router>
  );
};

export default App;
