import React from 'react';
import WikiImage from './WikiImage';
import { Match } from '../types';
import { getTeamColor } from '../utils/teamColors';
import { isTBCMatch, getKnockoutLabel, hasUndeterminedTeams } from '../utils/tbcMatch';


interface UpcomingCardProps {
    match: Match;
    matches?: Match[]; // For series view - array of all matches in the series
    onClick: (match: Match) => void;
    showSeriesButton?: boolean;
    onViewSeries?: (seriesId: string, matches?: Match[]) => void;
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
    const bilateralMatch = name.match(/(\d+)\s*(T20I?|ODI|Test|Youth ODI|Youth T20I)/i);
    if (bilateralMatch) {
        return `${bilateralMatch[1]} ${bilateralMatch[2].toUpperCase()}`;
    }
    return name
        .replace(/,?\s*\d{4}(\/\d{2,4})?/g, '')
        .replace(/\s+Series$/i, '')
        .trim();
};

const UpcomingCard: React.FC<UpcomingCardProps> = React.memo(({
    match,
    matches,
    onClick,
    showSeriesButton,
    onViewSeries,
    showTournamentButton,
    onViewTournament
}) => {
    if (!match) return null;

    const startDate = new Date(match.start_date);
    const dateStr = startDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    const time = startDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });

    const teams = match.participants || [];
    const team1 = teams[0];
    const team2 = teams[1];

    const team1Name = (team1 && typeof team1.name === 'string') ? team1.name : 'TBC';
    const team2Name = (team2 && typeof team2.name === 'string') ? team2.name : 'TBC';
    const team1Id = (team1 && (typeof team1.id === 'string' || typeof team1.id === 'number')) ? String(team1.id) : undefined;
    const team2Id = (team2 && (typeof team2.id === 'string' || typeof team2.id === 'number')) ? String(team2.id) : undefined;

    // TBC Detection
    const isTBC = isTBCMatch(match);
    const bothTeamsUndetermined = hasUndeterminedTeams(match) && team1Id === '0' && team2Id === '0';
    const knockoutLabel = getKnockoutLabel(match);

    const badgeText = isTBC && knockoutLabel
        ? knockoutLabel
        : (match.event_name || normalizeFormat(match.event_format));
    const seriesName = shortenSeriesName(match.series_name);

    // Colors
    const knockoutGold = '#D4AF37';
    const knockoutGoldLight = '#F5D76E';
    const color1 = getTeamColor(team1Name !== 'TBC' && team1Name !== 'T.B.C.' ? team1Name : undefined);
    const color2 = getTeamColor(team2Name !== 'TBC' && team2Name !== 'T.B.C.' ? team2Name : undefined);

    let background = '#0f0f13';
    let borderColor = 'rgba(255, 255, 255, 0.08)';

    if (bothTeamsUndetermined) {
        // Subtle dark card with gold hints
        background = '#0f0f13';
        borderColor = `${knockoutGold}40`;
    } else if (color1 && color2) {
        background = `radial-gradient(circle at top left, ${color1}40, transparent 55%), radial-gradient(circle at bottom right, ${color2}40, transparent 55%), #0f0f13`;
    } else if (color1) {
        background = `radial-gradient(circle at top left, ${color1}33, #0f0f13 70%)`;
    }

    const handleAction = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (showSeriesButton && onViewSeries) {
            onViewSeries(match.series_id, matches);
        } else if (showTournamentButton && onViewTournament) {
            onViewTournament(match.series_id);
        }
    };

    const hasAction = (showSeriesButton && onViewSeries) || (showTournamentButton && onViewTournament);

    let actionText = 'View Series';
    if (showSeriesButton && matches && matches.length > 1) {
        actionText = `View ${matches.length - 1} More`;
    } else if (showTournamentButton) {
        actionText = 'View Tournament';
    }



    // ========== REGULAR CARD (or partial TBC) ==========
    return (
        <div
            className={`upcoming-card ${isTBC ? 'upcoming-card--knockout' : ''}`}
            onClick={() => onClick(match)}
            style={{ background, borderColor }}
        >
            {/* Background Watermarks */}
            {team1Name !== 'TBC' && team1Name !== 'T.B.C.' && (
                <div className="upcoming-bg-logo home">
                    <WikiImage name={team1Name} id={team1Id} type="team" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
            )}
            {team2Name !== 'TBC' && team2Name !== 'T.B.C.' && (
                <div className="upcoming-bg-logo away">
                    <WikiImage name={team2Name} id={team2Id} type="team" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
            )}

            {/* Header */}
            <div className="upcoming-card-header">
                <div className="upcoming-date-pill">{dateStr} • {time}</div>
                {badgeText && !bothTeamsUndetermined && (
                    <div className="upcoming-format-badge" style={isTBC ? {
                        background: `linear-gradient(135deg, ${knockoutGold}, ${knockoutGoldLight})`,
                        color: '#000',
                        fontWeight: 700,
                    } : undefined}>
                        {badgeText}
                    </div>
                )}
            </div>

            {/* Teams or TBC Context */}
            <div className="upcoming-content" style={{ justifyContent: bothTeamsUndetermined ? 'center' : 'space-between' }}>
                {bothTeamsUndetermined ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 0' }}>
                        <h3 style={{
                            margin: 0,
                            fontSize: 18,
                            fontWeight: 800,
                            color: knockoutGold, // Use gold for the context text
                            letterSpacing: 1,
                            textTransform: 'uppercase'
                        }}>
                            {badgeText || 'MATCH ' + match.id}
                        </h3>
                        <span style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: 'rgba(255,255,255,0.4)',
                            textTransform: 'uppercase',
                            letterSpacing: 2
                        }}>
                            TEAMS TO BE DECIDED
                        </span>
                    </div>
                ) : (
                    <>
                        <div className="upcoming-team-col">
                            <div className="upcoming-team-logo-wrapper">
                                <WikiImage name={team1Name} id={team1Id} type="team" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            </div>
                            <span className="upcoming-team-name">{team1Id === '0' ? 'TBD' : team1Name}</span>
                        </div>
                        <div className="upcoming-vs-badge">VS</div>
                        <div className="upcoming-team-col">
                            <div className="upcoming-team-logo-wrapper">
                                <WikiImage name={team2Name} id={team2Id} type="team" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            </div>
                            <span className="upcoming-team-name">{team2Id === '0' ? 'TBD' : team2Name}</span>
                        </div>
                    </>
                )}
            </div>

            {/* Footer */}
            <div className="upcoming-card-footer">
                <span className="upcoming-series-name">{seriesName}</span>
                {hasAction && (
                    <button className="upcoming-action-btn" onClick={handleAction}>
                        {actionText} <span style={{ opacity: 0.6 }}>›</span>
                    </button>
                )}
            </div>
        </div>
    );
});

UpcomingCard.displayName = 'UpcomingCard';

export default UpcomingCard;
