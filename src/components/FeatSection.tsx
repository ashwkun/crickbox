import React from 'react';
import { Match } from '../types';
import WikiImage from './WikiImage';
import { getTeamColor } from '../utils/teamColors';

interface FeatSectionProps {
    matches: Match[];
    onMatchClick: (match: Match) => void;
}

// Helper to shorten series name
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

// Format time for upcoming matches
const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return `${diffMins}m`;
    }
    if (diffHours < 24) {
        return `${diffHours}h`;
    }
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

// Card component for featured matches
const FeatCard: React.FC<{ match: Match; onMatchClick: (match: Match) => void }> = React.memo(({ match, onMatchClick }) => {
    const team1 = match.participants[0];
    const team2 = match.participants[1];
    const team1Name = (team1 && typeof team1.name === 'string') ? team1.name : 'TBC';
    const team2Name = (team2 && typeof team2.name === 'string') ? team2.name : 'TBC';

    const color1 = getTeamColor(team1Name !== 'TBC' ? team1Name : undefined);
    const color2 = getTeamColor(team2Name !== 'TBC' ? team2Name : undefined);

    let background = '#0f0f13';
    if (color1 && color2) {
        background = `radial-gradient(circle at top left, ${color1}40, transparent 55%), radial-gradient(circle at bottom right, ${color2}40, transparent 55%), #0f0f13`;
    } else if (color1) {
        background = `radial-gradient(circle at top left, ${color1}33, #0f0f13 70%)`;
    }

    const isLive = match.event_state === 'L';
    const isUpcoming = match.event_state === 'U';
    const isCompleted = match.event_state === 'R' || match.event_state === 'C';

    // Winner logic for completed matches
    const winnerId = match.participants?.find(p => p.highlight === 'true')?.id ||
        (match.short_event_status?.includes(team1?.short_name || 'ZZZ') ? team1?.id :
            match.short_event_status?.includes(team2?.short_name || 'ZZZ') ? team2?.id : null);
    const isDraw = match.result_code === 'D';
    const isT1Winner = isCompleted && !isDraw && team1?.id === winnerId;
    const isT2Winner = isCompleted && !isDraw && team2?.id === winnerId;

    const seriesName = shortenSeriesName(match.series_name);
    const matchInfo = match.event_name || '';

    // Score renderer
    const renderScore = (score: string | undefined, isWinner: boolean) => {
        if (!score) return <span style={{ color: 'rgba(255,255,255,0.3)' }}>-</span>;
        const cleanScore = score.replace(/\s*\([^)]*\)/g, '');
        return (
            <span style={{ fontSize: '13px', fontWeight: 700, color: isWinner ? '#fff' : 'rgba(255,255,255,0.6)' }}>
                {cleanScore}
            </span>
        );
    };

    return (
        <div
            onClick={() => onMatchClick(match)}
            style={{
                minWidth: '260px',
                background,
                border: `1px solid rgba(255, 255, 255, 0.08)`,
                borderRadius: '16px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            }}
        >
            {/* Background Watermarks */}
            {team1Name !== 'TBC' && (
                <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '50%', height: '50%', opacity: 0.05, pointerEvents: 'none', filter: 'grayscale(100%)' }}>
                    <WikiImage name={team1Name} id={team1?.id} type="team" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
            )}
            {team2Name !== 'TBC' && (
                <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '50%', height: '50%', opacity: 0.05, pointerEvents: 'none', filter: 'grayscale(100%)' }}>
                    <WikiImage name={team2Name} id={team2?.id} type="team" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
            )}

            {/* Header */}
            <div style={{
                marginBottom: '10px',
                fontSize: '10px',
                color: 'rgba(255,255,255,0.5)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                zIndex: 1,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <span style={{ maxWidth: '60%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {seriesName}
                </span>
                {isLive && (
                    <span style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        color: '#ef4444',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '9px',
                        fontWeight: 700,
                        animation: 'pulse 1.5s ease-in-out infinite'
                    }}>LIVE</span>
                )}
                {isUpcoming && (
                    <span style={{ color: '#6366f1', fontWeight: 600 }}>
                        {formatTime(match.start_date)}
                    </span>
                )}
                {isCompleted && (
                    <span style={{ color: '#f59e0b' }}>{matchInfo}</span>
                )}
            </div>

            {/* Teams Row */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 1 }}>
                {/* Team 1 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <WikiImage name={team1?.name} id={team1?.id} type="team" style={{ width: '20px', height: '20px', borderRadius: '4px' }} />
                        <span style={{
                            fontSize: '13px',
                            fontWeight: isT1Winner ? 700 : 500,
                            color: isT1Winner ? '#fff' : 'rgba(255,255,255,0.7)',
                        }}>
                            {team1?.name}
                        </span>
                    </div>
                    {(isLive || isCompleted) && renderScore(team1?.value, isT1Winner || false)}
                </div>

                {/* Team 2 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <WikiImage name={team2?.name} id={team2?.id} type="team" style={{ width: '20px', height: '20px', borderRadius: '4px' }} />
                        <span style={{
                            fontSize: '13px',
                            fontWeight: isT2Winner ? 700 : 500,
                            color: isT2Winner ? '#fff' : 'rgba(255,255,255,0.7)',
                        }}>
                            {team2?.name}
                        </span>
                    </div>
                    {(isLive || isCompleted) && renderScore(team2?.value, isT2Winner || false)}
                </div>
            </div>

            {/* Bottom Status */}
            {isCompleted && (
                <div style={{ marginTop: '10px', zIndex: 1, textAlign: 'center' }}>
                    <span style={{ fontSize: '11px', color: isDraw ? '#eab308' : '#f59e0b', fontWeight: 600 }}>
                        {match.short_event_status}
                    </span>
                </div>
            )}
            {isUpcoming && (
                <div style={{ marginTop: '10px', zIndex: 1, textAlign: 'center' }}>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
                        {new Date(match.start_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                </div>
            )}
        </div>
    );
});

const FeatSection: React.FC<FeatSectionProps> = ({ matches, onMatchClick }) => {
    if (!matches || matches.length === 0) return null;

    const containerStyle: React.CSSProperties = {
        marginTop: '0',
        marginBottom: '0',
        display: 'flex',
        flexDirection: 'column',
    };

    const headerStyle: React.CSSProperties = {
        padding: '0 20px 12px 16px',
        display: 'flex',
        alignItems: 'center',
        height: '24px',
    };

    const textBaseStyle: React.CSSProperties = {
        fontFamily: '"BBH Bartle", sans-serif',
        fontSize: '14px',
        fontWeight: 600,
        letterSpacing: '0.5px',
        background: 'linear-gradient(90deg, #fbbf24 0%, #fbbf24 35%, #fef3c7 50%, #fbbf24 65%, #fbbf24 100%)',
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: 'featShimmer 1.5s ease-in-out infinite alternate',
        display: 'block',
        lineHeight: '24px',
    };

    const listStyle: React.CSSProperties = {
        display: 'flex',
        gap: '12px',
        overflowX: 'auto',
        padding: '0 20px 0 16px',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
    };

    return (
        <div style={containerStyle}>
            <style>{`
                @keyframes featShimmer {
                    0% { background-position: 0% 50%; }
                    100% { background-position: 100% 50%; }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                .feat-scroll::-webkit-scrollbar { display: none; }
            `}</style>

            <div style={headerStyle}>
                <span style={textBaseStyle}>.FEAT</span>
            </div>

            <div className="feat-scroll" style={listStyle}>
                {matches.map((match) => (
                    <FeatCard key={match.game_id} match={match} onMatchClick={onMatchClick} />
                ))}
            </div>
        </div>
    );
};

export default FeatSection;
