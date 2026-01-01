import React, { useState, useEffect } from 'react';
import { Match } from '../types';
import WikiImage from './WikiImage';
import { getTeamColor } from '../utils/teamColors';

interface JustFinishedSectionProps {
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

const Card: React.FC<{ match: Match; onMatchClick: (match: Match) => void }> = React.memo(({ match, onMatchClick }) => {
    const team1 = match.participants[0];
    const team2 = match.participants[1];

    const team1Name = (team1 && typeof team1.name === 'string') ? team1.name : 'TBC';
    const team2Name = (team2 && typeof team2.name === 'string') ? team2.name : 'TBC';

    // Dynamic Team Colors for Dual Glow (copied from UpcomingCard)
    const color1 = getTeamColor(team1Name !== 'TBC' ? team1Name : undefined);
    const color2 = getTeamColor(team2Name !== 'TBC' ? team2Name : undefined);

    let background = '#0f0f13';
    const borderColor = 'rgba(255, 255, 255, 0.08)';

    if (color1 && color2) {
        background = `radial-gradient(circle at top left, ${color1}40, transparent 55%), radial-gradient(circle at bottom right, ${color2}40, transparent 55%), #0f0f13`;
    } else if (color1) {
        background = `radial-gradient(circle at top left, ${color1}33, #0f0f13 70%)`;
    }

    // Winner Logic
    const winnerId = match.participants?.find(p => p.highlight === 'true')?.id ||
        (match.short_event_status?.includes(team1?.short_name || 'ZZZ') ? team1?.id :
            match.short_event_status?.includes(team2?.short_name || 'ZZZ') ? team2?.id : null);

    const isDraw = match.result_code === 'D';
    const isT1Winner = !isDraw && team1?.id === winnerId;
    const isT2Winner = !isDraw && team2?.id === winnerId;

    // Header Info
    const seriesName = shortenSeriesName(match.series_name);
    const matchInfo = match.event_name || ''; // e.g. "3rd Test" or "Match 4"
    const displaySubHeader = matchInfo ? `${seriesName} • ${matchInfo}` : seriesName;

    // Score Renderer (handles multi-innings)
    const renderScore = (score: string | undefined, isWinner: boolean) => {
        if (!score) return <span style={{ color: 'rgba(255,255,255,0.3)' }}>-</span>;
        const cleanScore = score.replace(/\s*\([^)]*\)/g, ''); // Remove overs

        if (cleanScore.includes('&')) {
            // Multi-innings (Test)
            const parts = cleanScore.split('&').map(s => s.trim());
            return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.1 }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: isWinner ? '#fff' : 'rgba(255,255,255,0.6)' }}>
                        {parts[1] || parts[0]}
                    </span>
                    {parts[1] && <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>{parts[0]}</span>}
                </div>
            );
        }
        // Single innings
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
                border: `1px solid ${borderColor}`,
                borderRadius: '16px',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
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

            {/* Header: Series/Match Info */}
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
                <span style={{ maxWidth: '70%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {seriesName}
                </span>
                <span>
                    {matchInfo}
                </span>
            </div>

            {/* Teams Row */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 1 }}>
                {/* Team 1 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <WikiImage
                            name={team1?.name}
                            id={team1?.id}
                            type="team"
                            style={{ width: '20px', height: '20px', borderRadius: '4px' }}
                        />
                        <span style={{
                            fontSize: '13px',
                            fontWeight: isT1Winner ? 700 : 500,
                            color: isT1Winner ? '#fff' : 'rgba(255,255,255,0.7)',
                        }}>
                            {team1?.name}
                        </span>
                    </div>
                    {renderScore(team1?.value, isT1Winner || false)}
                </div>

                {/* Team 2 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <WikiImage
                            name={team2?.name}
                            id={team2?.id}
                            type="team"
                            style={{ width: '20px', height: '20px', borderRadius: '4px' }}
                        />
                        <span style={{
                            fontSize: '13px',
                            fontWeight: isT2Winner ? 700 : 500,
                            color: isT2Winner ? '#fff' : 'rgba(255,255,255,0.7)',
                        }}>
                            {team2?.name}
                        </span>
                    </div>
                    {renderScore(team2?.value, isT2Winner || false)}
                </div>
            </div>

            {/* Result Text */}
            <div style={{ marginTop: '10px', zIndex: 1, textAlign: 'center' }}>
                <span style={{
                    fontSize: '11px',
                    color: isDraw ? '#eab308' : '#f59e0b', // Amber
                    fontWeight: 600
                }}>
                    {match.short_event_status}
                </span>
            </div>
        </div>
    );
});

const JustFinishedSection: React.FC<JustFinishedSectionProps> = ({ matches, onMatchClick }) => {
    if (!matches || matches.length === 0) return null;

    // --- STYLES ---

    const containerStyle: React.CSSProperties = {
        marginTop: '24px',
        marginBottom: '16px',
        display: 'flex',
        flexDirection: 'column',
    };

    const headerStyle: React.CSSProperties = {
        padding: '0 20px 12px 16px', // Matched with .NEXT and .LIVE
        display: 'flex',
        alignItems: 'center',
        height: '24px',
    };

    // Shared Text Style (Matches TimeFilter.tsx .NEXT style exactly)
    const textBaseStyle: React.CSSProperties = {
        fontFamily: '"BBH Bartle", sans-serif',
        fontSize: '14px',
        fontWeight: 600,
        letterSpacing: '0.5px',
        // Amber Gradient
        background: 'linear-gradient(90deg, #f59e0b 0%, #f59e0b 35%, #fbbf24 50%, #f59e0b 65%, #f59e0b 100%)',
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: 'amberShimmer 1.5s ease-in-out infinite alternate',
        display: 'block',
        lineHeight: '24px',
    };

    const listStyle: React.CSSProperties = {
        display: 'flex',
        gap: '12px',
        overflowX: 'auto',
        padding: '0 20px 0 16px', // Matched with .NEXT and .LIVE
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
    };

    return (
        <div style={containerStyle}>
            <style>{`
                @keyframes amberShimmer {
                    0% { background-position: 0% 50%; }
                    100% { background-position: 100% 50%; }
                }
                .just-finished-scroll::-webkit-scrollbar { display: none; }
            `}</style>

            {/* Header: Simple .JUST */}
            <div style={headerStyle}>
                <span style={textBaseStyle}>.JUST</span>
            </div>

            {/* Match List */}
            <div className="just-finished-scroll" style={listStyle}>
                {matches.slice(0, 20).map((match) => (
                    <Card key={match.game_id} match={match} onMatchClick={onMatchClick} />
                ))}
            </div>
        </div>
    );
};

export default JustFinishedSection;
