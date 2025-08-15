// src/index.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import 'mapbox-gl/dist/mapbox-gl.css';
import App from './App'; // Import the main App component
import './index.css'; // Main CSS file

// Keyframes moved to index.css

// Render the main App component which now handles hole selection
const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
     {/* No longer injecting keyframes via <style> */}
     <App />
   </React.StrictMode>
 );

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// CRA entry no longer used by Next.js runtime; kept temporarily during migration
