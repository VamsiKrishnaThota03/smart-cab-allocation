import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaTrashAlt } from "react-icons/fa"; // Trash icon for deleting users
import AdminNavbar from './AdminNavbar';
import './AdminUsers.css';



const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Check if the user is admin and has a valid token
  const checkAdminAuth = () => {
    const token = localStorage.getItem("auth-token");
    const isAdmin = localStorage.getItem("isAdmin");
console.log(token);
console.log(isAdmin);

    if (!token || isAdmin !== "true") {
      navigate("/login"); // Redirect to login if not an admin
    }
  };

  // Fetch all users
  const fetchUsers = async () => {
    try {
      const response = await axios.get("http://localhost:5001/api/admin/users", {
        headers: {
          'auth-token': localStorage.getItem("auth-token"),
        },
      });
      setUsers(response.data);
    } catch (error) {
      setError("Failed to fetch users. Please try again later.");
      console.error(error);
    }
  };

  // Delete user
  const deleteUser = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this user?");
    if (confirmDelete) {
      try {
        await axios.delete(`http://localhost:5001/api/admin/users/${id}`, {
          headers: {
            "auth-token": localStorage.getItem("auth-token"),
          },
        });
        fetchUsers(); // Re-fetch users after deletion
      } catch (error) {
        setError("Failed to delete user.");
        console.error(error);
      }
    }
  };

  useEffect(() => {
    checkAdminAuth(); // Ensure the user is an admin
    fetchUsers(); // Fetch users when the component mounts
  }, []);

  return (
    <>
      <AdminNavbar />

    <div className="admin-users-wrapper">
      <div className="admin-users-container">
        <h2>Manage Users</h2>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <div className="user-list">
          <h3>User List</h3>
          {users.length > 0 ? (
            <ul>
              {users.map((user) => (
                <li key={user._id} style={{ marginBottom: "15px", display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <strong>{user.name}</strong> - {user.email} - {user.isAdmin ? "Admin" : "User"}
                  </div>
                  <button
                    onClick={() => deleteUser(user._id)}
                    disabled={user.isAdmin} // Disable delete for admin users
                    style={{
                      backgroundColor: user.isAdmin ? "#ccc" : "#dc3545",
                      color: "#fff",
                      border: "none",
                      padding: "8px 15px",
                      cursor: user.isAdmin ? "not-allowed" : "pointer",
                    }}
                  >
                    <FaTrashAlt /> Delete
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No users found.</p>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default AdminUsers;
