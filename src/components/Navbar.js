import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ hideProfileButton }) => {
    let navigate = useNavigate();
    const location = useLocation();

    const handleLogOut = () => {
        localStorage.removeItem('auth-token'); // Remove token from localStorage on logout
        navigate('/login'); // Navigate to login page
    };

    return (
        <nav className="navbar">
            <div className="navbar-content">
                {/* Smart Cabs logo aligned to the left */}
                <Link className="navbar-brand" to="/">Smart Cabs</Link>

                {/* Render Profile and Logout buttons aligned to the right only if the user is logged in */}
                {localStorage.getItem('auth-token') && (
                    <div className="navbar-right">
                        {/* Profile button - Hide if on profile page */}
                        {!hideProfileButton && location.pathname !== '/profile' && (
                            <button className="logout-btn" onClick={() => navigate('/profile')}>
                                Profile
                            </button>
                        )}
                        {/* Logout button */}
                        <button className="logout-btn" onClick={handleLogOut}>
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
