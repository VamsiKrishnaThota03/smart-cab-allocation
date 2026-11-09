import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { FaTrashAlt } from 'react-icons/fa';
import AdminNavbar from './AdminNavbar';
import { API_URL } from '../config';
import { authHeaders, errorMessage } from '../utils/auth';
import './AdminUsers.css';
import './UserDetails.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/admin/users`, { headers: authHeaders() });
      setUsers(data);
      setError('');
    } catch (err) {
      setError(errorMessage(err, 'Failed to fetch users. Please try again later.'));
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteUser = async (user) => {
    if (!window.confirm(`Delete ${user.name} (${user.email})? This cannot be undone.`)) return;
    setDeletingId(user._id);
    setNotice('');
    try {
      await axios.delete(`${API_URL}/api/admin/users/${user._id}`, { headers: authHeaders() });
      setUsers((current) => current.filter((u) => u._id !== user._id));
      setNotice(`${user.name} was deleted.`);
    } catch (err) {
      setError(errorMessage(err, 'Failed to delete user.'));
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <>
      <AdminNavbar />
      <main className="page">
        <div className="page-header">
          <h1>Manage users</h1>
          <p>{loading ? 'Loading…' : `${users.length} registered user${users.length === 1 ? '' : 's'}`}</p>
        </div>

        {error && <div className="alert-box alert-box--error" role="alert">{error}</div>}
        {notice && <div className="alert-box alert-box--success" role="status">{notice}</div>}

        <div className="surface users-table-wrap">
          {loading ? (
            <div className="empty-state" role="status"><span className="spinner" aria-hidden="true" /></div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <strong>No users yet</strong>
              Riders appear here after they sign up.
            </div>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Role</th>
                  <th scope="col"><span className="visually-hidden-text">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td data-label="Name" className="users-table__name">{user.name}</td>
                    <td data-label="Email">{user.email}</td>
                    <td data-label="Role">
                      <span className={`badge-pill ${user.isAdmin ? 'badge-pill--admin' : ''}`}>
                        {user.isAdmin ? 'Admin' : 'Rider'}
                      </span>
                    </td>
                    <td className="users-table__actions">
                      <button
                        type="button"
                        className="btn btn-sm btn-danger-soft"
                        onClick={() => deleteUser(user)}
                        disabled={user.isAdmin || deletingId === user._id}
                        title={user.isAdmin ? 'Admins cannot be deleted' : `Delete ${user.name}`}
                      >
                        <FaTrashAlt aria-hidden="true" /> {deletingId === user._id ? 'Deleting…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </>
  );
};

export default AdminUsers;
