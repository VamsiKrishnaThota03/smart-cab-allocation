import React from 'react';
import Navbar from './Navbar';

const adminLinks = [
  { to: '/admin-dashboard', label: 'Cabs' },
  { to: '/admin/users', label: 'Users' },
];

const AdminNavbar = () => <Navbar homePath="/admin-dashboard" links={adminLinks} />;

export default AdminNavbar;
