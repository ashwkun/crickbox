import React from 'react';
import WikiImage from './WikiImage';

// Tour Card - Groups multiple matches from the same series
const TourCard = ({ tour, matches, onClick }) => {
    // Get the primary match (live or most recent)
    const primaryMatch = matches.find(m => m.event_state === 'L') || matches[0];
    const teams = primaryMatch?.participants || [];

    // Count matches by state
    const liveCount = matches.filter(m => m.event_state === 'L').length;
    const upcomingCount = matches.filter(m => m.event_state === 'U').length;
    const resultCount = matches.filter(m => m.event_state !== 'L' && m.event_state !== 'U').length;

    // Get unique dates
    const matchDates = matches
        .map(m => new Date(m.start_date))
        .sort((a, b) => a - b);

    const formatDateRange = () => {
        if (matchDates.length === 0) return '';
        if (matchDates.length === 1) {
            return matchDates[0].toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
        }
        const first = matchDates[0];
        const last = matchDates[matchDates.length - 1];
        return `${first.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} - ${last.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`;
    };

    return (
        <div className="hero-card" onClick={() => onClick(primaryMatch)}>
            {/* Tour Header */}
            <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#737373', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                    TOUR
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
                    {tour}
                </div>
            </div>

            {/* Teams */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                {teams.slice(0, 2).map((team, idx) => (
                    <React.Fragment key={idx}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <WikiImage
                                name={team.name}
                                id={team.id}
                                type="team"
                                style={{ maxHeight: 40, width: 'auto', height: 'auto', borderRadius: 10, background: '#1f1f1f', padding: 4 }}
                            />
                            <span style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>{team.short_name}</span>
                        </div>
                        {idx === 0 && <span style={{ color: '#737373', fontSize: 14 }}>vs</span>}
                    </React.Fragment>
                ))}
            </div>

            {/* Match Stats */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                {liveCount > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: 'rgba(34, 197, 94, 0.15)', borderRadius: 12, fontSize: 12, fontWeight: 600, color: '#22c55e' }}>
                        <span className="live-dot"></span>
                        {liveCount} Live
                    </div>
                )}
                {upcomingCount > 0 && (
                    <div style={{ padding: '4px 10px', background: '#1f1f1f', borderRadius: 12, fontSize: 12, fontWeight: 500, color: '#a3a3a3' }}>
                        {upcomingCount} Upcoming
                    </div>
                )}
                {resultCount > 0 && (
                    <div style={{ padding: '4px 10px', background: '#1f1f1f', borderRadius: 12, fontSize: 12, fontWeight: 500, color: '#a3a3a3' }}>
                        {resultCount} Results
                    </div>
                )}
            </div>

            {/* Date Range */}
            <div style={{ fontSize: 13, color: '#737373' }}>
                {formatDateRange()}
            </div>
        </div>
    );
};

export default TourCard;
