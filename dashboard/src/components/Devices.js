import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import DeviceList from './DeviceList';

const Devices = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDevices = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await apiClient.get('/devices');
        setDevices(response.data);
      } catch (err) {
        setError('Failed to fetch devices.');
      }
      setLoading(false);
    };

    fetchDevices();
  }, []);

  return (
    <div className="devices-container">
      <h1>Devices</h1>
      {error && <div className="error-message">{error}</div>}
      <DeviceList devices={devices} loading={loading} />
    </div>
  );
};

export default Devices;
