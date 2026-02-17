import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import './DeviceHistory.css';
import apiClient from '../api';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeSeriesScale,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeSeriesScale
);

const DeviceHistory = () => {
    const [historyData, setHistoryData] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState('');
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDevices();
    }, []);

    useEffect(() => {
        if (selectedDevice) {
            fetchDeviceHistory(selectedDevice);
        }
    }, [selectedDevice]);

    const fetchDevices = async () => {
        try {
            const response = await apiClient.get('/devices'); // Assuming your API serves device data
            if (!response.data) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = response.data;
            setDevices(data);
            if (data.length > 0) {
                setSelectedDevice(data[0].ip); // Select the first device by default
            }
        } catch (error) {
            console.error("Error fetching devices:", error);
            setError("Failed to load devices.");
        }
    };

    const fetchDeviceHistory = async (deviceId) => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.get(`/devices/${deviceId}/history`);
            if (!response.data) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = response.data;
            setHistoryData(data);
        } catch (error) {
            console.error("Error fetching device history:", error);
            setError("Failed to load device history.");
        } finally {
            setLoading(false);
        }
    };

    const chartData = {
        labels: historyData.map(item => new Date(item.timestamp)),
        datasets: [
            {
                label: 'Temperature',
                data: historyData.map(item => item.temperature),
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                yAxisID: 'y',
            },
            {
                label: 'Humidity',
                data: historyData.map(item => item.humidity),
                borderColor: 'rgb(153, 102, 255)',
                backgroundColor: 'rgba(153, 102, 255, 0.5)',
                yAxisID: 'y1',
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: `Device History for ${selectedDevice}`,
            },
        },
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'hour',
                    tooltipFormat: 'MMM d, h:mm a',
                },
                title: {
                    display: true,
                    text: 'Time',
                },
            },
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                    display: true,
                    text: 'Temperature (°C)',
                },
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                grid: {
                    drawOnChartArea: false,
                },
                title: {
                    display: true,
                    text: 'Humidity (%)',
                },
            },
        },
    };

    return (
        <div className="device-history-container">
            <h2>Device History</h2>

            <div className="device-selector">
                <label htmlFor="device-select">Select Device:</label>
                <select
                    id="device-select"
                    value={selectedDevice}
                    onChange={(e) => setSelectedDevice(e.target.value)}
                    disabled={devices.length === 0}
                >
                    {devices.length === 0 ? (
                        <option value="">No devices available</option>
                    ) : (
                        devices.map(device => (
                            <option key={device.ip} value={device.ip}>
                                {device.hostname || device.ip}
                            </option>
                        ))
                    )}
                </select>
            </div>

            {devices.length === 0 && !loading && <p>Please run a scan to see device history.</p>}

            {loading && devices.length > 0 && <p>Loading history...</p>}
            {error && <p className="error-message">{error}</p>}

            {!loading && !error && historyData.length === 0 && (
                <p>No history data available for this device.</p>
            )}

            {!loading && !error && historyData.length > 0 && (
                <div className="chart-wrapper">
                    <Line data={chartData} options={chartOptions} />
                </div>
            )}
        </div>
    );
};

export default DeviceHistory;
