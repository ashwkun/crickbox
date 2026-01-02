import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './firebase'; // Initialize Firebase
import './index.css';

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}

// Register Service Worker for PWA
// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        // --- CACHE NUKE LOGIC ---
        const CURRENT_VERSION = '3.2'; // Start fresh
        const CACHE_NAME = `boxcric-v${CURRENT_VERSION}`;
        const storedVersion = localStorage.getItem('sw_version');

        if (storedVersion !== CURRENT_VERSION) {
            // New version detected, nuking cache

            // 1. Unregister all SWs
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (let registration of registrations) {
                await registration.unregister();
            }

            // 2. Clear all Caches
            const cacheNames = await caches.keys();
            for (let name of cacheNames) {
                await caches.delete(name);
            }

            // 3. Update Version & Reload
            localStorage.setItem('sw_version', CURRENT_VERSION);
            // Cache cleared, reloading
            window.location.reload();
            return;
        }
        // ------------------------

        const swUrl = '/sw.js';
        navigator.serviceWorker.register(swUrl)
            .then((reg) => {
                // SW registered
                // Force update check
                reg.update();
            })
            .catch(() => { /* SW registration failed */ });
    });
}
