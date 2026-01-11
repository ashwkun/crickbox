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

    // Sort by wins (descending), then by matches played (ascending for tie-breaker)
    const sorted = [...standings].sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        // If wins equal, check NRR (if we had it in sort, but here matches played is proxy)
        return a.matches - b.matches;
        // Note: Real sorting usually relies on Points -> NRR.
        // We calculate points below but sorting happens here.
        // Ideally sorting should use calculated Points > NRR.
    });

    // Re-sort based on Points (Wins * 2 + Tied) just to be safe
    sorted.sort((a, b) => {
        const ptsA = (a.wins * 2) + (a.tied || 0) + (a.draw || 0);
        const ptsB = (b.wins * 2) + (b.tied || 0) + (b.draw || 0);
        if (ptsB !== ptsA) return ptsB - ptsA;
        return 0; // Need NRR here for true tie-break
    });

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
                console.log('[PointsTable] NRR Raw Data:', data);
                if (!data.length) return;

                const nrrMap: Record<string, number> = {};
                data.forEach((stat: any) => {
                    // Data already has overs_faced and overs_bowled in decimal format (e.g., 20.0 overs)
                    const oversFaced = stat.overs_faced || 0;
                    const oversBowled = stat.overs_bowled || 0;

                    // NRR = (Runs Scored / Overs Faced) - (Runs Conceded / Overs Bowled)
                    const battingRate = oversFaced > 0 ? (stat.runs_scored || 0) / oversFaced : 0;
                    const bowlingRate = oversBowled > 0 ? (stat.runs_conceded || 0) / oversBowled : 0;

                    // If API provides pre-calculated NRR, use it; otherwise calculate
                    const nrr = stat.nrr !== undefined && stat.nrr !== null
                        ? stat.nrr
                        : battingRate - bowlingRate;
                    nrrMap[stat.team_id] = nrr;

                    console.log(`[PointsTable] NRR for Team ${stat.team_id} (${stat.team_name || 'Unknown'}):`, {
                        runsScored: stat.runs_scored,
                        oversFaced,
                        battingRate: battingRate.toFixed(3),
                        runsConceded: stat.runs_conceded,
                        oversBowled,
                        bowlingRate: bowlingRate.toFixed(3),
                        calculatedNRR: (battingRate - bowlingRate).toFixed(3),
                        apiNRR: stat.nrr,
                        usedNRR: nrr.toFixed(3)
                    });
                });
                console.log('[PointsTable] Final NRR Map:', nrrMap);
                setNrrData(nrrMap);
            } catch (e) {
                console.error('NRR fetch error:', e);
            }
        };
        fetchNRR();
    }, [matches]);

    const getPoints = (team: TeamStanding) => (team.wins * 2) + (team.tied || 0) + (team.draw || 0);

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
