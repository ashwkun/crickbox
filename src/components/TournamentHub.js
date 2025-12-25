import React from 'react';

// Shorten series name for display
const shortenSeriesName = (name) => {
    if (!name) return '';
    const bilateralMatch = name.match(/(\d+)\s*(T20I?|ODI|Test|Youth ODI|Youth T20I)/i);
    if (bilateralMatch) {
        return `${bilateralMatch[1]} ${bilateralMatch[2].toUpperCase()}`;
    }
    return name
        .replace(/,?\s*\d{4}(\/\d{2,4})?/g, '')
        .replace(/\s+Series$/i, '')
        .trim();
};

// Tournament Hub - Shows all matches in a tournament
const TournamentHub = ({ tournamentName, matches, onBack, onMatchClick }) => {
    // Sort matches by date
    const sortedMatches = [...matches].sort((a, b) =>
        new Date(a.start_date) - new Date(b.start_date)
    );

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const formatTime = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    const getMatchStatus = (match) => {
        if (match.event_state === 'U') {
            const isNext = sortedMatches.find(m => m.event_state === 'U')?.game_id === match.game_id;
            return isNext ? 'next' : 'upcoming';
        }
        if (match.event_state === 'L') return 'live';
        return 'completed';
    };

    const getResultText = (match) => {
        if (match.event_state === 'U') return formatTime(match.start_date);
        if (match.event_state === 'L') return 'LIVE';
        return match.short_event_status || 'Completed';
    };

    // Get unique teams count
    const uniqueTeams = new Set();
    matches.forEach(m => {
        m.participants?.forEach(p => uniqueTeams.add(p.short_name));
    });

    return (
        <div className="tournament-hub">
            {/* Header */}
            <div className="tournament-hub-header">
                <button className="back-button" onClick={onBack}>
                    ← Back
                </button>
            </div>

            {/* Tournament Info */}
            <div className="tournament-hub-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
                    <WikiImage
                        name={tournamentName}
                        id={tournamentName?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}
                        type="tournament"
                        style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'contain' }}
                    />
                    <div>
                        <h1 className="tournament-hub-title">{shortenSeriesName(tournamentName)}</h1>
                        <div className="tournament-hub-meta">{uniqueTeams.size} teams · {matches.length} matches</div>
                    </div>
                </div>
            </div>

            {/* Matches List */}
            <div className="tournament-hub-matches">
                <div className="section-header" style={{ padding: '0 0 16px 0' }}>
                    <h3 className="section-title">Fixtures</h3>
                    <div className="section-line"></div>
                </div>

                {sortedMatches.map((match, idx) => {
                    const status = getMatchStatus(match);
                    const teams = match.participants || [];
                    return (
                        <div
                            key={match.game_id || idx}
                            className={`tournament-match-row ${status}`}
                            onClick={() => onMatchClick(match)}
                        >
                            <div className="tournament-match-date">
                                <span className="tournament-date">{formatDate(match.start_date)}</span>
                            </div>
                            <div className="tournament-match-teams">
                                <span className="tournament-team">{teams[0]?.short_name || '?'}</span>
                                <span className="tournament-vs">vs</span>
                                <span className="tournament-team">{teams[1]?.short_name || '?'}</span>
                            </div>
                            <div className={`tournament-match-result ${status}`}>
                                {status === 'live' && <span className="live-dot"></span>}
                                {getResultText(match)}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TournamentHub;
