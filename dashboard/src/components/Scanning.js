import React, { useState } from 'react';
import apiClient from '../api';
import DeviceFilter from './DeviceFilter';
import DeviceList from './DeviceList';

const Scanning = () => {
  const [target, setTarget] = useState('');
  const [scanType, setScanType] = useState('network');
  const [rawResults, setRawResults] = useState(null);
  const [devices, setDevices] = useState([]);
  const [filteredDevices, setFilteredDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Parse various scan result formats into structured device data
  const parseResults = (data) => {
    try {
      let parsedData = data;
      if (typeof data === 'string') {
        try {
          parsedData = JSON.parse(data);
        } catch {
          // If not JSON, try to parse as plain text results
          return parseTextResults(data);
        }
      }

      if (Array.isArray(parsedData)) {
        return parsedData.map(normalizeDevice);
      } else if (parsedData.devices && Array.isArray(parsedData.devices)) {
        return parsedData.devices.map(normalizeDevice);
      } else if (typeof parsedData === 'object') {
        return [normalizeDevice(parsedData)];
      }
    } catch (err) {
      console.error('Error parsing results:', err);
      return [];
    }
    return [];
  };

  const parseTextResults = (text) => {
    // Parse simple text format like "192.168.1.1 - Router - VENDOR"
    const lines = text.split('\n').filter((line) => line.trim());
    return lines
      .map((line) => {
        const parts = line.split('-').map((p) => p.trim());
        if (parts.length >= 1) {
          return {
            ip: parts[0] || '',
            hostname: parts[1] || 'Unknown',
            vendor: parts[2] || 'Unknown',
            type: parts[3] || 'Device',
          };
        }
        return null;
      })
      .filter(Boolean);
  };

  const normalizeDevice = (device) => {
    return {
      ip: device.ip || device.ipAddress || device.address || '',
      hostname: device.hostname || device.name || 'Unknown',
      vendor: device.vendor || device.manufacturer || 'Unknown',
      mac: device.mac || device.macAddress || '',
      type: device.type || device.deviceType || 'Device',
      status: device.status || 'Unknown',
      openPorts: device.openPorts || device.ports || [],
    };
  };

  const handleScan = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.get('/scan', {
        params: {
          target,
          scan_type: scanType,
        },
      });
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
        <div className="scan-input-group">
          <label htmlFor="target-input">Target IP or Hostname</label>
          <input
            id="target-input"
            type="text"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleScan()}
            placeholder="e.g., 192.168.1.0/24 or example.com"
          />
        </div>

        <div className="scan-input-group">
          <label htmlFor="scan-type-select">Scan Type</label>
          <select
            id="scan-type-select"
            value={scanType}
            onChange={(e) => setScanType(e.target.value)}
          >
            <option value="network">Network Scan</option>
            <option value="vulnerability">Vulnerability Scan</option>
          </select>
        </div>

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
