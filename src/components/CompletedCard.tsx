import React from 'react';
import WikiImage from './WikiImage';
import { Match } from '../types';
import { getTeamColor } from '../utils/teamColors';

interface CompletedCardProps {
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

const CompletedCard: React.FC<CompletedCardProps> = React.memo(({
    match,
    matches,
    onClick,
    showSeriesButton,
    onViewSeries,
    showTournamentButton,
    onViewTournament
}) => {
    if (!match) return null;

    // Date formatting
    const matchDate = new Date(match.start_date);
    const dateStr = matchDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

    // Teams
    const teams = match.participants || [];
    const team1 = teams[0];
    const team2 = teams[1];

    const team1Name = (team1 && typeof team1.name === 'string') ? team1.name : 'TBC';
    const team2Name = (team2 && typeof team2.name === 'string') ? team2.name : 'TBC';
    const team1Id = (team1 && (typeof team1.id === 'string' || typeof team1.id === 'number')) ? String(team1.id) : undefined;
    const team2Id = (team2 && (typeof team2.id === 'string' || typeof team2.id === 'number')) ? String(team2.id) : undefined;

    // Winner logic
    const isDraw = match.result_code === 'D';
    const winnerId = match.participants?.find(p => p.highlight === 'true')?.id;
    const isT1Winner = !isDraw && team1?.id === winnerId;
    const isT2Winner = !isDraw && team2?.id === winnerId;

    // Match info
    const badgeText = match.event_name || normalizeFormat(match.event_format);
    const seriesName = shortenSeriesName(match.series_name);
    const resultText = match.short_event_status || match.event_sub_status ||
        (match.winning_margin ? `Won by ${match.winning_margin}` : '');

    // Colors
    const color1 = getTeamColor(team1Name !== 'TBC' ? team1Name : undefined);
    const color2 = getTeamColor(team2Name !== 'TBC' ? team2Name : undefined);

    let background = '#0f0f13';
    const borderColor = isDraw ? 'rgba(245, 158, 11, 0.3)' : 'rgba(255, 255, 255, 0.08)';

    if (color1 && color2) {
        background = `radial-gradient(circle at top left, ${color1}40, transparent 55%), radial-gradient(circle at bottom right, ${color2}40, transparent 55%), #0f0f13`;
    } else if (color1) {
        background = `radial-gradient(circle at top left, ${color1}33, #0f0f13 70%)`;
    }

    // Score renderer with Test match multi-innings support
    const renderScore = (score: string | undefined, isWinner: boolean) => {
        if (!score) return <span style={{ color: 'rgba(255,255,255,0.3)' }}>-</span>;
        const cleanScore = score.replace(/\s*\([^)]*\)/g, '');

        if (cleanScore.includes('&')) {
            const parts = cleanScore.split('&').map(s => s.trim());
            return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.2 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: isWinner ? '#fff' : 'rgba(255,255,255,0.5)' }}>
                        {parts[1] || parts[0]}
                    </span>
                    {parts[1] && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{parts[0]}</span>}
                </div>
            );
        }
        return (
            <span style={{ fontSize: 13, fontWeight: 700, color: isWinner ? '#fff' : 'rgba(255,255,255,0.5)' }}>
                {cleanScore}
            </span>
        );
    };

    // Action handlers
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

    return (
        <div
            className="completed-card"
            onClick={() => onClick(match)}
            style={{ background, borderColor }}
        >
            {/* Background Watermarks */}
            <div className="completed-bg-logo home">
                <WikiImage name={team1Name} id={team1Id} type="team" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div className="completed-bg-logo away">
                <WikiImage name={team2Name} id={team2Id} type="team" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>

            {/* Header */}
            <div className="completed-card-header">
                <div className="completed-date-pill">{dateStr}</div>
                {badgeText && <div className="completed-format-badge">{badgeText}</div>}
            </div>

            {/* Content: Team Rows */}
            <div className="completed-content">
                {/* Team 1 Row */}
                <div className="completed-team-row">
                    <div className="completed-team-info">
                        <div className="completed-team-logo-wrapper">
                            <WikiImage name={team1Name} id={team1Id} type="team" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                        <span className={`completed-team-name ${isT1Winner ? 'winner' : ''}`}>{team1Name}</span>
                    </div>
                    <div className="completed-score">{renderScore(team1?.value, isT1Winner)}</div>
                </div>

                {/* Team 2 Row */}
                <div className="completed-team-row">
                    <div className="completed-team-info">
                        <div className="completed-team-logo-wrapper">
                            <WikiImage name={team2Name} id={team2Id} type="team" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                        <span className={`completed-team-name ${isT2Winner ? 'winner' : ''}`}>{team2Name}</span>
                    </div>
                    <div className="completed-score">{renderScore(team2?.value, isT2Winner)}</div>
                </div>

                {/* Result Text inside content */}
                {resultText && (
                    <div className={`completed-result-text ${isDraw ? 'draw' : ''}`}>
                        {resultText}
                    </div>
                )}
            </div>

            {/* Footer: Series Name and Action */}
            <div className="completed-card-footer">
                <span className="upcoming-series-name" style={{ flex: 1 }}>{seriesName}</span>
                {hasAction && (
                    <button className="completed-action-btn" onClick={handleAction}>
                        {actionText} <span style={{ opacity: 0.6 }}>›</span>
                    </button>
                )}
            </div>
        </div>
    );
});

CompletedCard.displayName = 'CompletedCard';

export default CompletedCard;
