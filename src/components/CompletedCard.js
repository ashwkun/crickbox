import React from 'react';
import WikiImage from './WikiImage';

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
        .replace(/,?\s*\d{4}(\/\d{2,4})?/g, '')
        .replace(/\s+Series$/i, '')
        .trim();
};

const CompletedCard = ({ match, onClick, showSeriesButton, onViewSeries, showTournamentButton, onViewTournament }) => {
    // Use result_code and highlight to determine winner
    const isDraw = match.result_code === 'D';
    const winnerId = match.participants?.find(p => p.highlight === 'true')?.id;

    // Format date
    const matchDate = new Date(match.start_date);
    const dateStr = matchDate.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short'
    });

    // Get match title (e.g., "3rd Test") and series name
    const matchTitle = match.event_name || '';
    const seriesName = shortenSeriesName(match.series_name);

    // Get venue city (extract from venue_name like "Seddon Park, Hamilton" -> "Hamilton")
    const venueCity = match.venue_name?.split(',').pop()?.trim() || '';

    // Use short_event_status for result (e.g., "NZ beat ENG by 423 runs")
    // Fallback to event_sub_status, then winning_margin
    const resultText = match.short_event_status || match.event_sub_status ||
        (match.winning_margin ? `Won by ${match.winning_margin}` : '');

    // Render score with Test match multi-innings support
    const renderScore = (score, isWinner) => {
        if (!score) return <span style={{ color: '#525252' }}>-</span>;

        // Clean up score - remove overs in parentheses for cleaner display
        const cleanScore = score.replace(/\s*\([^)]*\)/g, '');

        if (cleanScore.includes('&')) {
            const parts = cleanScore.split('&').map(s => s.trim());
            return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.2 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: isWinner ? '#fff' : '#a3a3a3' }}>
                        {parts[1] || parts[0]}
                    </span>
                    {parts[1] && <span style={{ fontSize: 10, color: '#525252' }}>{parts[0]}</span>}
                </div>
            );
        }
        return (
            <span style={{ fontSize: 14, fontWeight: 700, color: isWinner ? '#fff' : '#a3a3a3' }}>
                {cleanScore}
            </span>
        );
    };

    const hasButton = showSeriesButton || showTournamentButton;

    // Card content
    const cardContent = (
        <div
            onClick={() => onClick(match)}
            style={{
                background: '#141414',
                border: '1px solid #262626',
                borderRadius: hasButton ? '16px 16px 0 0' : 16,
                padding: 16,
                cursor: 'pointer'
            }}
        >
            {/* Header: Series + Match Name */}
            <div style={{ marginBottom: 12 }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 4
                }}>
                    <span style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#a3a3a3',
                        maxWidth: '70%',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}>
                        {seriesName}
                    </span>
                    <span style={{ fontSize: 10, color: '#525252' }}>
                        {dateStr}
                    </span>
                </div>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>
                        {matchTitle || seriesName}
                    </span>
                    {venueCity && (
                        <span style={{ fontSize: 10, color: '#525252' }}>
                            {venueCity}
                        </span>
                    )}
                </div>
            </div>

            {/* Teams Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {match.participants?.map((team, idx) => {
                    const isWinner = !isDraw && team.id === winnerId;
                    const isLoser = !isDraw && winnerId && team.id !== winnerId;

                    return (
                        <div
                            key={idx}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                opacity: isLoser ? 0.5 : 1,
                                padding: '6px 0'
                            }}
                        >
                            {/* Team Info */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <WikiImage
                                    name={team.name}
                                    id={team.id}
                                    type="team"
                                    style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 8,
                                        objectFit: 'contain',
                                        background: '#1f1f1f',
                                        padding: 3
                                    }}
                                />
                                <span style={{
                                    fontSize: 14,
                                    fontWeight: isWinner ? 700 : 500,
                                    color: isWinner ? '#fff' : '#a3a3a3'
                                }}>
                                    {team.name}
                                </span>
                            </div>

                            {/* Score */}
                            {renderScore(team.value, isWinner)}
                        </div>
                    );
                })}
            </div>

            {/* Result Footer */}
            {resultText && (
                <div style={{
                    marginTop: 12,
                    paddingTop: 10,
                    borderTop: '1px solid #262626',
                    fontSize: 11,
                    fontWeight: 600,
                    color: isDraw ? '#f59e0b' : '#22c55e',
                    textAlign: 'center'
                }}>
                    {resultText}
                </div>
            )}
        </div>
    );

    // If has button, wrap in expandable-card container
    if (hasButton) {
        return (
            <div className="expandable-card">
                {cardContent}
                {showSeriesButton && onViewSeries && (
                    <button
                        className="view-series-button"
                        onClick={(e) => { e.stopPropagation(); onViewSeries(match.series_id); }}
                    >
                        View Series →
                    </button>
                )}
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
    }

    // No button - render as simple card with proper sizing
    return (
        <div style={{
            minWidth: 280,
            maxWidth: 280,
            flexShrink: 0,
            scrollSnapAlign: 'start'
        }}>
            {cardContent}
        </div>
    );
};

export default CompletedCard;
