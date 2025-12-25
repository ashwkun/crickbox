import React from 'react';
import WikiImage from './WikiImage';

// Normalize format to only ODI, TEST, or T20
const normalizeFormat = (format) => {
    if (!format) return '';
    const f = format.toUpperCase();
    if (f.includes('TEST')) return 'TEST';
    if (f.includes('ODI') || f.includes('OD') || f.includes('LIST')) return 'ODI';
    return 'T20';
};

// Shorten series name - extract just format count or tournament name
const shortenSeriesName = (name) => {
    if (!name) return '';

    // Pattern: "[Country] in [Country], X [Format] Series, [Year]" → "X [Format]"
    const bilateralMatch = name.match(/(\d+)\s*(T20I?|ODI|Test|Youth ODI|Youth T20I)/i);
    if (bilateralMatch) {
        return `${bilateralMatch[1]} ${bilateralMatch[2].toUpperCase()}`;
    }

    // Named tournaments - just remove year
    return name
        .replace(/,?\s*\d{4}(\/\d{2,4})?/g, '') // Remove years
        .replace(/\s+Series$/i, '')              // Remove "Series"
        .trim();
};

// Card for bilateral series with "View Series" button
const SeriesUpcomingCard = ({ matches, onClick, onViewSeries }) => {
    const primaryMatch = matches[0];
    const hasMultiple = matches.length > 1;

    const startDate = new Date(primaryMatch.start_date);
    const month = startDate.toLocaleDateString(undefined, { month: 'short' }).toUpperCase();
    const day = startDate.getDate();
    const weekday = startDate.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase();
    const time = startDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });

    const teams = primaryMatch.participants || [];
    const seriesName = shortenSeriesName(primaryMatch.series_name);
    const matchFormat = normalizeFormat(primaryMatch.event_format);

    return (
        <div className="expandable-card">
            {/* Main Card - Click opens match */}
            <div
                className={`upcoming-card ${hasMultiple ? 'has-series' : ''}`}
                onClick={() => onClick(primaryMatch)}
            >
                {/* Calendar Date Block */}
                <div className="upcoming-date-block">
                    <div className="upcoming-month">{month}</div>
                    <div className="upcoming-day">{day}</div>
                    <div className="upcoming-weekday">{weekday}</div>
                </div>

                {/* Match Info */}
                <div className="upcoming-info">
                    {/* Teams - Logo on top, name below */}
                    <div className="upcoming-teams-row">
                        {teams.slice(0, 2).map((team, idx) => (
                            <React.Fragment key={idx}>
                                <div className="upcoming-team-block">
                                    <WikiImage
                                        name={team.name}
                                        id={team.id}
                                        type="team"
                                        style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'contain', background: '#1a1a1a', padding: 4 }}
                                    />
                                    <span className="upcoming-team-name">{team.name}</span>
                                </div>
                                {idx === 0 && <span className="upcoming-vs">vs</span>}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Series Name */}
                    {seriesName && (
                        <div className="upcoming-series">{seriesName}</div>
                    )}

                    {/* Divider */}
                    <div className="upcoming-divider"></div>

                    {/* Footer */}
                    <div className="upcoming-footer">
                        <span className="upcoming-time">{time}</span>
                        {matchFormat && <span className="upcoming-format">{matchFormat}</span>}
                    </div>
                </div>
            </div>

            {/* View Series Button - Only for bilateral with multiple matches */}
            {hasMultiple && (
                <button
                    className="view-series-button"
                    onClick={(e) => { e.stopPropagation(); onViewSeries(primaryMatch.series_id, matches); }}
                >
                    View Series →
                </button>
            )}
        </div>
    );
};

export default SeriesUpcomingCard;
