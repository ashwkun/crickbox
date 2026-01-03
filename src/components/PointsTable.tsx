import React from 'react';
import WikiImage from './WikiImage';
import { Match } from '../types';
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
    matches?: Match[];  // Tournament matches to compute form from
    style?: React.CSSProperties;
}

// Form result type
type FormResult = 'W' | 'L' | 'D' | null;

const PointsTable: React.FC<PointsTableProps> = ({ standings, matches = [], style }) => {
    // Defensive check: ensure standings is an array
    if (!standings || !Array.isArray(standings) || standings.length === 0) {
        return <div className="points-table-empty">No standings available</div>;
    }

    // Sort by wins (descending), then by matches played (ascending for tie-breaker)
    const sorted = [...standings].sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        return a.matches - b.matches; // Fewer matches = better if same wins
    });

    // State for NRR data
    const [nrrData, setNrrData] = React.useState<Record<string, number>>({});

    // Fetch NRR data on mount
    React.useEffect(() => {
        const fetchNRR = async () => {
            // We need seriesId to fetch specific stats. 
            // Currently matches[0].series_id is the best proxy if not passed explicitly?
            // Ideally parent should pass seriesId. relying on matches for now.
            if (matches.length === 0) return;

            const seriesId = matches[0].series_id;
            if (!seriesId) return;

            try {
                const { createClient } = await import('@supabase/supabase-js');
                const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://ycumznofytwntinxlxkc.supabase.co';
                const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '***REMOVED***';
                const supabase = createClient(supabaseUrl, supabaseKey);

                const { data, error } = await supabase
                    .from('team_tournament_stats')
                    .select('*')
                    .eq('series_id', seriesId);

                if (error) {
                    console.error('Failed to fetch NRR:', error);
                    return;
                }

                const nrrMap: Record<string, number> = {};
                data.forEach((stat: any) => {
                    // NRR = (Runs Scored / Overs Faced) - (Runs Conceded / Overs Bowled)
                    // The view now returns balls (pre-adjusted for all-out scenarios)

                    // 1. Batting Rate: balls_faced is actual balls OR alloted_balls if all out
                    const ballsFaced = stat.balls_faced || 1;
                    const oversFaced = ballsFaced / 6;
                    const battingRate = (stat.runs_scored || 0) / oversFaced;

                    // 2. Bowling Rate: overs_bowled_decimal is now actually total balls bowled (adjusted)
                    const ballsBowled = stat.overs_bowled_decimal || 1;
                    const oversBowled = ballsBowled / 6;
                    const bowlingRate = (stat.runs_conceded || 0) / oversBowled;

                    nrrMap[stat.team_id] = battingRate - bowlingRate;
                });

                setNrrData(nrrMap);

            } catch (e) {
                console.error('NRR fetch error:', e);
            }
        };

        fetchNRR();
    }, [matches]);

    // Calculate points (2 per win, 1 per tie/NR)
    const getPoints = (team: TeamStanding) => (team.wins * 2) + (team.tied || 0);

    // Render helper
    const getNRRDisplay = (teamId: number) => {
        const nrr = nrrData[String(teamId)];
        if (nrr === undefined) return '-';
        return (nrr > 0 ? '+' : '') + nrr.toFixed(3);
    };

    // Get team's last N match results from tournament matches
    const getTeamForm = (teamId: number, count: number = 5): FormResult[] => {
        const teamIdStr = String(teamId);

        // Filter matches involving this team (completed only)
        const teamMatches = matches.filter(m => {
            const isTeamInMatch =
                m.participants?.some(p => p.id === teamIdStr) ||
                (m as any).teama_id === teamIdStr ||
                (m as any).teamb_id === teamIdStr;
            const isCompleted = m.event_state === 'R' || m.event_state === 'C' ||
                (m as any).result_code === 'W';
            return isTeamInMatch && isCompleted;
        });

        // Sort by date (newest first)
        const sortedMatches = [...teamMatches].sort((a, b) => {
            const dateA = new Date(a.start_date || '').getTime();
            const dateB = new Date(b.start_date || '').getTime();
            return dateB - dateA;
        });

        // Get last N results
        const form: FormResult[] = [];
        for (let i = 0; i < count; i++) {
            if (i < sortedMatches.length) {
                const match = sortedMatches[i];
                // Determine if this team won
                // Determine winner from participants highlight flag (string "true" or boolean true)
                let winnerId: string | null = null;
                if (match.participants) {
                    const winner = match.participants.find(p => String(p.highlight) === 'true');
                    if (winner) {
                        winnerId = winner.id;
                    }
                }

                // Fallback: search status text
                if (!winnerId && (match.short_event_status || match.event_sub_status)) {
                    const status = (match.short_event_status || match.event_sub_status || '').toLowerCase();
                    const winningParticipant = match.participants?.find(p =>
                        status.startsWith(p.short_name.toLowerCase()) ||
                        status.startsWith(p.name.toLowerCase())
                    );
                    if (winningParticipant) winnerId = winningParticipant.id;
                }

                const hasWinner = winnerId && winnerId !== '';

                if (!hasWinner) {
                    // No result or draw
                    form.push('D');
                } else if (winnerId === teamIdStr) {
                    form.push('W');
                } else {
                    form.push('L');
                }
            } else {
                form.push(null); // Blank dot
            }
        }

        // Return recent-first (Recent -> Left)
        return form;
    };

    // Render form dots
    const renderFormDots = (form: FormResult[]) => {
        return (
            <div className="pt-form-dots">
                {form.map((result, idx) => (
                    <div
                        key={idx}
                        className={`pt-form-dot ${result ? `pt-form-${result.toLowerCase()}` : 'pt-form-blank'}`}
                        title={idx === 0 ? 'Latest Match' : (result || '-')}
                        style={{ position: 'relative' }}
                    >
                        {result || ''}
                        {/* Dot indicator for latest match (index 0) */}
                        {idx === 0 && (
                            <div style={{
                                position: 'absolute',
                                bottom: -4,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: 4,
                                height: 4,
                                borderRadius: '50%',
                                background: 'rgba(255,255,255,0.4)' // White dot for dark theme
                            }} />
                        )}
                    </div>
                ))}
            </div>
        );
    };

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
                        <th className="pt-stat">NRR</th>
                        <th className="pt-points">Pts</th>
                        <th className="pt-form">Form</th>
                    </tr>
                </thead>
                <tbody>
                    {sorted.map((team, idx) => {
                        const form = matches.length > 0 ? getTeamForm(team.id) :
                            Array(5).fill(null) as FormResult[];

                        return (
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
                                <td className="pt-stat pt-nrr">{getNRRDisplay(team.id)}</td>
                                <td className="pt-points">{getPoints(team)}</td>
                                <td className="pt-form-cell">{renderFormDots(form)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default PointsTable;
