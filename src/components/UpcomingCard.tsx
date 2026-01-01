import React from 'react';
import WikiImage from './WikiImage';
import { Match } from '../types';
import { getTeamColor } from '../utils/teamColors';
import { isTBCMatch, getKnockoutLabel } from '../utils/tbcMatch';
import { LuTrophy } from 'react-icons/lu';

interface UpcomingCardProps {
    match: Match;
    matches?: Match[]; // For series view - array of all matches in the series
    onClick: (match: Match) => void;
    //...
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
    // Safety check: if match is missing/malformed, don't render
    if (!match) return null;

    const startDate = new Date(match.start_date);

    const dateStr = startDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    const time = startDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });

    const teams = match.participants || [];

    // Defensive checks for data integrity
    const team1 = teams[0];
    const team2 = teams[1];

    const team1Name = (team1 && typeof team1.name === 'string') ? team1.name : 'TBC';
    const team2Name = (team2 && typeof team2.name === 'string') ? team2.name : 'TBC';
    const team1Id = (team1 && (typeof team1.id === 'string' || typeof team1.id === 'number')) ? String(team1.id) : undefined;
    const team2Id = (team2 && (typeof team2.id === 'string' || typeof team2.id === 'number')) ? String(team2.id) : undefined;

    // Check if this is a TBC/knockout match
    const isTBC = isTBCMatch(match);
    const knockoutLabel = getKnockoutLabel(match);

    // Badge Text: For TBC matches, show knockout label; else event name or format
    const badgeText = isTBC && knockoutLabel
        ? knockoutLabel
        : (match.event_name || normalizeFormat(match.event_format));
    const seriesName = shortenSeriesName(match.series_name);

    // Dynamic Team Colors for Dual Glow
    const color1 = getTeamColor(team1Name !== 'TBC' && team1Name !== 'T.B.C.' ? team1Name : undefined);
    const color2 = getTeamColor(team2Name !== 'TBC' && team2Name !== 'T.B.C.' ? team2Name : undefined);

    // Special gold accent for knockout matches
    const knockoutGold = '#D4AF37';
    const knockoutGoldLight = '#F5D76E';

    let background = '#0f0f13';
    let borderColor = 'rgba(255, 255, 255, 0.08)';

    if (isTBC) {
        // Gold gradient background for knockout matches
        background = `radial-gradient(circle at top center, ${knockoutGold}25, transparent 60%), #0f0f13`;
        borderColor = `${knockoutGold}50`;
    } else if (color1 && color2) {
        background = `radial-gradient(circle at top left, ${color1}40, transparent 55%), radial-gradient(circle at bottom right, ${color2}40, transparent 55%), #0f0f13`;
    } else if (color1) {
        background = `radial-gradient(circle at top left, ${color1}33, #0f0f13 70%)`;
    }

    const cardStyle = {
        background,
        borderColor
    };

    const handleAction = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (showSeriesButton && onViewSeries) {
            onViewSeries(match.series_id, matches);
        } else if (showTournamentButton && onViewTournament) {
            onViewTournament(match.series_id);
        }
    };

    const hasAction = (showSeriesButton && onViewSeries) || (showTournamentButton && onViewTournament);

    // Button Text Logic
    let actionText = 'View Series';
    if (showSeriesButton) {
        if (matches && matches.length > 1) {
            const moreCount = matches.length - 1;
            actionText = `View ${moreCount} More`;
        } else {
            actionText = 'View Series';
        }
    } else if (showTournamentButton) {
        actionText = 'View Tournament';
    }

    // Check if team names are placeholder (TBC, T.B.C., A1, B2, etc.)
    const isTeam1Placeholder = team1Id === '0' || team1Id === undefined || /^[A-D][0-9]$/.test(team1Name);
    const isTeam2Placeholder = team2Id === '0' || team2Id === undefined || /^[A-D][0-9]$/.test(team2Name);

    return (
        <div
            className={`upcoming-card ${isTBC ? 'upcoming-card--knockout' : ''}`}
            onClick={() => onClick(match)}
            style={cardStyle}
        >
            {/* Background Watermarks - For TBC show series logo, else team logos */}
            {isTBC ? (
                <div className="upcoming-bg-logo center" style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 120,
                    height: 120,
                    opacity: 0.08,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <LuTrophy size={80} color={knockoutGold} />
                </div>
            ) : (
                <>
                    {team1Name !== 'TBC' && (
                        <div className="upcoming-bg-logo home">
                            <WikiImage
                                name={team1Name}
                                id={team1Id}
                                type="team"
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                        </div>
                    )}
                    {team2Name !== 'TBC' && (
                        <div className="upcoming-bg-logo away">
                            <WikiImage
                                name={team2Name}
                                id={team2Id}
                                type="team"
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                        </div>
                    )}
                </>
            )}

            {/* Header: Date + Time Pill + Format Badge */}
            <div className="upcoming-card-header">
                <div className="upcoming-date-pill">
                    {dateStr} • {time}
                </div>
                {badgeText && (
                    <div
                        className="upcoming-format-badge"
                        style={isTBC ? {
                            background: `linear-gradient(135deg, ${knockoutGold}, ${knockoutGoldLight})`,
                            color: '#000',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        } : undefined}
                    >
                        {isTBC && <LuTrophy size={10} style={{ marginRight: 4 }} />}
                        {badgeText}
                    </div>
                )}
            </div>

            {/* Content: PRO Battle Arena */}
            <div className="upcoming-content">
                {/* Team A */}
                <div className="upcoming-team-col">
                    <div className="upcoming-team-logo-wrapper">
                        <WikiImage
                            name={team1Name}
                            id={team1Id}
                            type="team"
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                    </div>
                    <span className="upcoming-team-name" style={isTeam1Placeholder ? {
                        color: knockoutGold,
                        fontStyle: 'italic'
                    } : undefined}>
                        {isTeam1Placeholder ? 'TBC' : team1Name}
                    </span>
                </div>

                {/* VS Badge */}
                <div className="upcoming-vs-badge" style={isTBC ? {
                    background: `linear-gradient(135deg, ${knockoutGold}40, ${knockoutGoldLight}20)`,
                    borderColor: `${knockoutGold}60`
                } : undefined}>VS</div>

                {/* Team B */}
                <div className="upcoming-team-col">
                    <div className="upcoming-team-logo-wrapper">
                        <WikiImage
                            name={team2Name}
                            id={team2Id}
                            type="team"
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                    </div>
                    <span className="upcoming-team-name" style={isTeam2Placeholder ? {
                        color: knockoutGold,
                        fontStyle: 'italic'
                    } : undefined}>
                        {isTeam2Placeholder ? 'TBC' : team2Name}
                    </span>
                </div>
            </div>

            {/* Footer: Series | Action */}
            <div className="upcoming-card-footer">
                <span className="upcoming-series-name">
                    {seriesName}
                </span>

                {hasAction && (
                    <button className="upcoming-action-btn" onClick={handleAction}>
                        {actionText} <span style={{ opacity: 0.6, fontSize: '1.2em', lineHeight: 0.5 }}>›</span>
                    </button>
                )}
            </div>
        </div>
    );
});

UpcomingCard.displayName = 'UpcomingCard';

export default UpcomingCard;
