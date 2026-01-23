import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './App.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function App() {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });

  const fetchData = async () => {
    try {
      // Note: This URL assumes you are running the dashboard and accessing it from your browser.
      // Docker's internal networking is used for server-to-server communication.
      // The browser accesses Prometheus via the port mapped on the host machine (localhost:9090).
      const response = await axios.get('http://localhost:9090/api/v1/query', {
        params: {
          query: 'rate(http_requests_total[1m])',
        },
      });

      const results = response.data.data.result;
      
      const newLabels = [];
      const newDatasets = results.map(result => {
        const { method, route } = result.metric;
        const values = result.values.map(v => ({ x: new Date(v[0] * 1000).toLocaleTimeString(), y: parseFloat(v[1]) }));
        
        // Collect labels from the first dataset
        if (newLabels.length === 0) {
            values.forEach(v => newLabels.push(v.x));
        }

        return {
          label: `${method} ${route}`,
          data: values.map(v => v.y),
          borderColor: `#${Math.floor(Math.random()*16777215).toString(16)}`,
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
        };
      });

      setChartData({
        labels: newLabels,
        datasets: newDatasets,
      });

    } catch (error) {
      console.error("Error fetching data from Prometheus", error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Prometheus Network Traffic Monitor</h1>
        <div className="chart-container">
          <Line 
            data={chartData}
            options={{
              plugins: {
                title: {
                  display: true,
                  text: 'HTTP Requests Rate (per second) over the last minute'
                },
                legend: {
                  display: true,
                  position: 'top'
                }
              },
              scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Requests / Second'
                    },
                    beginAtZero: true
                }
              }
            }}
          />
        </div>
      </header>
    </div>
  );
}

export default App;
