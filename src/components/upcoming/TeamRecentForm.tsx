import React, { useEffect, useState } from 'react';
import { getTeamMatches, Match } from '../../utils/matchDatabase';
import WikiImage from '../WikiImage';

interface TeamRecentFormProps {
    teamId: string;
    teamName: string;
    currentFormat?: string;
    onMatchClick?: (gameId: string) => void;
}

const TeamRecentForm: React.FC<TeamRecentFormProps> = ({ teamId, teamName, currentFormat, onMatchClick }) => {
    const [allMatches, setAllMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchForm = async () => {
            if (!teamId) return;
            setLoading(true);
            try {
                // Fetch deep history (limit=50) to allow proper filtering
                const matches = await getTeamMatches(teamId, 50);
                setAllMatches(matches);
            } catch (err) {
                console.error("Error fetching team form", err);
            } finally {
                setLoading(false);
            }
        };

        fetchForm();
    }, [teamId]);

    if (loading) return (
        <div style={{
            background: 'var(--bg-card)',
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
            border: '1px solid var(--border-color)',
            minHeight: 120,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></div>
        </div>
    );

    // Helpers
    const getResult = (m: Match, tId: string) => {
        if (!m.winner_id) return 'D';
        if (m.winner_id === tId) return 'W';
        return 'L';
    };

    const getResultColor = (res: string) => {
        if (res === 'W') return '#22c55e'; // Green
        if (res === 'L') return '#ef4444'; // Red
        return '#94a3b8'; // Grey for Draw/NR
    };

    // Filter Logic
    const allForm = allMatches.slice(0, 5);

    // Normalize format comparison (e.g. "T20" includes "T20I", "International T20")
    const formatKey = currentFormat?.toLowerCase() || '';
    const isTest = formatKey.includes('test');
    const isOdi = formatKey.includes('odi');
    const isT20 = formatKey.includes('t20');

    const currentForm = allMatches.filter(m => {
        if (!currentFormat) return true;
        const mFormat = m.event_format?.toLowerCase() || '';

        if (isTest) return mFormat.includes('test');
        if (isOdi) return mFormat.includes('odi');
        if (isT20) return mFormat.includes('t20');

        return mFormat === formatKey;
    }).slice(0, 5);

    const renderPills = (matches: Match[], label: string) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{label}</span>
            <div style={{ display: 'flex', gap: 6 }}>
                {matches.length > 0 ? matches.map((m, i) => {
                    const res = getResult(m, teamId);
                    return (
                        <div
                            key={m.game_id || i}
                            onClick={() => onMatchClick?.(m.game_id)}
                            style={{
                                width: 24,
                                height: 24,
                                borderRadius: 6,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: `rgba(${res === 'W' ? '34, 197, 94' : res === 'L' ? '239, 68, 68' : '148, 163, 184'}, 0.15)`,
                                color: getResultColor(res),
                                fontSize: 10,
                                fontWeight: 700,
                                cursor: onMatchClick ? 'pointer' : 'default',
                                border: `1px solid ${getResultColor(res)}40`
                            }}
                        >
                            {res}
                        </div>
                    );
                }) : (
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>-</span>
                )}
            </div>
        </div>
    );

    return (
        <div style={{
            background: 'var(--bg-card)',
            borderRadius: 16,
            padding: '16px',
            marginBottom: 12,
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12
        }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 12 }}>
                <WikiImage
                    name={teamName}
                    id={teamId}
                    type="team"
                    style={{ width: 28, height: 28 }}
                    circle={true}
                />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{teamName}</span>
            </div>

            {/* Content */}
            <div>
                {renderPills(currentForm, `Current (${currentFormat || 'Recent'})`)}
                {renderPills(allForm, 'All Formats')}
            </div>
        </div>
    );
};

export default TeamRecentForm;
