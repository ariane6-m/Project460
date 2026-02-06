import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Chart from './components/Chart';
import Navbar from './components/Navbar';
import Scanning from './components/Scanning';
import IDS from './components/IDS';
import './App.css';

const Dashboard = () => {
  return (
    <div>
      <h2>Dashboard Content</h2>
      <p>This is a placeholder for your dashboard content.</p>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>Moto-Moto</h1>
          <Navbar />
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/scanning" element={<Scanning />} />
            <Route path="/ids" element={<IDS />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
