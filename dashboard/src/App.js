import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch metrics every 5 seconds for real-time updates
    const fetchMetrics = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/metrics`);
        setMetrics(response.data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="App">
      {loading && <p>Loading metrics...</p>}
      {error && <p style={{color: 'red'}}>Error: {error}</p>}
      <pre>{JSON.stringify(metrics, null, 2)}</pre>
    </div>
  );
}

export default App;
