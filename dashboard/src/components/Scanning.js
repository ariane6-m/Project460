import React, { useState } from 'react';
import apiClient from '../api';
import DeviceFilter from './DeviceFilter';
import DeviceList from './DeviceList';

const Scanning = () => {
  const [target, setTarget] = useState('192.168.1.0/24');
  const [scanMode, setScanMode] = useState('cloud'); // 'cloud' or 'agent'
  const [rawResults, setRawResults] = useState(null);
  const [devices, setDevices] = useState([]);
  const [filteredDevices, setFilteredDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [scanPerformed, setScanPerformed] = useState(false);

  // ... parseResults and normalizeDevice remain same

  const handleScan = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    setScanPerformed(false);
    
    try {
      if (scanMode === 'cloud') {
        const response = await apiClient.post('/scan', { target });
        setRawResults(response.data);
        const parsedDevices = parseResults(response.data);
        setDevices(parsedDevices);
        setFilteredDevices(parsedDevices);
        setScanPerformed(true);
      } else {
        // Agent scan is asynchronous
        await apiClient.post('/agent/scan', { target });
        setSuccess('Scan request sent to your local agent. Results will appear in the Device List and Alerts panel once complete.');
      }
    } catch (err) {
      // ... error handling
    }
    setLoading(false);
  };

  return (
    <div className="scanning-container">
      <h1>Network Scanning</h1>

      <div className="scan-input-section">
        <div className="scan-mode-toggle">
          <button 
            className={scanMode === 'cloud' ? 'active' : ''} 
            onClick={() => setScanMode('cloud')}
          >
            Cloud Scan (GCP)
          </button>
          <button 
            className={scanMode === 'agent' ? 'active' : ''} 
            onClick={() => setScanMode('agent')}
          >
            Local Agent Scan
          </button>
        </div>

        <p>
          {scanMode === 'cloud' 
            ? 'Enter the target network to scan from the GCP server.' 
            : 'Enter your local network range (e.g., 192.168.1.0/24).'}
        </p>
        
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
      {success && <div className="success-message" style={{color: '#4caf50', marginBottom: '15px'}}>{success}</div>}
      
      {/* ... rest of the component */}

      {!loading && scanPerformed && devices.length === 0 && !error && (
        <div className="no-results-message">
          <p>No devices found for target: {target}. Try a different network range or check if devices are online.</p>
        </div>
      )}

      {!loading && !scanPerformed && devices.length === 0 && !error && (
        <div className="scan-placeholder">
          <p>No scan results yet. Enter a target and start scanning.</p>
        </div>
      )}
    </div>
  );
};

export default Scanning;
