import React, { useState } from 'react';
import axios from 'axios';

const Scanning = () => {
  const [target, setTarget] = useState('');
  const [scanType, setScanType] = useState('network');
  const [results, setResults] = useState('');
  const [loading, setLoading] = useState(false);

  const handleScan = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:8080/scan', {
        params: {
          target,
          scan_type: scanType,
        },
      });
      setResults(response.data);
    } catch (error) {
      setResults(error.response.data);
    }
    setLoading(false);
  };

  return (
    <div>
      <h1>Scanning</h1>
      <div>
        <input
          type="text"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="Enter target IP or hostname"
        />
        <select value={scanType} onChange={(e) => setScanType(e.target.value)}>
          <option value="network">Network Scan</option>
          <option value="vulnerability">Vulnerability Scan</option>
        </select>
        <button onClick={handleScan} disabled={loading}>
          {loading ? 'Scanning...' : 'Scan'}
        </button>
      </div>
      <pre>{results}</pre>
    </div>
  );
};

export default Scanning;
