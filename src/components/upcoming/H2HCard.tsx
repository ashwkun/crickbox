import React from 'react';
import { useImageColor } from '../../hooks/useImageColor';
import { getFlagUrl } from '../WikiImage';
import { getTeamColor } from '../../utils/teamColors';

interface H2HTeam {
    id?: number;
    name?: string;
    short_name?: string;
    won?: number;
    lost?: number;
    draw?: number;
    win_percentage?: number;
    matches_played?: number;
}

interface H2HCardProps {
    teams: H2HTeam[];
    title?: string;
}

const H2HCard: React.FC<H2HCardProps> = ({ teams, title = "Head to Head" }) => {
    if (!teams || teams.length < 2) return null;

    const [team1, team2] = teams;
    const wins1 = team1.won || 0;
    const wins2 = team2.won || 0;
    const draws = team1.draw || 0;
    const total = wins1 + wins2 + draws || 1; // avoid div by zero

    const team1Logo = getFlagUrl(team1.name);
    const team2Logo = getFlagUrl(team2.name);

    // Extracted colors (fallback to Blue/Red if extraction fails/loading)
    // Default Blue: #0055D4, Default Red: #E30A17
    const team1Extracted = useImageColor(team1Logo || undefined, '#0055D4');
    const team2Extracted = useImageColor(team2Logo || undefined, '#E30A17');

    // Prefer official map (Name -> ShortName -> Extracted)
    const team1Color = getTeamColor(team1.name) || getTeamColor(team1.short_name) || team1Extracted;
    const team2Color = getTeamColor(team2.name) || getTeamColor(team2.short_name) || team2Extracted;

    // Calculate percentages for the bar
    const pct1 = (wins1 / total) * 100;
    const pctDraw = (draws / total) * 100;
    const pct2 = (wins2 / total) * 100;

    return (
        <div className="h2h-card">
            <div className="h2h-header">{title}</div>

            {/* Main Stats Row */}
            <div className="h2h-content">
                <div className="h2h-section align-left">
                    <span className="h2h-team-name">{team1.short_name}</span>
                    <span className="h2h-big-number" style={{ color: team1Color }}>{wins1}</span>
                    <span className="h2h-win-pct" style={{ color: team1Color, opacity: 0.8 }}>{team1.win_percentage?.toFixed(1)}%</span>
                </div>

                <div className="h2h-section align-center">
                    <span className="h2h-draws-label">Draws</span>
                    <span className="h2h-medium-number">{draws}</span>
                </div>

                <div className="h2h-section align-right">
                    <span className="h2h-team-name">{team2.short_name}</span>
                    <span className="h2h-big-number" style={{ color: team2Color }}>{wins2}</span>
                    <span className="h2h-win-pct" style={{ color: team2Color, opacity: 0.8 }}>{team2.win_percentage?.toFixed(1)}%</span>
                </div>
            </div>

            {/* Visual Bar */}
            <div className="h2h-bar-container">
                <div className="h2h-bar team1" style={{ width: `${pct1}%`, background: team1Color }}></div>
                <div className="h2h-bar draw" style={{ width: `${pctDraw}%` }}></div>
                <div className="h2h-bar team2" style={{ width: `${pct2}%`, background: team2Color }}></div>
            </div>

            <div className="h2h-footer">
                {team1.matches_played} matches played
            </div>
        </div>
    );
};

export default H2HCard;
