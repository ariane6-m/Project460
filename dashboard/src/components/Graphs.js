import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import apiClient from '../api';
import 'chart.js/auto';
import './Graphs.css';

const Graphs = () => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: 'CPU Usage',
        data: [],
        borderColor: 'rgba(75,192,192,1)',
        fill: false,
      },
    ],
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiClient.get('/metrics/json');
        const { cpuUsage, timestamp } = response.data;
        const time = new Date(timestamp).toLocaleTimeString();

        setChartData((prevData) => {
          const newLabels = [...prevData.labels, time].slice(-20); // Keep last 20 data points
          const newCpuData = [...prevData.datasets[0].data, cpuUsage * 100].slice(-20);

          return {
            labels: newLabels,
            datasets: [
              { ...prevData.datasets[0], data: newCpuData },
            ],
          };
        });
      } catch (err) {
        setError('Failed to fetch live activity data.');
        console.error(err);
      }
    };

    const intervalId = setInterval(fetchData, 5000); // Refresh every 5 seconds

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="graphs-container">
      <h2>Live CPU Usage</h2>
      {error && <p className="error">{error}</p>}
      <div className="chart-wrapper">
        <Line data={chartData} />
      </div>
    </div>
  );
};

export default Graphs;
