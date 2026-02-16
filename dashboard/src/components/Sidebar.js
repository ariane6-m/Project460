import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        {isOpen && <h2>Menu</h2>}
      </div>
      <nav>
        <ul>
          <li><NavLink to="/" end>Dashboard</NavLink></li>
          <li>
            <h3>Monitoring</h3>
            <ul>
              <li><NavLink to="/metrics">System Metrics</NavLink></li>
              <li><NavLink to="/graphs">Live Activity Graphs</NavLink></li>
            </ul>
          </li>
          <li>
            <h3>Devices</h3>
            <ul>
              <li><NavLink to="/devices">Device List</NavLink></li>
              <li><NavLink to="/device-history">Device History</NavLink></li>
            </ul>
          </li>
          <li>
            <h3>Security</h3>
            <ul>
              <li><NavLink to="/alerts">Alerts Panel</NavLink></li>
              <li><NavLink to="/timeline">Event Timeline</NavLink></li>
            </ul>
          </li>
          <li>
            <h3>Tools</h3>
            <ul>
              <li><NavLink to="/scanning">Network Scanning</NavLink></li>
              <li><NavLink to="/ids">Intrusion Detection</NavLink></li>
            </ul>
          </li>
          <li><NavLink to="/settings">Settings</NavLink></li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;