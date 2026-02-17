import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import './AdminPanel.css'; // We'll create this CSS file next
import { jwtDecode } from 'jwt-decode';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setCurrentUserRole(decodedToken.role);
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get('/admin/users');
      setUsers(response.data);
    } catch (err) {
      setError('Failed to fetch users.');
      console.error(err);
    }
  };

  const handleChangeRole = async (username, newRole) => {
    if (!window.confirm(`Are you sure you want to change the role of ${username} to ${newRole}?`)) {
      return;
    }
    try {
      await apiClient.put(`/admin/users/${username}/role`, { role: newRole });
      setMessage(`Role for ${username} updated to ${newRole}.`);
      fetchUsers(); // Refresh the user list
      // If the current user changes their own role, they might need to re-login
      // For simplicity, we'll just update the local role state for the current user
      if (username === jwtDecode(localStorage.getItem('token')).username) {
        setCurrentUserRole(newRole);
      }
    } catch (err) {
      setError(`Failed to update role for ${username}.`);
      console.error(err);
    }
  };

  if (currentUserRole !== 'Admin') {
    return <div className="admin-panel-container"><h2>Access Denied</h2><p>You do not have administrative privileges to view this page.</p></div>;
  }

  return (
    <div className="admin-panel-container">
      <h2>Admin Panel</h2>
      {error && <p className="error-message">{error}</p>}
      {message && <p className="success-message">{message}</p>}

      <h3>User Management</h3>
      <table className="user-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.username}>
              <td>{user.username}</td>
              <td>{user.role}</td>
              <td>
                <select
                  value={user.role}
                  onChange={(e) => handleChangeRole(user.username, e.target.value)}
                  disabled={user.username === 'admin'} // Prevent changing 'admin' user's role for simplicity
                >
                  <option value="Admin">Admin</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminPanel;
