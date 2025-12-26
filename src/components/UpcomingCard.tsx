import React from 'react';
import WikiImage from './WikiImage';
import { Match } from '../types';

interface UpcomingCardProps {
    match: Match;
    onClick: (match: Match) => void;
    showTournamentButton?: boolean;
    onViewTournament?: (seriesId: string) => void;
}

// Normalize format to only ODI, TEST, or T20
const normalizeFormat = (format: string | undefined): string => {
    if (!format) return '';
    const f = format.toUpperCase();
    if (f.includes('TEST')) return 'TEST';
    if (f.includes('ODI') || f.includes('OD') || f.includes('ONE DAY') || f.includes('LIST A')) return 'ODI';
    if (f.includes('T20') || f.includes('T20I') || f.includes('TWENTY20')) return 'T20';
    if (f.includes('FIRST CLASS') || f.includes('FC')) return 'TEST';
    return 'T20';
};

// Shorten series name - extract just format count or tournament name
const shortenSeriesName = (name: string | undefined): string => {
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

// Calendar-style card for upcoming matches (with optional tournament button)
const UpcomingCard: React.FC<UpcomingCardProps> = React.memo(({ match, onClick, showTournamentButton, onViewTournament }) => {
    const startDate = new Date(match.start_date);

    const month = startDate.toLocaleDateString(undefined, { month: 'short' }).toUpperCase();
    const day = startDate.getDate();
    const weekday = startDate.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase();
    const time = startDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });

    const teams = match.participants || [];
    const seriesName = shortenSeriesName(match.series_name);
    const matchFormat = normalizeFormat(match.event_format);

    return (
        <div className={`expandable-card ${showTournamentButton ? '' : ''}`}>
            <div
                className={`upcoming-card ${showTournamentButton ? 'has-tournament' : ''}`}
                onClick={() => onClick(match)}
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

                    {/* Series Name - Above divider */}
                    {seriesName && (
                        <div className="upcoming-series">{seriesName}</div>
                    )}

                    {/* Divider */}
                    <div className="upcoming-divider"></div>

                    {/* Footer: Time + Format only */}
                    <div className="upcoming-footer">
                        <span className="upcoming-time">{time}</span>
                        {matchFormat && <span className="upcoming-format">{matchFormat}</span>}
                    </div>
                </div>
            </div>

            {/* View Tournament Button */}
            {showTournamentButton && onViewTournament && (
                <button
                    className="view-tournament-button"
                    onClick={(e) => { e.stopPropagation(); onViewTournament(match.series_id); }}
                >
                    View Tournament →
                </button>
            )}
        </div>
    );
});

UpcomingCard.displayName = 'UpcomingCard';

export default UpcomingCard;
