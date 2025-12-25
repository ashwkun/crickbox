import React from 'react';
import Scoreboard from './components/Scoreboard';
import InstallPrompt from './components/InstallPrompt';

export default function App() {
    return (
        <div className="app-container">
            {/* Header */}
            <header className="app-header">
                <div className="logo">
                    <span className="logo-brand">BOX</span>
                    <span className="logo-cric">.CRIC</span>
                </div>
            </header>

            {/* Main Content */}
            <main className="main-content">
                <Scoreboard />
            </main>

            {/* Footer */}
            <footer className="app-footer">
                box.cric © {new Date().getFullYear()}
            </footer>

            {/* PWA Install Prompt */}
            <InstallPrompt />
        </div>
    );
}
