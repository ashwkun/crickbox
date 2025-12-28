import React, { useEffect, useState } from 'react';
import { getTeamMatches, Match } from '../../utils/matchDatabase';
import WikiImage from '../WikiImage';

interface TeamInfo {
    id: string;
    name: string;
}

interface DualTeamRecentFormProps {
    team1: TeamInfo;
    team2: TeamInfo;
    currentFormat?: string;
    onMatchClick?: (gameId: string) => void;
}

const DualTeamRecentForm: React.FC<DualTeamRecentFormProps> = ({ team1, team2, currentFormat, onMatchClick }) => {
    const [matches1, setMatches1] = useState<Match[]>([]);
    const [matches2, setMatches2] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBothForms = async () => {
            if (!team1.id && !team2.id) return;
            setLoading(true);
            try {
                const [m1, m2] = await Promise.all([
                    team1.id ? getTeamMatches(team1.id, 50) : Promise.resolve([]),
                    team2.id ? getTeamMatches(team2.id, 50) : Promise.resolve([])
                ]);
                setMatches1(m1);
                setMatches2(m2);
            } catch (err) {
                console.error("Error fetching recent forms", err);
            } finally {
                setLoading(false);
            }
        };

        fetchBothForms();
    }, [team1.id, team2.id]);

    if (loading) return (
        <div className="section-container" style={{ minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner"></div>
        </div>
    );

    // --- Helpers ---
    const getResult = (m: Match, tId: string) => {
        if (!m.winner_id) return 'D';
        if (m.winner_id === tId) return 'W';
        return 'L';
    };

    const getResultColor = (res: string) => {
        if (res === 'W') return '#22c55e'; // Green
        if (res === 'L') return '#ef4444'; // Red
        return '#94a3b8'; // Grey
    };

    // Filter Logic
    const filterMatches = (matches: Match[]) => {
        const allForm = matches.slice(0, 5);

        const formatKey = currentFormat?.toLowerCase() || '';
        const isTest = formatKey.includes('test');
        const isOdi = formatKey.includes('odi');
        const isT20 = formatKey.includes('t20');

        const currentForm = matches.filter(m => {
            if (!currentFormat) return true;
            const mFormat = m.event_format?.toLowerCase() || '';
            if (isTest) return mFormat.includes('test');
            if (isOdi) return mFormat.includes('odi');
            if (isT20) return mFormat.includes('t20');
            return mFormat === formatKey;
        }).slice(0, 5);

        return { allForm, currentForm };
    };

    const { allForm: t1All, currentForm: t1Curr } = filterMatches(matches1);
    const { allForm: t2All, currentForm: t2Curr } = filterMatches(matches2);

    // --- Renderers ---
    const renderPills = (matches: Match[], tId: string, label?: string) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
            {label && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{label}</span>}
            <div style={{ display: 'flex', gap: 4 }}>
                {matches.length > 0 ? matches.map(m => {
                    const res = getResult(m, tId);
                    return (
                        <div
                            key={m.game_id}
                            onClick={() => onMatchClick?.(m.game_id)}
                            style={{
                                width: 22,
                                height: 22,
                                borderRadius: 4, // More squared styling
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: `rgba(${res === 'W' ? '34, 197, 94' : res === 'L' ? '239, 68, 68' : '148, 163, 184'}, 0.15)`,
                                color: getResultColor(res),
                                fontSize: 9,
                                fontWeight: 700,
                                cursor: onMatchClick ? 'pointer' : 'default',
                                border: `1px solid ${getResultColor(res)}30`
                            }}
                        >
                            {res}
                        </div>
                    );
                }) : <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>-</span>}
            </div>
        </div>
    );

    const renderTeamRow = (team: TeamInfo, current: Match[], all: Match[]) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Header: Team Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <WikiImage name={team.name} id={team.id} type="team" circle style={{ width: 24, height: 24 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{team.name}</span>
            </div>

            {/* Stats Row */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 32 }}>
                {/* Current Format Form */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Current ({currentFormat || 'Recent'})</span>
                    {renderPills(current, team.id)}
                </div>
                {/* All Format Form */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>All Formats</span>
                    {renderPills(all, team.id)}
                </div>
            </div>
        </div>
    );

    return (
        <div className="section-container " style={{ padding: '16px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 16 }}>Recent Form</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Team 1 */}
                {renderTeamRow(team1, t1Curr, t1All)}

                {/* Divider */}
                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', width: '100%' }}></div>

                {/* Team 2 */}
                {renderTeamRow(team2, t2Curr, t2All)}
            </div>
        </div>
    );
};

export default DualTeamRecentForm;
