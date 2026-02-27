import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api';
import './Metrics.css';

const Metrics = () => {
  const [metrics, setMetrics] = useState(null);
  const [useAgent, setUseAgent] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const endpoint = useAgent ? '/metrics/agent' : '/metrics/json';
        const response = await apiClient.get(endpoint);
        setMetrics(response.data);
        setError(null);
      } catch (err) {
        if (err.response && err.response.status === 404 && useAgent) {
          setError('No agent data found. Please run agent.py on your local computer.');
        } else if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          setError(<span>Failed to fetch metrics. Please <Link to="/login">login</Link>.</span>);
        } else {
          setError('Failed to fetch metrics.');
        }
        setMetrics(null);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, [useAgent]);

  return (
    <div className="metrics-container">
      <div className="metrics-header">
        <h2>System Metrics</h2>
        <div className="metrics-toggle">
          <button 
            className={!useAgent ? 'active' : ''} 
            onClick={() => setUseAgent(false)}
          >
            Cloud Server
          </button>
          <button 
            className={useAgent ? 'active' : ''} 
            onClick={() => setUseAgent(True)}
          >
            Local Computer (Agent)
          </button>
        </div>
      </div>

      {metrics && (
        <>
          <div className="server-info-badge">
            {useAgent ? `Local Agent: ${metrics.hostname} (${metrics.platform})` : 'Monitoring Server (GCP VM)'}
          </div>
          <p>Last updated: {new Date(metrics.timestamp).toLocaleTimeString()}</p>
          <div className="metrics-grid">
            <div className="metric-card">
              <h3>CPU Usage</h3>
              <p>{(metrics.cpuUsage * 100).toFixed(2)}%</p>
            </div>
            <div className="metric-card">
              <h3>Memory Usage</h3>
              <p>Available: {metrics.freeMemory > 1024 ? (metrics.freeMemory/1024).toFixed(2) + ' GB' : metrics.freeMemory.toFixed(0) + ' MB'}</p>
              <p>Total: {metrics.totalMemory > 1024 ? (metrics.totalMemory/1024).toFixed(2) + ' GB' : metrics.totalMemory.toFixed(0) + ' MB'}</p>
            </div>
          </div>
        </>
      )}
      
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default Metrics;
