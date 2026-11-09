import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FaTaxi, FaBars, FaTimes } from 'react-icons/fa';
import { clearSession, getToken } from '../utils/auth';
import './Navbar.css';

// Shared top bar. `links` is a list of { to, label } shown next to Profile / Logout.
const userLinks = [
  { to: '/', label: 'Book a cab' },
  { to: '/myCab', label: 'My trip' },
];

const Navbar = ({ homePath = '/', links = userLinks }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const loggedIn = Boolean(getToken());

  const handleLogOut = () => {
    clearSession();
    navigate('/login');
  };

  const allLinks = [...links, { to: '/profile', label: 'Profile' }];

  return (
    <header className="app-navbar">
      <div className="app-navbar__inner">
        <Link className="app-navbar__brand" to={homePath}>
          <span className="app-navbar__logo" aria-hidden="true"><FaTaxi /></span>
          Smart Cabs
        </Link>

        {loggedIn && (
          <>
            <button
              type="button"
              className="app-navbar__toggle"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              {open ? <FaTimes /> : <FaBars />}
            </button>
            <nav className={`app-navbar__links ${open ? 'is-open' : ''}`} aria-label="Main">
              {allLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end
                  className={({ isActive }) => `app-navbar__link ${isActive ? 'is-active' : ''}`}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </NavLink>
              ))}
              <button type="button" className="btn btn-outline-light-custom" onClick={handleLogOut}>
                Log out
              </button>
            </nav>
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar;
