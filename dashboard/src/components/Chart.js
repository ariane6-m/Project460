import React from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Chart = ({ type, data, title }) => {
  const ChartComponent = type === 'Bar' ? Bar : Line;

  return (
    <div className="chart-container">
      <ChartComponent
        data={data}
        options={{
          plugins: {
            title: {
              display: true,
              text: title,
            },
            legend: {
              display: true,
              position: 'top',
            },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: type === 'Bar' ? 'Endpoint' : 'Time',
              },
            },
            y: {
              title: {
                display: true,
                text: type === 'Bar' ? 'Total Requests' : 'Requests / Second',
              },
              beginAtZero: true,
            },
          },
        }}
      />
    </div>
  );
};

export default Chart;
