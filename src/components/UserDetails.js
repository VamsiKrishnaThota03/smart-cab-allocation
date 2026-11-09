import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaUserCircle } from 'react-icons/fa';
import Navbar from './Navbar';
import AdminNavbar from './AdminNavbar';
import { API_URL } from '../config';
import { authHeaders, errorMessage, isAdminSession } from '../utils/auth';
import './UserDetails.css';

const UserDetails = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const isAdmin = isAdminSession();

  useEffect(() => {
    axios
      .get(`${API_URL}/api/auth/getuser`, { headers: authHeaders() })
      .then(({ data }) => setUser(data))
      .catch((err) => setError(errorMessage(err, 'Could not load your profile.')));
  }, []);

  return (
    <>
      {isAdmin ? <AdminNavbar /> : <Navbar />}
      <main className="page profile-page">
        <div className="profile-card surface">
          <div className="profile-card__avatar" aria-hidden="true"><FaUserCircle /></div>
          <h1 className="profile-card__title">Your profile</h1>

          {error && <div className="alert-box alert-box--error" role="alert">{error}</div>}

          {!user && !error && (
            <div className="profile-card__loading" role="status">
              <span className="spinner" aria-hidden="true" /> Loading profile…
            </div>
          )}

          {user && (
            <dl className="profile-card__details">
              <div>
                <dt>Name</dt>
                <dd>{user.name}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{user.email}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>
                  <span className={`badge-pill ${user.isAdmin ? 'badge-pill--admin' : ''}`}>
                    {user.isAdmin ? 'Admin' : 'Rider'}
                  </span>
                </dd>
              </div>
            </dl>
          )}
        </div>
      </main>
    </>
  );
};

export default UserDetails;
