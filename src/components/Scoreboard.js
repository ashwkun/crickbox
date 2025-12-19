import React, { useEffect, useState, useRef } from 'react';

// Direct ESPN API call - has CORS headers
const SCORES_API = "https://site.api.espn.com/apis/v2/scoreboard/header?sport=cricket";
const REFRESH_INTERVAL = 30000;

// Priority Matrix Implementation
const getPriority = (event, league) => {
    const competitors = event.competitors || [];
    const teamNames = competitors.map(t => (t.abbreviation || t.name || '').toUpperCase()).join(' ');
    const leagueName = (league?.name || '').toUpperCase();

    // Check categories
    const hasIndia = teamNames.includes('IND') || teamNames.includes('INDIA');
    const isWomens = teamNames.includes('-W') || leagueName.includes('WOMEN');
    const isNational = competitors.some(t => t.isNational) ||
        ['TEST', 'ODI', 'T20I'].some(k => (event.class?.generalClassCard || '').toUpperCase().includes(k));

    const isLive = event.status === 'in';
    const isStumps = isLive && /stumps|break|rain|delay|tea|lunch|drinks/i.test(event.summary || '');
    const isEnded = event.status === 'post';
    const isUpcoming = event.status === 'pre';

    // Women's matches get heavily deprioritized
    if (isWomens) return 100;

    // Priority matrix
    if (hasIndia && isLive && !isStumps) return 1;  // India LIVE
    if (hasIndia && isStumps) return 2;              // India Stumps
    if (isNational && isLive && !isStumps) return 3; // National LIVE
    if (isNational && isStumps) return 4;            // National Stumps
    if (isLive && !isStumps) return 5;               // Franchise LIVE
    if (isStumps) return 6;                          // Franchise Stumps
    if (hasIndia && isUpcoming) return 7;            // India Upcoming
    if (isNational && isUpcoming) return 8;          // National Upcoming
    if (isUpcoming) return 9;                        // Franchise Upcoming
    if (isEnded) return 10;                          // All Ended
    return 50;
};

export default function Scoreboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [error, setError] = useState(null);
    const scrollRef = useRef(null);

    const fetchScores = () => {
        fetch(SCORES_API)
            .then(res => res.ok ? res.json() : Promise.reject("Network Error"))
            .then(json => {
                setData(json);
                setLastUpdated(new Date());
                setLoading(false);
                setError(null);
            })
            .catch(err => {
                setError(err.message || err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchScores();
        const interval = setInterval(fetchScores, REFRESH_INTERVAL);
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div style={styles.loading}>Loading...</div>;
    if (error) return <div style={styles.error}>{error}</div>;

    const leagues = data?.sports?.[0]?.leagues || [];

    // Flatten all events with their league info and sort by priority
    const allEvents = leagues.flatMap(league =>
        (league.events || []).map(event => ({ ...event, league }))
    ).sort((a, b) => getPriority(a, a.league) - getPriority(b, b.league));

    if (allEvents.length === 0) return <div style={styles.loading}>No matches</div>;

    return (
        <div>
            {/* Swipable Cards Container */}
            <div ref={scrollRef} style={styles.cardsContainer}>
                {allEvents.map(event => {
                    const isLive = event.status === 'in';
                    const isStumps = isLive && /stumps|break|rain|delay|tea|lunch/i.test(event.summary || '');
                    const priority = getPriority(event, event.league);

                    return (
                        <div key={event.id} style={{
                            ...styles.card,
                            borderLeft: isLive && !isStumps ? '4px solid #ef4444' :
                                isStumps ? '4px solid #f59e0b' : '4px solid #e5e7eb'
                        }}>
                            {/* League Badge */}
                            <div style={styles.leagueBadge}>{event.league?.shortName || event.league?.name}</div>

                            {/* Status */}
                            <div style={{
                                ...styles.status,
                                backgroundColor: isLive && !isStumps ? '#ef4444' : isStumps ? '#f59e0b' : '#6b7280'
                            }}>
                                {isLive ? (isStumps ? 'STUMPS' : 'LIVE') : event.status === 'post' ? 'ENDED' : 'UPCOMING'}
                            </div>

                            {/* Match Title */}
                            <div style={styles.matchTitle}>{event.shortName}</div>
                            <div style={styles.matchInfo}>{event.title}</div>

                            {/* Teams */}
                            {event.competitors?.map((team, idx) => (
                                <div key={idx} style={styles.team}>
                                    <div style={styles.teamName}>
                                        {team.logo && <img src={team.logo} alt="" style={styles.logo} />}
                                        <span>{team.abbreviation || team.name}</span>
                                    </div>
                                    <span style={styles.score}>{team.score || '-'}</span>
                                </div>
                            ))}

                            {/* Summary */}
                            {event.summary && <div style={styles.summary}>{event.summary}</div>}
                        </div>
                    );
                })}
            </div>
            <div style={styles.footer}>
                {allEvents.length} matches • Updated: {lastUpdated?.toLocaleTimeString()}
            </div>
        </div>
    );
}

const styles = {
    loading: { padding: '16px', color: '#666' },
    error: { padding: '16px', color: '#ef4444', backgroundColor: '#fef2f2', borderRadius: '8px' },
    cardsContainer: {
        display: 'flex',
        overflowX: 'auto',
        gap: '12px',
        padding: '8px 4px',
        scrollSnapType: 'x mandatory',
        WebkitOverflowScrolling: 'touch'
    },
    card: {
        minWidth: '280px',
        maxWidth: '280px',
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        scrollSnapAlign: 'start',
        flexShrink: 0
    },
    leagueBadge: { fontSize: '10px', color: '#666', fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase' },
    status: { display: 'inline-block', fontSize: '9px', fontWeight: '700', color: 'white', padding: '2px 6px', borderRadius: '4px', marginBottom: '8px' },
    matchTitle: { fontWeight: '700', fontSize: '16px', color: '#111', marginBottom: '2px' },
    matchInfo: { fontSize: '11px', color: '#888', marginBottom: '10px' },
    team: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f3f4f6' },
    teamName: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500', color: '#333' },
    logo: { width: '24px', height: '24px', objectFit: 'contain' },
    score: { fontFamily: 'monospace', fontWeight: '700', fontSize: '13px', color: '#2563eb' },
    summary: { marginTop: '10px', fontSize: '11px', color: '#555', backgroundColor: '#f9fafb', padding: '8px', borderRadius: '6px' },
    footer: { textAlign: 'center', fontSize: '11px', color: '#999', padding: '12px' }
};
