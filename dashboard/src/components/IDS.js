import React, { useState, useEffect } from 'react';
import apiClient from '../api';

const IDS = () => {
  const [running, setRunning] = useState(false);
  const [alerts, setAlerts] = useState([]);

  const startIDS = async () => {
    try {
      await apiClient.get('/ids/start');
      setRunning(true);
    } catch (error) {
      console.error(error);
    }
  };

  const stopIDS = async () => {
    try {
      await apiClient.get('/ids/stop');
      setRunning(false);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    let interval;
    if (running) {
      interval = setInterval(async () => {
        try {
          const response = await apiClient.get('/ids/alerts');
          setAlerts(response.data);
        } catch (error) {
          console.error(error);
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [running]);

  return (
    <div>
      <h1>IDS</h1>
      <div>
        <button onClick={startIDS} disabled={running}>
          Start IDS
        </button>
        <button onClick={stopIDS} disabled={!running}>
          Stop IDS
        </button>
      </div>
      <pre>{JSON.stringify(alerts, null, 2)}</pre>
    </div>
  );
};

export default IDS;
