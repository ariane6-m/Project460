import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Settings = ({ darkMode = false, onDarkModeChange = () => {} }) => {
  const [settings, setSettings] = useState({
    scanInterval: 60,
    scanTypes: ['network'],
    autoStartScanning: false,
    alertThreshold: 50,
    retentionDays: 30,
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch current settings from API or localStorage
    const savedSettings = localStorage.getItem('scanningSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prevSettings) => ({
      ...prevSettings,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setSaved(false);
  };

  const handleScanTypeChange = (scanType) => {
    setSettings((prevSettings) => {
      const types = prevSettings.scanTypes.includes(scanType)
        ? prevSettings.scanTypes.filter((t) => t !== scanType)
        : [...prevSettings.scanTypes, scanType];
      return { ...prevSettings, scanTypes: types };
    });
    setSaved(false);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Save to localStorage for now
      localStorage.setItem('scanningSettings', JSON.stringify(settings));
      // TODO: Send to API when backend endpoint is available
      // await axios.post('http://localhost:8080/settings', settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
    setLoading(false);
  };

  return (
    <div className="settings-container">
      <h1>Scanning Preferences</h1>
      <div className="settings-content">
        <div className="settings-section">
          <h2>Scan Configuration</h2>

          <div className="settings-group">
            <label htmlFor="scanInterval">Scan Interval (seconds)</label>
            <input
              id="scanInterval"
              type="number"
              name="scanInterval"
              value={settings.scanInterval}
              onChange={handleInputChange}
              min="10"
              max="3600"
            />
          </div>

          <div className="settings-group">
            <label>Scan Types</label>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="scanTypes"
                  checked={settings.scanTypes.includes('network')}
                  onChange={() => handleScanTypeChange('network')}
                />
                Network Scan
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="scanTypes"
                  checked={settings.scanTypes.includes('vulnerability')}
                  onChange={() => handleScanTypeChange('vulnerability')}
                />
                Vulnerability Scan
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="scanTypes"
                  checked={settings.scanTypes.includes('malware')}
                  onChange={() => handleScanTypeChange('malware')}
                />
                Malware Detection
              </label>
            </div>
          </div>

          <div className="settings-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="autoStartScanning"
                checked={settings.autoStartScanning}
                onChange={handleInputChange}
              />
              Auto-start scanning on application launch
            </label>
          </div>
        </div>

        <div className="settings-section">
          <h2>Alert Settings</h2>

          <div className="settings-group">
            <label htmlFor="alertThreshold">Alert Threshold (%)</label>
            <input
              id="alertThreshold"
              type="number"
              name="alertThreshold"
              value={settings.alertThreshold}
              onChange={handleInputChange}
              min="0"
              max="100"
            />
          </div>
        </div>

        <div className="settings-section">
          <h2>Data Management</h2>

          <div className="settings-group">
            <label htmlFor="retentionDays">Scan History Retention (days)</label>
            <input
              id="retentionDays"
              type="number"
              name="retentionDays"
              value={settings.retentionDays}
              onChange={handleInputChange}
              min="1"
              max="365"
            />
          </div>
        </div>

          <div className="settings-section">
            <h2>Display Preferences</h2>

            <div className="settings-group">
              <label className="checkbox-label dark-mode-toggle">
                <input
                  type="checkbox"
                  name="darkMode"
                  checked={darkMode}
                  onChange={onDarkModeChange}
                />
                <span className="toggle-label">Dark Mode</span>
              </label>
              <p className="setting-description">Toggle dark theme for reduced eye strain in low-light environments</p>
            </div>
          </div>

        <div className="settings-actions">
          <button
            className="save-button"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
          {saved && <span className="success-message">Settings saved successfully!</span>}
        </div>
      </div>
    </div>
  );
};

export default Settings;
