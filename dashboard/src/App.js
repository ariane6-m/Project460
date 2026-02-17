import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar'; // Import Sidebar
import Scanning from './components/Scanning';
import Settings from './components/Settings';
import DeviceHistory from './components/DeviceHistory'; // Import DeviceHistory
import Metrics from './components/Metrics';
import Graphs from './components/Graphs';
import Devices from './components/Devices';
import Alerts from './components/Alerts';
import Timeline from './components/Timeline';
import LoginPage from './components/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminPanel from './components/AdminPanel'; // Import AdminPanel
import './App.css';

const Dashboard = () => {
  return (
    <div className="dashboard-content">
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

const MainLayout = ({ children, darkMode, toggleDarkMode }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // State to manage sidebar visibility

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className="App-container">
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
            <div className={`main-content-wrapper ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
                <header className="App-header">
                    <button className="hamburger-btn" onClick={toggleSidebar}>
                        &#9776; {/* Hamburger Icon */}
                    </button>
                    <div className="header-content"> {/* Wrap h1 and Navbar for better alignment */}
                        <h1>Moto-Moto</h1>
                        <Navbar />
                    </div>
                </header>
                <main className="main-content">
                    {children}
                </main>
            </div>
        </div>
    );
}

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
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
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainLayout darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/scanning" element={<Scanning />} />
                  <Route path="/settings" element={<Settings darkMode={darkMode} onDarkModeChange={toggleDarkMode} />} />
                  <Route path="/metrics" element={<Metrics />} />
                  <Route path="/graphs" element={<Graphs />} />
                  <Route path="/devices" element={<Devices />} />
                  <Route path="/alerts" element={<Alerts />} />
                  <Route path="/timeline" element={<Timeline />} />
                  <Route path="/device-history" element={<DeviceHistory />} />
                  <Route path="/admin" element={<AdminPanel />} />
                </Routes>
              </MainLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
