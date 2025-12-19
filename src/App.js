import React from 'react';
import NewsFeed from './components/NewsFeed';
import Scoreboard from './components/Scoreboard';

export default function App() {
    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1 style={styles.title}>🏏 Cricket Live</h1>
                <p style={styles.subtitle}>Scores & News</p>
            </header>

            {/* Scoreboard - Full width swipable cards */}
            <section style={styles.section}>
                <h2 style={styles.sectionTitle}>Live Scores</h2>
                <Scoreboard />
            </section>

            {/* News Feed */}
            <section style={styles.section}>
                <h2 style={styles.sectionTitle}>Latest News</h2>
                <NewsFeed />
            </section>
        </div>
    );
}

const styles = {
    container: {
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        paddingBottom: '20px'
    },
    header: {
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%)',
        color: 'white',
        padding: '16px',
        textAlign: 'center'
    },
    title: { margin: 0, fontSize: '24px', fontWeight: '700' },
    subtitle: { margin: '4px 0 0', fontSize: '13px', opacity: 0.8 },
    section: { padding: '12px' },
    sectionTitle: { fontSize: '16px', fontWeight: '600', color: '#333', margin: '0 0 12px 4px' }
};
