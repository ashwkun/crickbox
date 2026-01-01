import React from 'react';
import WikiImage from './WikiImage';
import { Match } from '../types';
import { getTeamColor } from '../utils/teamColors';
import { isTBCMatch, getKnockoutLabel, hasUndeterminedTeams } from '../utils/tbcMatch';
import { GiTrophy } from 'react-icons/gi';
import { LuSparkles } from 'react-icons/lu';

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
        // Premium gold gradient for fully TBC matches
        background = `
            radial-gradient(ellipse at 50% 0%, ${knockoutGold}30, transparent 50%),
            radial-gradient(ellipse at 50% 100%, ${knockoutGold}15, transparent 40%),
            linear-gradient(180deg, #1a1a20 0%, #0f0f13 100%)
        `;
        borderColor = `${knockoutGold}60`;
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

    // ========== TBC ARTWORK CARD ==========
    if (bothTeamsUndetermined) {
        return (
            <div
                className="upcoming-card upcoming-card--knockout"
                onClick={() => onClick(match)}
                style={{ background, borderColor, position: 'relative', overflow: 'hidden' }}
            >
                {/* Shimmer Animation Overlay */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '200%',
                    height: '100%',
                    background: `linear-gradient(90deg, transparent 0%, ${knockoutGold}10 45%, ${knockoutGold}25 50%, ${knockoutGold}10 55%, transparent 100%)`,
                    animation: 'shimmer 3s infinite',
                    pointerEvents: 'none',
                }} />
                <style>{`
                    @keyframes shimmer {
                        0% { transform: translateX(-50%); }
                        100% { transform: translateX(50%); }
                    }
                    @keyframes trophyGlow {
                        0%, 100% { filter: drop-shadow(0 0 8px ${knockoutGold}60); }
                        50% { filter: drop-shadow(0 0 20px ${knockoutGold}90); }
                    }
                `}</style>

                {/* Header */}
                <div className="upcoming-card-header">
                    <div className="upcoming-date-pill">{dateStr} • {time}</div>
                    <div style={{
                        background: `linear-gradient(135deg, ${knockoutGold}, ${knockoutGoldLight})`,
                        color: '#000',
                        fontWeight: 800,
                        fontSize: 10,
                        padding: '4px 10px',
                        borderRadius: 12,
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        boxShadow: `0 2px 12px ${knockoutGold}50`,
                    }}>
                        <LuSparkles size={10} />
                        {badgeText}
                    </div>
                </div>

                {/* Trophy Hero Section */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px 0',
                    position: 'relative',
                }}>
                    {/* Trophy Icon */}
                    <GiTrophy
                        size={64}
                        style={{
                            color: knockoutGold,
                        }}
                    />

                    {/* Teams TBD */}
                    <span style={{
                        marginTop: 12,
                        fontSize: 11,
                        color: 'rgba(255,255,255,0.5)',
                        letterSpacing: '0.5px',
                    }}>
                        Teams to be decided
                    </span>
                </div>

                {/* Footer */}
                <div className="upcoming-card-footer">
                    <span className="upcoming-series-name" style={{
                        color: knockoutGoldLight,
                        fontWeight: 600,
                    }}>
                        {seriesName}
                    </span>
                    {hasAction && (
                        <button className="upcoming-action-btn" onClick={handleAction} style={{
                            borderColor: `${knockoutGold}40`,
                            color: knockoutGold,
                        }}>
                            {actionText} <span style={{ opacity: 0.6 }}>›</span>
                        </button>
                    )}
                </div>
            </div>
        );
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
                {badgeText && (
                    <div className="upcoming-format-badge" style={isTBC ? {
                        background: `linear-gradient(135deg, ${knockoutGold}, ${knockoutGoldLight})`,
                        color: '#000',
                        fontWeight: 700,
                    } : undefined}>
                        {badgeText}
                    </div>
                )}
            </div>

            {/* Teams */}
            <div className="upcoming-content">
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
