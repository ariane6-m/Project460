import React, { useState } from 'react';
import apiClient from '../api';
import DeviceFilter from './DeviceFilter';
import DeviceList from './DeviceList';

const Scanning = () => {
  const [target, setTarget] = useState('192.168.1.0/24');
  const [scanType, setScanType] = useState('network');
  const [rawResults, setRawResults] = useState(null);
  const [devices, setDevices] = useState([]);
  const [filteredDevices, setFilteredDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Parse various scan result formats into structured device data
  const parseResults = (data) => {
    return data;
  };

  const normalizeDevice = (device) => {
    return device;
  };

  const handleScan = async () => {
    setLoading(true);
    setError('');
    try {
      // The new endpoint requires a target
      const response = await apiClient.post('/scan', { target });
      setRawResults(response.data);
      const parsedDevices = parseResults(response.data);
      setDevices(parsedDevices);
      setFilteredDevices(parsedDevices);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Scan failed. Please check your target and try again.'
      );
      setDevices([]);
      setFilteredDevices([]);
    }
    setLoading(false);
  };

  const handleFilterChange = (filtered) => {
    setFilteredDevices(filtered);
  };

  return (
    <div className="scanning-container">
      <h1>Network Scanning</h1>

      <div className="scan-input-section">
        <p>Enter the target network to scan (e.g., 192.168.1.0/24).</p>
        <input
          type="text"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="e.g., 192.168.1.0/24"
        />
        <button className="scan-button" onClick={handleScan} disabled={loading}>
          {loading ? 'Scanning...' : 'Start Scan'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {devices.length > 0 && (
        <>
          <DeviceFilter devices={devices} onFilterChange={handleFilterChange} />
          <DeviceList devices={filteredDevices} loading={loading} />
        </>
      )}

      {!loading && devices.length === 0 && !error && (
        <div className="scan-placeholder">
          <p>No scan results yet. Enter a target and start scanning.</p>
        </div>
      )}
    </div>
  );
};

export default Scanning;
