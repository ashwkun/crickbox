import React from 'react';
import WikiImage from './WikiImage';

// Parse winner from event_status text
const parseWinner = (status, participants) => {
    if (!status) return null;
    const statusLower = status.toLowerCase();

    for (const p of participants || []) {
        const name = p.name?.toLowerCase() || '';
        const shortName = p.short_name?.toLowerCase() || '';
        if (statusLower.includes(name + ' won') || statusLower.includes(shortName + ' won')) {
            return p.short_name;
        }
    }

    if (statusLower.includes('draw') || statusLower.includes('drawn')) {
        return 'DRAW';
    }

    return null;
};

// Calculate series standings
const calculateStandings = (matches) => {
    const wins = {};
    let draws = 0;

    matches.forEach(m => {
        if (m.event_state === 'U') return;

        const winner = parseWinner(m.event_status, m.participants);
        if (winner === 'DRAW') {
            draws++;
        } else if (winner) {
            wins[winner] = (wins[winner] || 0) + 1;
        }
    });

    return { wins, draws };
};

// Normalize format
const normalizeFormat = (format) => {
    if (!format) return '';
    const f = format.toUpperCase();
    if (f.includes('TEST')) return 'TEST';
    if (f.includes('ODI') || f.includes('OD') || f.includes('LIST')) return 'ODI';
    return 'T20';
};

const SeriesHub = ({ seriesName, matches, onBack, onMatchClick }) => {
    const teams = matches[0]?.participants || [];
    const tourName = matches[0]?.tour_name || '';

    // Sort matches by date
    const sortedMatches = [...matches].sort((a, b) =>
        new Date(a.start_date) - new Date(b.start_date)
    );

    // Calculate standings
    const { wins, draws } = calculateStandings(matches);

    // Format standings
    const formatStandings = () => {
        if (teams.length < 2) return '';
        const [t1, t2] = teams.map(t => t.short_name);
        const w1 = wins[t1] || 0;
        const w2 = wins[t2] || 0;

        if (w1 === 0 && w2 === 0 && draws === 0) return 'Series begins';

        let text = `${w1} - ${w2}`;
        if (draws > 0) text += ` (${draws} draw${draws > 1 ? 's' : ''})`;
        return text;
    };

    const getMatchStatus = (match) => {
        if (match.event_state === 'U') {
            const now = new Date();
            const start = new Date(match.start_date);
            const isNext = sortedMatches.find(m => m.event_state === 'U')?.game_id === match.game_id;
            if (isNext) return 'next';
            return 'upcoming';
        }
        if (match.event_state === 'L') return 'live';
        return 'completed';
    };

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    const getResultText = (match) => {
        if (match.event_state === 'U') {
            const d = new Date(match.start_date);
            return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
        }
        if (match.event_state === 'L') return 'LIVE';

        const winner = parseWinner(match.event_status, match.participants);
        if (winner === 'DRAW') return 'Draw';
        if (winner) return `${winner} won`;
        return match.short_event_status || '';
    };

    return (
        <div className="series-hub">
            {/* Header */}
            <div className="series-hub-header">
                <button className="back-button" onClick={onBack}>
                    ← Back
                </button>
            </div>

            {/* Series Info */}
            <div className="series-hub-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                    <WikiImage
                        name={seriesName}
                        id={seriesName?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}
                        type="series"
                        style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover' }}
                    />
                    <div>
                        <h1 className="series-hub-title" style={{ marginBottom: 4 }}>{seriesName}</h1>
                        {tourName && <div className="series-hub-tour">{tourName}</div>}
                    </div>
                </div>
            </div>

            {/* Teams & Standings */}
            <div className="series-hub-standings">
                <div className="standings-teams">
                    {teams.slice(0, 2).map((team, idx) => (
                        <React.Fragment key={idx}>
                            <div className="standings-team">
                                <WikiImage
                                    name={team.name}
                                    type="team"
                                    style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'contain', background: '#1a1a1a', padding: 4 }}
                                />
                                <span className="standings-team-name">{team.short_name}</span>
                            </div>
                            {idx === 0 && (
                                <div className="standings-score">{formatStandings()}</div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Matches List */}
            <div className="series-hub-matches">
                <div className="section-header" style={{ padding: '0 0 16px 0' }}>
                    <h3 className="section-title">Matches</h3>
                    <div className="section-line"></div>
                </div>

                {sortedMatches.map((match, idx) => {
                    const status = getMatchStatus(match);
                    return (
                        <div
                            key={match.game_id || idx}
                            className={`series-match-row ${status}`}
                            onClick={() => onMatchClick(match)}
                        >
                            <div className="series-match-status-icon">
                                {status === 'completed' && '✓'}
                                {status === 'live' && '●'}
                                {status === 'next' && '→'}
                                {status === 'upcoming' && '○'}
                            </div>
                            <div className="series-match-date">{formatDate(match.start_date)}</div>
                            <div className="series-match-name">{match.event_name || 'Match'}</div>
                            <div className="series-match-venue">{match.venue_name?.split(',')[0] || ''}</div>
                            <div className={`series-match-result ${status}`}>{getResultText(match)}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SeriesHub;
