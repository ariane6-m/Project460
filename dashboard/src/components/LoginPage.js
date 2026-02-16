import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api';
import './LoginPage.css';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false); // New state for toggling between login/register
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleAuth = async (e) => {
        e.preventDefault();
        setError(''); // Clear previous errors

        try {
            let response;
            if (isRegistering) {
                response = await apiClient.post('/register', { username, password });
                // If registration is successful, automatically log in the user
                if (response.status === 201) {
                  const loginResponse = await apiClient.post('/login', { username, password });
                  localStorage.setItem('token', loginResponse.data.token);
                  navigate('/');
                }
            } else {
                response = await apiClient.post('/login', { username, password });
                if (response.data.token) {
                    localStorage.setItem('token', response.data.token);
                    navigate('/');
                }
            }
        } catch (err) {
            if (err.response && err.response.status === 409) {
                setError('Username already exists.');
            } else if (err.response && err.response.status === 401) {
                setError('Invalid username or password.');
            } else {
                setError('An unexpected error occurred.');
            }
        }
    };

    return (
        <div className="login-container">
            <form onSubmit={handleAuth} className="login-form">
                <h2>{isRegistering ? 'Register' : 'Login'}</h2>
                {error && <p className="error-message">{error}</p>}
                <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">{isRegistering ? 'Register' : 'Login'}</button>
                <button
                    type="button"
                    className="toggle-auth-mode"
                    onClick={() => setIsRegistering(!isRegistering)}
                >
                    {isRegistering ? 'Already have an account? Login' : 'Need an account? Register'}
                </button>
            </form>
        </div>
    );
};

export default LoginPage;
