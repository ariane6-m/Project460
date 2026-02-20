import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api';
import './Metrics.css';

const Metrics = () => {
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await apiClient.get('/metrics/json');
        setMetrics(response.data);
      } catch (err) {
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          setError(<span>Failed to fetch metrics. Please <Link to="/login">login</Link> to view system metrics.</span>);
        } else {
          setError('Failed to fetch metrics. Please make sure the API is running.');
        }
        console.error(err);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000); // Fetch every 5 seconds

    return () => clearInterval(interval);
  }, []);

  if (error) {
    return <div className="metrics-container"><h2>System Metrics</h2><p className="error">{error}</p></div>;
  }

  if (!metrics) {
    return <div className="metrics-container"><h2>System Metrics</h2><p>Loading...</p></div>;
  }

  return (
    <div className="metrics-container">
      <h2>System Metrics</h2>
      <p>Last updated: {new Date(metrics.timestamp).toLocaleTimeString()}</p>
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>CPU Usage</h3>
          <p>{(metrics.cpuUsage * 100).toFixed(2)}%</p>
        </div>
        <div className="metric-card">
          <h3>Memory Usage</h3>
          <p>Free: {metrics.freeMemory.toFixed(2)} MB</p>
          <p>Total: {metrics.totalMemory.toFixed(2)} MB</p>
        </div>
      </div>
    </div>
  );
};

export default Metrics;
