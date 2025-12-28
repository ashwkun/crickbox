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
    teamIds?: [number, number]; // [id1, id2] to enforce order
    title?: string;
}

const H2HCard: React.FC<H2HCardProps> = ({ teams, teamIds, title = "Head to Head" }) => {
    if (!teams || teams.length < 2) return null;

    // Default to array order if no IDs provided
    let t1 = teams[0];
    let t2 = teams[1];

    // If IDs provided, enforce Strict LHS / RHS order
    if (teamIds) {
        const [id1, id2] = teamIds;
        t1 = teams.find(t => t.id === id1) || teams[0];
        // If t2 not found or same as t1, try format fallback or just take other
        t2 = teams.find(t => t.id === id2) || teams.find(t => t.id !== t1.id) || teams[1];
    }

    // Safety check
    if (!t1 || !t2) return null;

    const wins1 = t1.won || 0;
    const wins2 = t2.won || 0;
    const draws = t1.draw || 0;
    const total = wins1 + wins2 + draws || 1;

    const team1Logo = getFlagUrl(t1.name);
    const team2Logo = getFlagUrl(t2.name);

    // Extracted colors 
    const team1Extracted = useImageColor(team1Logo || undefined, '#0055D4');
    const team2Extracted = useImageColor(team2Logo || undefined, '#E30A17');

    const team1Color = getTeamColor(t1.name) || getTeamColor(t1.short_name) || team1Extracted;
    const team2Color = getTeamColor(t2.name) || getTeamColor(t2.short_name) || team2Extracted;

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
                    <span className="h2h-team-name">{t1.short_name}</span>
                    <span className="h2h-big-number" style={{ color: team1Color }}>{wins1}</span>
                    <span className="h2h-win-pct" style={{ color: team1Color, opacity: 0.8 }}>{t1.win_percentage?.toFixed(1)}%</span>
                </div>

                <div className="h2h-section align-center">
                    <span className="h2h-draws-label">Draws</span>
                    <span className="h2h-medium-number">{draws}</span>
                </div>

                <div className="h2h-section align-right">
                    <span className="h2h-team-name">{t2.short_name}</span>
                    <span className="h2h-big-number" style={{ color: team2Color }}>{wins2}</span>
                    <span className="h2h-win-pct" style={{ color: team2Color, opacity: 0.8 }}>{t2.win_percentage?.toFixed(1)}%</span>
                </div>
            </div>

            {/* Visual Bar - Ensure Bar matches LHS/RHS */}
            <div className="h2h-bar-container" style={{ marginTop: 12 }}>
                <div className="h2h-bar team1" style={{ width: `${pct1}%`, background: team1Color }}></div>
                <div className="h2h-bar draw" style={{ width: `${pctDraw}%` }}></div>
                <div className="h2h-bar team2" style={{ width: `${pct2}%`, background: team2Color }}></div>
            </div>

            <div className="h2h-footer">
                {t1.matches_played} matches played
            </div>
        </div>
    );
};

export default H2HCard;
