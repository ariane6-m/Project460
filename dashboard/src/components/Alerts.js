import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import './Alerts.css'; // Assuming we'll create a CSS file for alerts

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await apiClient.get('/alerts');
        setAlerts(response.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts(); // Initial fetch
    const interval = setInterval(fetchAlerts, 5000); // Fetch every 5 seconds
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  const getSeverityClass = (severity) => {
    switch (severity) {
      case 'Critical': return 'severity-critical';
      case 'High': return 'severity-high';
      case 'Medium': return 'severity-medium';
      case 'Low': return 'severity-low';
      default: return '';
    }
  };

  if (loading) return <p>Loading alerts...</p>;
  if (error) return <p>Error loading alerts: {error.message}</p>;

  return (
    <div className="alerts-container">
      <h2>Alerts Panel</h2>
      {alerts.length === 0 ? (
        <p>No active alerts.</p>
      ) : (
        <div className="alerts-list">
          {alerts.map(alert => (
            <div key={alert.id} className={`alert-item ${getSeverityClass(alert.severity)}`}>
              <div className="alert-header">
                <span className="alert-severity">{alert.severity}</span>
                <span className="alert-time">{new Date(alert.time).toLocaleString()}</span>
              </div>
              <p className="alert-message">{alert.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Alerts;
