import React from 'react';
import WikiImage from './WikiImage';
import { Match } from '../types';

interface UpcomingCardProps {
    match: Match;
    matches?: Match[]; // For series view - array of all matches in the series
    onClick: (match: Match) => void;
    // Series button (bilaterals)
    showSeriesButton?: boolean;
    onViewSeries?: (seriesId: string, matches?: Match[]) => void;
    // Tournament button
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

// Unified 'Gamer/Esports' style card for upcoming matches
const UpcomingCard: React.FC<UpcomingCardProps> = React.memo(({
    match,
    matches,
    onClick,
    showSeriesButton,
    onViewSeries,
    showTournamentButton,
    onViewTournament
}) => {
    const startDate = new Date(match.start_date);

    const dateStr = startDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    const time = startDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });

    const teams = match.participants || [];
    const seriesName = shortenSeriesName(match.series_name);
    const matchFormat = normalizeFormat(match.event_format);

    const handleAction = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (showSeriesButton && onViewSeries) {
            onViewSeries(match.series_id, matches);
        } else if (showTournamentButton && onViewTournament) {
            onViewTournament(match.series_id);
        }
    };

    const hasAction = (showSeriesButton && onViewSeries) || (showTournamentButton && onViewTournament);

    return (
        <div
            className="upcoming-card"
            onClick={() => onClick(match)}
        >
            {/* Background Watermark (Home Team Logo) */}
            {teams[0] && (
                <div className="upcoming-bg-logo">
                    <WikiImage
                        name={teams[0].name}
                        id={teams[0].id}
                        type="team"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                </div>
            )}

            {/* Header: Date Pill + Format Badge */}
            <div className="upcoming-card-header">
                <div className="upcoming-date-pill">
                    {dateStr}
                </div>
                {matchFormat && (
                    <div className="upcoming-format-badge">
                        {matchFormat}
                    </div>
                )}
            </div>

            {/* Content: PRO Battle Arena */}
            <div className="upcoming-content">
                {/* Team A */}
                <div className="upcoming-team-col">
                    <div className="upcoming-team-logo-wrapper">
                        {teams[0] ? (
                            <WikiImage
                                name={teams[0].name}
                                id={teams[0].id}
                                type="team"
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                        ) : (
                            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                        )}
                    </div>
                    <span className="upcoming-team-name">
                        {teams[0]?.name || 'TBC'}
                    </span>
                </div>

                {/* VS Badge */}
                <div className="upcoming-vs-badge">VS</div>

                {/* Team B */}
                <div className="upcoming-team-col">
                    <div className="upcoming-team-logo-wrapper">
                        {teams[1] ? (
                            <WikiImage
                                name={teams[1].name}
                                id={teams[1].id}
                                type="team"
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                        ) : (
                            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                        )}
                    </div>
                    <span className="upcoming-team-name">
                        {teams[1]?.name || 'TBC'}
                    </span>
                </div>
            </div>

            {/* Footer: Series | Time/Action */}
            <div className="upcoming-card-footer">
                <span className="upcoming-series-name">
                    {seriesName}
                </span>

                {hasAction ? (
                    <button className="upcoming-action-btn" onClick={handleAction}>
                        {showSeriesButton ? 'View Series' : 'View Hub'}
                    </button>
                ) : (
                    <span className="upcoming-time">
                        {time}
                    </span>
                )}
            </div>
        </div>
    );
});

UpcomingCard.displayName = 'UpcomingCard';

export default UpcomingCard;
