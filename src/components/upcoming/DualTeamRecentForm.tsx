import React, { useEffect, useState } from 'react';
import { getTeamMatches, Match } from '../../utils/matchDatabase';
import WikiImage from '../WikiImage';

interface TeamInfo {
    id: string;
    name: string;
    short_name?: string;
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
            // Check match_type (DB) or event_format (API)
            const mFormat = (m.match_type || m.event_format || '').toLowerCase();
            const targetFormat = currentFormat.toLowerCase();

            // Common variations
            if (isTest) return mFormat.includes('test');
            if (isOdi) return mFormat.includes('odi') || mFormat.includes('one day');
            if (isT20) return mFormat.includes('t20') || mFormat.includes('twenty20');

            // Fallback: Check if either string allows the other
            return mFormat.includes(targetFormat) || targetFormat.includes(mFormat);
        }).slice(0, 5);

        return { allForm, currentForm };
    };

    const { allForm: t1All, currentForm: t1Curr } = filterMatches(matches1);
    const { allForm: t2All, currentForm: t2Curr } = filterMatches(matches2);

    // --- Renderers ---
    const renderPills = (matches: Match[], tId: string) => (
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
                            borderRadius: 4,
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
    );

    const renderTeamColumn = (team: TeamInfo, current: Match[], all: Match[], isRedundant: boolean) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, alignItems: 'center' }}>
            {/* Header: Team Short Name */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '0.5px' }}>
                    {team.short_name || team.name}
                </span>
            </div>

            {/* Stats Stack */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', alignItems: 'center' }}>
                {isRedundant ? (
                    // SINGLE ROW
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        {renderPills(all, team.id)}
                    </div>
                ) : (
                    // DUAL ROWS (Stacked)
                    <>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase' }}>
                                {(currentFormat || 'Recent').replace(/current\s*|\(|\)/gi, '')}
                            </span>
                            {renderPills(current, team.id)}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase' }}>ALL</span>
                            {renderPills(all, team.id)}
                        </div>
                    </>
                )}
            </div>
        </div>
    );


    // Check redundancy logic (Symmetric) - Using same logic as before but applied to new layout
    const isT1Redundant = t1Curr.length === t1All.length &&
        t1Curr.every((m, i) => m.game_id === t1All[i]?.game_id || m.id === t1All[i]?.id);

    const isT2Redundant = t2Curr.length === t2All.length &&
        t2Curr.every((m, i) => m.game_id === t2All[i]?.game_id || m.id === t2All[i]?.id);

    // DEBUG LOGS
    // DEBUG LOGS
    console.log(`[RecentForm DEBUG] Format Received: "${currentFormat}"`);
    console.log(`[RecentForm DEBUG] ${team1.short_name} (ID: ${team1.id})`);
    console.log(`  - Total Matches Fetched: ${matches1.length}`);

    // Compare IDs one by one
    const mismatchIndex = t1Curr.findIndex((m, i) => m.id !== t1All[i]?.id);
    console.log(`  - Mismatch Index: ${mismatchIndex}`);
    if (mismatchIndex !== -1) {
        console.log(`    Curr[${mismatchIndex}]: ${t1Curr[mismatchIndex]?.match_type} (${t1Curr[mismatchIndex]?.id})`);
        console.log(`    All[${mismatchIndex}]: ${t1All[mismatchIndex]?.match_type} (${t1All[mismatchIndex]?.id})`);
    }

    console.log(`  - Redundant (Calc): ${isT1Redundant}`);
    console.log(`  - Redundant (Str): "${String(isT1Redundant)}"`);
    console.log(`  - useCompactMode (Final): ${isT1Redundant && isT2Redundant}`);

    // Enforce symmetry: Only compact if BOTH are redundant
    const useCompactMode = isT1Redundant && isT2Redundant;


    return (
        <div className="h2h-card" style={{ marginTop: 12 }}>
            <div className="h2h-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                Recent Form
            </div>

            <div className="h2h-content" style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', paddingTop: 16, paddingBottom: 16 }}>

                {/* Team 1 Column */}
                {renderTeamColumn(team1, t1Curr, t1All, useCompactMode)}

                {/* Vertical Divider */}
                <div style={{ width: 1, background: 'rgba(255,255,255,0.1)', alignSelf: 'stretch', margin: '0 8px' }}></div>

                {/* Team 2 Column */}
                {renderTeamColumn(team2, t2Curr, t2All, useCompactMode)}

            </div>
        </div>
    );
};

export default DualTeamRecentForm;
