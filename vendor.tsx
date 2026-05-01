import React from 'react';
import ReactDOM from 'react-dom/client';
import VendorPortal from './pages/VendorPortal';
import './index.css';

const rootElement = document.getElementById('vendor-root');
if (!rootElement) {
  throw new Error("Could not find vendor-root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <VendorPortal />
  </React.StrictMode>
);