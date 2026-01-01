import React, { useState, useEffect } from 'react';
import { Match } from '../types';
import WikiImage from './WikiImage';
import { getTeamColor } from '../utils/teamColors';

interface JustFinishedSectionProps {
    matches: Match[];
    onMatchClick: (match: Match) => void;
}

const JustFinishedSection: React.FC<JustFinishedSectionProps> = ({ matches, onMatchClick }) => {
    const [showDone, setShowDone] = useState(false);

    // Ticker animation loop
    useEffect(() => {
        const interval = setInterval(() => {
            setShowDone(prev => !prev);
        }, 3000); // Toggle every 3 seconds
        return () => clearInterval(interval);
    }, []);

    if (!matches || matches.length === 0) return null;

    // --- STYLES ---

    const containerStyle: React.CSSProperties = {
        marginTop: '24px',
        marginBottom: '16px',
        display: 'flex',
        flexDirection: 'column',
    };

    const headerStyle: React.CSSProperties = {
        padding: '0 20px',
        marginBottom: '12px',
        display: 'flex',
        alignItems: 'center',
        height: '24px',
    };

    // Ticker Container (Flip effect)
    const tickerContainer: React.CSSProperties = {
        position: 'relative',
        height: '24px',
        width: '60px', // Exact width for .JUST/.DONE
        perspective: '400px',
    };

    // Shared Text Style (Matches TimeFilter.tsx .NEXT style exactly)
    const textBaseStyle: React.CSSProperties = {
        fontFamily: '"BBH Bartle", sans-serif',
        fontSize: '14px',
        fontWeight: 600,
        letterSpacing: '0px', // Reset letter spacing since we control it via container width
        // Amber Gradient
        background: 'linear-gradient(90deg, #f59e0b 0%, #f59e0b 35%, #fbbf24 50%, #f59e0b 65%, #f59e0b 100%)',
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: 'amberShimmer 1.5s ease-in-out infinite alternate',
        display: 'block', // Changed to block for better transform handling inside flex
        lineHeight: '24px', // Explicit line height for alignment
    };

    // Main wrapper for . + Ticker
    const brandWrapperStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center', // Align dot and letters vertically
        height: '24px',
        perspective: '400px',
    };

    // Container for the animated words
    const tickerWrapperStyle: React.CSSProperties = {
        position: 'relative',
        display: 'flex',
        height: '24px',
        marginLeft: '2px', // Increased gap after the dot
    };

    // Individual character container
    const charContainerStyle: React.CSSProperties = {
        position: 'relative',
        width: '19px', // Set to 19px as requested
        height: '24px',
        transformStyle: 'preserve-3d',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    };

    // Animated Letter Style
    const letterStyle = (isJust: boolean, delayIndex: number): React.CSSProperties => ({
        ...textBaseStyle,
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%', // Fill container
        textAlign: 'center',
        backfaceVisibility: 'hidden',
        transition: `transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) ${delayIndex * 0.06}s, opacity 0.3s ease ${delayIndex * 0.06}s`, // Slightly tweaked timing
        transform: isJust
            ? (showDone ? 'rotateX(-90deg)' : 'rotateX(0deg)')
            : (showDone ? 'rotateX(0deg)' : 'rotateX(90deg)'),
        opacity: isJust
            ? (showDone ? 0 : 1)
            : (showDone ? 1 : 0),
        transformOrigin: 'center center',
    });

    // Match List Container (Horizontal Scroll)
    const listStyle: React.CSSProperties = {
        display: 'flex',
        gap: '12px',
        overflowX: 'auto',
        padding: '0 20px',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
    };

    // --- SLEEK CARD ---

    const Card: React.FC<{ match: Match }> = ({ match }) => {
        const team1 = match.participants[0];
        const team2 = match.participants[1];

        // Find winner for highlighting
        // Result code: W = Win, T = Tie, D = Draw, N = No Result
        // We can check match.result_sub_code or parsing status, but simpler:
        // usually API doesn't give clean winner ID in match list, so we rely on text or simple heuristics?
        // Actually match.result usually has winner text.
        // Let's rely on simple text check for better performance or just render neutral if unsure.
        // Actually CompletedCard.tsx logic: `winnerId = match.participants?.find(p => p.highlight === 'true')?.id`
        const winnerId = match.participants?.find(p => p.highlight === 'true')?.id ||
            (match.short_event_status?.includes(team1?.short_name || 'ZZZ') ? team1?.id :
                match.short_event_status?.includes(team2?.short_name || 'ZZZ') ? team2?.id : null);

        const isT1Winner = team1?.id === winnerId;
        const isT2Winner = team2?.id === winnerId;

        return (
            <div
                onClick={() => onMatchClick(match)}
                style={{
                    minWidth: '260px',
                    background: 'rgba(20, 20, 20, 0.6)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                }}
            >
                {/* Glow Effect for Winner (Subtle Amber) */}
                <div style={{
                    position: 'absolute',
                    top: '-50%',
                    left: '-50%',
                    width: '200%',
                    height: '200%',
                    background: 'radial-gradient(circle at 50% 50%, rgba(245, 158, 11, 0.06) 0%, transparent 60%)',
                    pointerEvents: 'none',
                }} />

                {/* Header: Series Name + Time Ago */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                    <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {match.parent_series_name || match.series_name?.split(',')[0]}
                    </span>
                    <span>FINISHED</span>
                </div>

                {/* Teams Row */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {/* Team 1 */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <WikiImage
                                name={team1?.name}
                                type="team"
                                style={{ width: '20px', height: '20px', borderRadius: '4px', opacity: isT2Winner ? 0.6 : 1 }}
                            />
                            <span style={{
                                fontSize: '13px',
                                fontWeight: isT1Winner ? 700 : 500,
                                color: isT1Winner ? '#fff' : isT2Winner ? 'rgba(255,255,255,0.5)' : '#ddd',
                                textDecoration: isT2Winner ? 'none' : 'none'
                            }}>
                                {team1?.name}
                            </span>
                        </div>
                        <span style={{
                            fontSize: '13px',
                            fontWeight: isT1Winner ? 700 : 500,
                            color: isT1Winner ? '#fff' : isT2Winner ? 'rgba(255,255,255,0.5)' : '#ddd'
                        }}>
                            {team1?.value?.split('(')[0]?.trim() || '-'}
                        </span>
                    </div>

                    {/* Team 2 */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <WikiImage
                                name={team2?.name}
                                type="team"
                                style={{ width: '20px', height: '20px', borderRadius: '4px', opacity: isT1Winner ? 0.6 : 1 }}
                            />
                            <span style={{
                                fontSize: '13px',
                                fontWeight: isT2Winner ? 700 : 500,
                                color: isT2Winner ? '#fff' : isT1Winner ? 'rgba(255,255,255,0.5)' : '#ddd',
                            }}>
                                {team2?.name}
                            </span>
                        </div>
                        <span style={{
                            fontSize: '13px',
                            fontWeight: isT2Winner ? 700 : 500,
                            color: isT2Winner ? '#fff' : isT1Winner ? 'rgba(255,255,255,0.5)' : '#ddd'
                        }}>
                            {team2?.value?.split('(')[0]?.trim() || '-'}
                        </span>
                    </div>
                </div>

                {/* Result Pill */}
                <div style={{ marginTop: '2px' }}>
                    <span style={{
                        fontSize: '11px',
                        color: '#f59e0b', // Amber text
                        fontWeight: 600
                    }}>
                        {match.short_event_status?.replace(' beat ', ' won by ')}
                    </span>
                </div>
            </div>
        );
    };

    const WORD_JUST = ['J', 'U', 'S', 'T'];
    const WORD_DONE = ['D', 'O', 'N', 'E'];

    return (
        <div style={containerStyle}>
            <style>{`
                @keyframes amberShimmer {
                    0% { background-position: 0% 50%; }
                    100% { background-position: 100% 50%; }
                }
                .just-finished-scroll::-webkit-scrollbar { display: none; }
            `}</style>

            {/* Header with Ticker */}
            <div style={headerStyle}>
                {/* Static Dot */}
                <span style={{ ...textBaseStyle, marginRight: '1px' }}>.</span>

                {/* Animated Word */}
                <div style={{ ...tickerWrapperStyle, marginLeft: '0px' }}>
                    {WORD_JUST.map((char, i) => (
                        <div key={i} style={charContainerStyle}>
                            {/* JUST letter (Leaves) */}
                            <span style={letterStyle(true, i)}>
                                {char}
                            </span>

                            {/* DONE letter (Enters) */}
                            <span style={letterStyle(false, i)}>
                                {WORD_DONE[i]}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Match List */}
            <div className="just-finished-scroll" style={listStyle}>
                {matches.slice(0, 3).map((match) => (
                    <Card key={match.game_id} match={match} />
                ))}
            </div>
        </div>
    );
};

export default JustFinishedSection;
