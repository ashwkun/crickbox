import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        const swUrl = '/sw.js';
        navigator.serviceWorker.register(swUrl)
            .then((reg) => console.log('Service Worker registered'))
            .catch((err) => console.log('SW registration failed:', err));
    });
}
