import React from 'react';
import { getFlagUrl } from '../WikiImage';
import { useImageColor } from '../../hooks/useImageColor';
import { getTeamColor } from '../../utils/teamColors';

interface VenueTeam {
    id?: number;
    name?: string;
    short_name?: string;
    won?: number;
    lost?: number;
    draw?: number;
    win_percentage?: number;
}

interface VenueData {
    venue?: string;
    venue_display_name?: string;
    // API returns 'data' not 'teams' - confirmed via curl
    data?: VenueTeam[];
}

interface PitchDetails {
    Pitch_Suited_For?: string;
    Pitch_Surface?: string;
}

interface VenueCardProps {
    venue: VenueData;
    pitchDetails?: PitchDetails;
}

const VenueCard: React.FC<VenueCardProps> = ({ venue, pitchDetails }) => {
    if (!venue || !venue.data || venue.data.length < 2) return null;

    const team1 = venue.data[0];
    const team2 = venue.data[1];

    // Calculate totals for comparison
    const wins1 = team1?.won || 0;
    const wins2 = team2?.won || 0;
    const totalWins = wins1 + wins2;

    // Avoid division by zero
    const pct1 = totalWins > 0 ? (wins1 / totalWins) * 100 : 50;
    const pct2 = totalWins > 0 ? (wins2 / totalWins) * 100 : 50;

    // Dynamic Colors
    const team1Img = getFlagUrl(team1.name);
    const team2Img = getFlagUrl(team2.name);

    // Explicit Fallbacks: Blue (#0055D4) and Red (#E30A17)
    const color1Extracted = useImageColor(team1Img || undefined, '#0055D4');
    const color2Extracted = useImageColor(team2Img || undefined, '#E30A17');

    const color1 = getTeamColor(team1.name) || getTeamColor(team1.short_name) || color1Extracted;
    const color2 = getTeamColor(team2.name) || getTeamColor(team2.short_name) || color2Extracted;

    // Get just the venue name without city repetition
    const venueName = venue.venue_display_name?.split(',')[0] || venue.venue;

    // Calculate win rates for each team individually
    const played1 = (team1.won || 0) + (team1.lost || 0) + (team1.draw || 0);
    const rate1 = played1 > 0 ? ((wins1 / played1) * 100).toFixed(1) : '0.0';

    const played2 = (team2.won || 0) + (team2.lost || 0) + (team2.draw || 0);
    const rate2 = played2 > 0 ? ((wins2 / played2) * 100).toFixed(1) : '0.0';

    // Pitch info
    const hasPitchInfo = pitchDetails?.Pitch_Suited_For || pitchDetails?.Pitch_Surface;

    return (
        <div className="h2h-card">
            <div className="h2h-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                </svg>
                {venueName}
            </div>

            {/* Main Stats Row */}
            <div className="h2h-content">
                <div className="h2h-section align-left">
                    <span className="h2h-team-name">{team1.short_name}</span>
                    <span className="h2h-big-number" style={{ color: color1 }}>{wins1}</span>
                    <span className="h2h-win-pct" style={{ color: color1, opacity: 0.8 }}>{rate1}% Win Rate</span>
                </div>

                <div className="h2h-section align-center" style={{ paddingBottom: 0 }}>
                    <span className="h2h-draws-label">Wins at Venue</span>
                </div>

                <div className="h2h-section align-right">
                    <span className="h2h-team-name">{team2.short_name}</span>
                    <span className="h2h-big-number" style={{ color: color2 }}>{wins2}</span>
                    <span className="h2h-win-pct" style={{ color: color2, opacity: 0.8 }}>{rate2}% Win Rate</span>
                </div>
            </div>

            {/* Visual Bar for Wins Comparison */}
            <div className="h2h-bar-container">
                <div
                    className="h2h-bar"
                    style={{ width: `${pct1}%`, background: color1 }}
                />
                <div
                    className="h2h-bar"
                    style={{ width: `${pct2}%`, background: color2 }}
                />
            </div>

            {hasPitchInfo && (
                <div className="h2h-footer" style={{ justifyContent: 'center' }}>
                    <span style={{
                        fontSize: '10px',
                        padding: '3px 8px',
                        background: 'rgba(34, 197, 94, 0.15)',
                        borderRadius: '4px',
                        color: '#22c55e'
                    }}>
                        {pitchDetails?.Pitch_Suited_For || pitchDetails?.Pitch_Surface}
                    </span>
                </div>
            )}
        </div>
    );
};

export default VenueCard;
