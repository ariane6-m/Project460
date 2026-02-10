import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Chart from './components/Chart';
import Navbar from './components/Navbar';
import Scanning from './components/Scanning';
import IDS from './components/IDS';
import Settings from './components/Settings';
import './App.css';

const Dashboard = () => {
  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <div className="dashboard-intro">
        <p>Welcome to <strong>Moto-Moto</strong>, your network security monitoring system.</p>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>🔍 Network Scanning</h3>
          <p>Discover and monitor devices on your network. Filter by device type, manufacturer, and IP range to find exactly what you're looking for.</p>
          <a href="/scanning" className="dashboard-link">Go to Scanning →</a>
        </div>

        <div className="dashboard-card">
          <h3>🛡️ Intrusion Detection</h3>
          <p>Monitor your network for suspicious activity and security threats. Start the IDS to receive real-time alerts about potential threats.</p>
          <a href="/ids" className="dashboard-link">Go to IDS →</a>
        </div>

        <div className="dashboard-card">
          <h3>⚙️ Settings</h3>
          <p>Customize how your security tools work. Configure scan frequency, alert sensitivity, and data retention settings.</p>
          <a href="/settings" className="dashboard-link">Go to Settings →</a>
        </div>
      </div>

      <div className="dashboard-stats">
        <h2>Quick Stats</h2>
        <p className="stat-placeholder">Run scans to see real-time network statistics here.</p>
      </div>
    </div>
  );
}

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage for saved dark mode preference
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    // Save dark mode preference to localStorage
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    // Apply dark mode class to body
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>Moto-Moto</h1>
          <Navbar />
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/scanning" element={<Scanning />} />
            <Route path="/ids" element={<IDS />} />
           <Route path="/settings" element={<Settings darkMode={darkMode} onDarkModeChange={toggleDarkMode} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
