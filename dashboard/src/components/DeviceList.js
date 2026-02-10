import React from 'react';

const DeviceList = ({ devices, loading }) => {
  if (loading) {
    return <div className="device-list-loading">Loading devices...</div>;
  }

  if (!devices || devices.length === 0) {
    return (
      <div className="device-list-empty">
        No devices found. Try adjusting your filters or run a scan.
      </div>
    );
  }

  return (
    <div className="device-list">
      <div className="device-list-header">
        <div className="list-count">
          Found {devices.length} device{devices.length !== 1 ? 's' : ''}
        </div>
      </div>
      <div className="device-items">
        {devices.map((device, index) => (
          <div key={index} className="device-item">
            <div className="device-header">
              <span className="device-ip">{device.ip}</span>
              <span className="device-type-badge">{device.type}</span>
            </div>
            <div className="device-details">
              <div className="detail-row">
                <span className="detail-label">Hostname:</span>
                <span className="detail-value">{device.hostname || 'Unknown'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Vendor:</span>
                <span className="detail-value">{device.vendor || 'Unknown'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">MAC Address:</span>
                <span className="detail-value">{device.mac || 'Unknown'}</span>
              </div>
              {device.status && (
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span className={`detail-value status-${device.status.toLowerCase()}`}>
                    {device.status}
                  </span>
                </div>
              )}
              {device.openPorts && device.openPorts.length > 0 && (
                <div className="detail-row">
                  <span className="detail-label">Open Ports:</span>
                  <span className="detail-value ports-list">
                    {device.openPorts.join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DeviceList;
