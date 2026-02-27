import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
        return <Navigate to="/login" />;
    }

    try {
        const decoded = jwtDecode(token);
        // If token is expired, redirect to login
        if (decoded.exp * 1000 < Date.now()) {
            localStorage.removeItem('token');
            return <Navigate to="/login" />;
        }
    } catch (error) {
        // If token is invalid/corrupted, redirect to login
        localStorage.removeItem('token');
        return <Navigate to="/login" />;
    }

    return children;
};

export default ProtectedRoute;
