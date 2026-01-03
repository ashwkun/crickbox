import React from 'react';
import WikiImage from './WikiImage';
import '../styles/PointsTable.css';

interface TeamStanding {
    id: number;
    name: string;
    short_name: string;
    matches: number;
    wins: number;
    loss: number;
    draw: number;
    tied: number;
}

interface PointsTableProps {
    standings: TeamStanding[];
    style?: React.CSSProperties;
}

const PointsTable: React.FC<PointsTableProps> = ({ standings, style }) => {
    // Defensive check: ensure standings is an array
    if (!standings || !Array.isArray(standings) || standings.length === 0) {
        return <div className="points-table-empty">No standings available</div>;
    }

    // Sort by wins (descending), then by matches played (ascending for tie-breaker)
    const sorted = [...standings].sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        return a.matches - b.matches; // Fewer matches = better if same wins
    });

    // Calculate points (2 per win, 1 per tie/NR)
    const getPoints = (team: TeamStanding) => (team.wins * 2) + (team.tied || 0);

    return (
        <div className="points-table-container" style={style}>
            <table className="points-table">
                <thead>
                    <tr>
                        <th className="pt-rank">#</th>
                        <th className="pt-team">Team</th>
                        <th className="pt-stat">M</th>
                        <th className="pt-stat">W</th>
                        <th className="pt-stat">L</th>
                        <th className="pt-points">Pts</th>
                    </tr>
                </thead>
                <tbody>
                    {sorted.map((team, idx) => (
                        <tr key={team.id} className="pt-row">
                            <td className="pt-rank">{idx + 1}</td>
                            <td className="pt-team-cell">
                                <WikiImage
                                    name={team.name}
                                    id={String(team.id)}
                                    type="team"
                                    className="pt-team-logo"
                                />
                                <span className="pt-team-name">{team.short_name || team.name}</span>
                            </td>
                            <td className="pt-stat">{team.matches}</td>
                            <td className="pt-stat pt-win">{team.wins}</td>
                            <td className="pt-stat pt-loss">{team.loss}</td>
                            <td className="pt-points">{getPoints(team)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default PointsTable;

