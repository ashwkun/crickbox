import React from 'react';
import WikiImage from './WikiImage';
import '../styles/PointsTable.css';

interface TeamStanding {
    team_id: string;
    team_name: string;
    team_short_name: string;
    played: string;
    won: string;
    lost: string;
    tied: string;
    no_result: string;
    net_run_rate: string;
    points: string;
    position: string;
}

interface PointsTableProps {
    standings: TeamStanding[];
    style?: React.CSSProperties;
}

const PointsTable: React.FC<PointsTableProps> = ({ standings, style }) => {
    if (!standings || standings.length === 0) {
        return <div className="points-table-empty">No standings available</div>;
    }

    // Sort by position (just in case API returns unsorted)
    const sorted = [...standings].sort((a, b) =>
        parseInt(a.position) - parseInt(b.position)
    );

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
                        <th className="pt-nrr">NRR</th>
                        <th className="pt-points">Pts</th>
                    </tr>
                </thead>
                <tbody>
                    {sorted.map((team) => (
                        <tr key={team.team_id} className="pt-row">
                            <td className="pt-rank">{team.position}</td>
                            <td className="pt-team-cell">
                                <WikiImage
                                    name={team.team_name}
                                    type="team"
                                    className="pt-team-logo"
                                />
                                <span className="pt-team-name">{team.team_short_name || team.team_name}</span>
                            </td>
                            <td className="pt-stat">{team.played}</td>
                            <td className="pt-stat pt-win">{team.won}</td>
                            <td className="pt-stat pt-loss">{team.lost}</td>
                            <td className="pt-nrr">{team.net_run_rate}</td>
                            <td className="pt-points">{team.points}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default PointsTable;
