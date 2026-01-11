import React from 'react';
import WikiImage from './WikiImage';
import { Match } from '../types';
import { getTeamTournamentStats } from '../utils/matchDatabase';
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
    matches?: Match[];
    style?: React.CSSProperties;
    isLoading?: boolean;
}

// Form result type
type FormResult = 'W' | 'L' | 'D' | null;

const PointsTable: React.FC<PointsTableProps> = ({ standings, matches = [], style, isLoading = false }) => {

    // Skeleton Loader Component
    const TableSkeleton = () => (
        <div className="th-master-card" style={{ padding: 0 }}>
            <div className="points-scroll-view">
                <table className="points-table">
                    <thead>
                        <tr>
                            <th className="pt-rank">#</th>
                            <th className="pt-team">Team</th>
                            <th className="pt-stat">M</th>
                            <th className="pt-stat">W</th>
                            <th className="pt-stat">L</th>
                            <th className="pt-points">Pts</th>
                            <th className="pt-stat">NRR</th>
                            <th className="pt-form">Form</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: 8 }).map((_, i) => (
                            <tr key={i} className="pt-row pt-loading-row">
                                <td><div className="pt-skeleton short" /></td>
                                <td>
                                    <div className="pt-team-cell">
                                        <div className="pt-skeleton logo" />
                                        <div className="pt-skeleton text" />
                                    </div>
                                </td>
                                <td><div className="pt-skeleton short" /></td>
                                <td><div className="pt-skeleton short" /></td>
                                <td><div className="pt-skeleton short" /></td>
                                <td><div className="pt-skeleton short" /></td>
                                <td><div className="pt-skeleton text" style={{ width: 60 }} /></td>
                                <td><div className="pt-skeleton text" style={{ width: 50 }} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    if (isLoading) return <TableSkeleton />;

    // Defensive check
    if (!standings || !Array.isArray(standings) || standings.length === 0) {
        return (
            <div className="th-master-card">
                <div className="points-table-empty">No standings available</div>
            </div>
        );
    }

    // State for NRR data
    const [nrrData, setNrrData] = React.useState<Record<string, number>>({});

    // Fetch NRR data on mount (logic remains same)
    React.useEffect(() => {
        const fetchNRR = async () => {
            if (matches.length === 0) return;
            const seriesId = matches[0].series_id;
            if (!seriesId) return;

            try {
                const data = await getTeamTournamentStats(seriesId);
                if (!data.length) return;

                const nrrMap: Record<string, number> = {};
                data.forEach((stat: any) => {
                    // Database returns balls_faced and overs_bowled_decimal (both in BALLS, not overs)
                    const ballsFaced = stat.balls_faced || 0;
                    const ballsBowled = stat.overs_bowled_decimal || 0;

                    // Convert balls to overs for NRR calculation
                    const oversFaced = ballsFaced / 6;
                    const oversBowled = ballsBowled / 6;

                    // NRR = (Runs Scored / Overs Faced) - (Runs Conceded / Overs Bowled)
                    const battingRate = oversFaced > 0 ? (stat.runs_scored || 0) / oversFaced : 0;
                    const bowlingRate = oversBowled > 0 ? (stat.runs_conceded || 0) / oversBowled : 0;

                    nrrMap[stat.team_id] = battingRate - bowlingRate;
                });
                setNrrData(nrrMap);
            } catch (e) {
                console.error('NRR fetch error:', e);
            }
        };
        fetchNRR();
    }, [matches]);

    const getPoints = (team: TeamStanding) => (team.wins * 2) + (team.tied || 0) + (team.draw || 0);

    // Sort standings by Points (desc), then NRR (desc) for tiebreaking
    const sorted = React.useMemo(() => {
        return [...standings].sort((a, b) => {
            // Primary: Points (descending)
            const ptsA = getPoints(a);
            const ptsB = getPoints(b);
            if (ptsB !== ptsA) return ptsB - ptsA;

            // Tiebreaker: NRR (descending - higher NRR is better)
            const nrrA = nrrData[String(a.id)] ?? 0;
            const nrrB = nrrData[String(b.id)] ?? 0;
            return nrrB - nrrA;
        });
    }, [standings, nrrData]);

    const getNRRDisplay = (teamId: number) => {
        const nrr = nrrData[String(teamId)];
        if (nrr === undefined) return '-';
        return (nrr > 0 ? '+' : '') + nrr.toFixed(3);
    };

    // Form logic (Keep existing)
    const getTeamForm = (teamId: number, count: number = 5): FormResult[] => {
        const teamIdStr = String(teamId);
        const teamMatches = matches.filter(m => {
            const isTeamInMatch =
                m.participants?.some(p => p.id === teamIdStr) ||
                (m as any).teama_id === teamIdStr ||
                (m as any).teamb_id === teamIdStr;
            const isCompleted = m.event_state === 'R' || m.event_state === 'C' ||
                (m as any).result_code === 'W';
            return isTeamInMatch && isCompleted;
        });

        const sortedMatches = [...teamMatches].sort((a, b) => {
            const dateA = new Date(a.start_date || '').getTime();
            const dateB = new Date(b.start_date || '').getTime();
            return dateB - dateA;
        });

        const form: FormResult[] = [];
        for (let i = 0; i < count; i++) {
            if (i < sortedMatches.length) {
                const match = sortedMatches[i];
                let winnerId: string | null = null;
                if (match.participants) {
                    const winner = match.participants.find(p => String(p.highlight) === 'true');
                    if (winner) winnerId = winner.id;
                }

                // Fallback result parsing
                if (!winnerId && (match.short_event_status || match.event_sub_status)) {
                    const status = (match.short_event_status || match.event_sub_status || '').toLowerCase();
                    const winningParticipant = match.participants?.find(p =>
                        status.startsWith(p.short_name.toLowerCase()) ||
                        status.startsWith(p.name.toLowerCase())
                    );
                    if (winningParticipant) winnerId = winningParticipant.id;
                }

                if (!winnerId) form.push('D'); // Draw/NR
                else if (winnerId === teamIdStr) form.push('W');
                else form.push('L');
            } else {
                form.push(null);
            }
        }
        return form;
    };

    const renderFormDots = (form: FormResult[]) => (
        <div className="pt-form-dots">
            {form.map((result, idx) => {
                if (!result) return <div key={idx} className="pt-form-dot pt-form-blank" />;
                return <div key={idx} className={`pt-form-dot pt-form-${result.toLowerCase()}`} title={result} />;
            })}
        </div>
    );

    return (
        <div className="th-master-card" style={{ ...style, padding: 0 }}>
            <div className="points-scroll-view">
                <table className="points-table">
                    <thead>
                        <tr>
                            <th className="pt-rank">#</th>
                            <th className="pt-team">Team</th>
                            <th className="pt-stat">M</th>
                            <th className="pt-stat">W</th>
                            <th className="pt-stat">L</th>
                            <th className="pt-points">Pts</th>
                            <th className="pt-stat">NRR</th>
                            <th className="pt-form">Form</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.map((team, idx) => {
                            const form = matches.length > 0 ? getTeamForm(team.id) : Array(5).fill(null) as FormResult[];
                            const isQualified = idx < 4; // Top 4 highlight

                            return (
                                <tr key={team.id} className={`pt-row ${isQualified ? 'pt-qualify' : ''}`}>
                                    <td className="pt-rank">{idx + 1}</td>
                                    <td className="pt-team-cell">
                                        <WikiImage name={team.name} id={String(team.id)} type="team" className="pt-team-logo" />
                                        <span className="pt-team-name">{team.short_name || team.name}</span>
                                    </td>
                                    <td className="pt-stat pt-matches">{team.matches}</td>
                                    <td className="pt-stat pt-win">{team.wins}</td>
                                    <td className="pt-stat pt-loss">{team.loss}</td>
                                    <td className="pt-points">{getPoints(team)}</td>
                                    <td className="pt-stat pt-nrr">{getNRRDisplay(team.id)}</td>
                                    <td className="pt-form-cell">{renderFormDots(form)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PointsTable;
