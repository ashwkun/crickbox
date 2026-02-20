import React, { useState, useEffect, useMemo } from 'react';
import { Match, Scorecard } from '../../types';
import { User } from 'firebase/auth';
import { FantasyTeam, FantasyPlayer, useFantasyTeam } from '../../utils/useFantasyTeam';
import { LuChevronLeft, LuShield, LuSwords, LuStar, LuTrophy, LuInfo } from 'react-icons/lu';
import { fetchScorecard } from '../../utils/dream11Predictor';
import WikiImage from '../WikiImage';

interface TeamBuilderProps {
    match: Match;
    user: User;
    existingTeam?: FantasyTeam;
    onBack: () => void;
}

const ROLES = ['WK', 'BAT', 'AR', 'BOWL'] as const;

interface RealPlayer {
    id: string;
    name: string;
    role: 'WK' | 'BAT' | 'AR' | 'BOWL';
    team: string; // Team ID or name
}

export default function TeamBuilder({ match, user, existingTeam, onBack }: TeamBuilderProps) {
    const { saveTeam, loading: savingTeamLoading, error } = useFantasyTeam(user);
    const [players, setPlayers] = useState<FantasyPlayer[]>(existingTeam?.players || []);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'WK' | 'BAT' | 'AR' | 'BOWL'>('WK');
    const [uiError, setUiError] = useState<string | null>(null);

    const [roster, setRoster] = useState<RealPlayer[]>([]);
    const [loadingRoster, setLoadingRoster] = useState(true);
    const [rosterError, setRosterError] = useState<string | null>(null);

    // Fetch roster from scorecard API
    useEffect(() => {
        async function loadRoster() {
            setLoadingRoster(true);
            setRosterError(null);
            try {
                const scorecard = await fetchScorecard(match.game_id);
                if (!scorecard || !scorecard.Teams) {
                    throw new Error('No squads found for this match yet.');
                }

                const allPlayers: RealPlayer[] = [];

                for (const [teamId, teamData] of Object.entries(scorecard.Teams) as [string, any][]) {
                    if (!teamData.Players) continue;

                    for (const [playerId, playerInfo] of Object.entries(teamData.Players) as [string, any][]) {
                        // Determine role
                        let role: 'WK' | 'BAT' | 'AR' | 'BOWL' = 'BAT';
                        const pos = (playerInfo.Position || '').toLowerCase();

                        if (pos === '2' || pos === '8' || pos.includes('wicket')) role = 'WK';
                        else if (pos === '3' || pos === '4' || pos.includes('all')) role = 'AR';
                        else if (pos === '5' || pos === '6' || pos.includes('bowl')) role = 'BOWL';
                        else if (pos === '1' || pos === '7' || pos.includes('bat')) role = 'BAT';

                        allPlayers.push({
                            id: playerId,
                            name: playerInfo.Name_Full || `Unknown (${playerId})`,
                            role,
                            team: teamId
                        });
                    }
                }

                setRoster(allPlayers);
            } catch (err: any) {
                console.error("Error loading roster:", err);
                setRosterError(err.message || 'Failed to load squads');
            } finally {
                setLoadingRoster(false);
            }
        }

        loadRoster();
    }, [match.game_id]);

    // Stats
    const totalSelected = players.length;
    const roleCount = useMemo(() => {
        return players.reduce((acc, p) => {
            acc[p.role] = (acc[p.role] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [players]);

    const isMatchLocked = match.event_state !== 'U';

    const showError = (msg: string) => {
        setUiError(msg);
        setTimeout(() => setUiError(null), 3000);
    };

    const handleTogglePlayer = (id: string, role: any) => {
        if (isMatchLocked) return;

        setPlayers(prev => {
            const exists = prev.find(p => p.playerId === id);
            if (exists) {
                return prev.filter(p => p.playerId !== id);
            } else {
                if (prev.length >= 11) {
                    showError('Maximum 11 players allowed');
                    return prev;
                }
                // Constraints: 1-4 per role
                const currentRoleCount = roleCount[role] || 0;
                if (currentRoleCount >= 4) {
                    showError(`Maximum 4 ${role} allowed`);
                    return prev;
                }
                return [...prev, { playerId: id, role, isCaptain: false, isViceCaptain: false }];
            }
        });
    };

    const handleSave = async () => {
        if (totalSelected !== 11) {
            showError('Please select exactly 11 players');
            return;
        }

        // Validate minimum 1 per role
        const missingRoles = ROLES.filter(r => !roleCount[r]);
        if (missingRoles.length > 0) {
            showError(`You must select at least 1 player for each role. Missing: ${missingRoles.join(', ')}`);
            return;
        }

        setSaving(true);
        try {
            await saveTeam(match.game_id, players);
            onBack();
        } catch (err: any) {
            showError('Failed to save team: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            padding: '24px 20px',
            paddingBottom: 110,
            maxWidth: 600,
            margin: '0 auto',
            width: '100%',
            position: 'relative'
        }}>
            {uiError && (
                <div style={{
                    position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
                    background: '#ef4444', color: '#fff', padding: '12px 24px', borderRadius: 100,
                    fontWeight: 600, fontSize: 13, zIndex: 1000, display: 'flex', alignItems: 'center', gap: 8,
                    boxShadow: '0 10px 30px rgba(239, 68, 68, 0.3)'
                }}>
                    <LuInfo /> {uiError}
                </div>
            )}

            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                marginBottom: 24
            }}>
                <button
                    onClick={onBack}
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        padding: 8,
                        borderRadius: 12,
                        transition: 'all 0.2s'
                    }}
                >
                    <LuChevronLeft size={20} />
                </button>
                <div>
                    <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>Build Squad</h2>
                    <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                        {match.participants?.[0]?.short_name} vs {match.participants?.[1]?.short_name}
                    </p>
                </div>
            </div>

            {/* Constraints Bar */}
            <div style={{
                padding: '16px',
                background: 'linear-gradient(135deg, rgba(236,72,153,0.1), rgba(255,255,255,0.02))',
                borderRadius: 16,
                border: '1px solid rgba(236,72,153,0.15)',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 12,
                color: 'rgba(255,255,255,0.6)',
                marginBottom: 24
            }}>
                <div>Players: <strong style={{ color: totalSelected === 11 ? '#22c55e' : '#fff' }}>{totalSelected}/11</strong></div>
                <div style={{ display: 'flex', gap: 12 }}>
                    {ROLES.map(r => (
                        <span key={r} style={{ color: (roleCount[r] || 0) < 1 ? '#ef4444' : '#fff' }}>
                            {r}: {roleCount[r] || 0}
                        </span>
                    ))}
                </div>
            </div>

            {/* Role Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {ROLES.map(r => (
                    <button
                        key={r}
                        onClick={() => setActiveTab(r)}
                        style={{
                            flex: 1,
                            padding: '10px 0',
                            background: activeTab === r ? '#ec4899' : 'rgba(255,255,255,0.05)',
                            border: '1px solid',
                            borderColor: activeTab === r ? '#ec4899' : 'rgba(255,255,255,0.1)',
                            borderRadius: 12,
                            color: activeTab === r ? '#fff' : 'rgba(255,255,255,0.5)',
                            fontWeight: activeTab === r ? 700 : 600,
                            fontSize: 13,
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 4,
                            transition: 'all 0.2s'
                        }}
                    >
                        {r === 'BAT' ? <LuSwords size={16} /> :
                            r === 'BOWL' ? <LuStar size={16} /> :
                                r === 'WK' ? <LuShield size={16} /> :
                                    <LuTrophy size={16} />}
                        {r}
                    </button>
                ))}
            </div>

            {/* Player List */}
            <div style={{ flex: 1, overflowY: 'visible' }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '8px 0 16px' }}>
                    Select 1-4 {activeTab}s.
                </p>

                {loadingRoster ? (
                    <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.4)' }}>
                        Loading squads...
                    </div>
                ) : rosterError ? (
                    <div style={{ textAlign: 'center', padding: 40, color: '#ef4444' }}>
                        {rosterError}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {roster.filter(p => p.role === activeTab).map(p => {
                            const isSelected = players.some(sel => sel.playerId === p.id);
                            return (
                                <div
                                    key={p.id}
                                    onClick={() => handleTogglePlayer(p.id, p.role)}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '16px',
                                        borderRadius: 12,
                                        background: isSelected ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.02)',
                                        border: isSelected ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                                        cursor: isMatchLocked ? 'default' : 'pointer',
                                        opacity: isMatchLocked ? 0.6 : 1
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                            <WikiImage name={p.name} id={p.id} type="player" style={{ width: '100%', height: '100%', objectFit: 'cover' }} circle />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: 15, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                {p.name}
                                                {activeTab === 'BAT' && <LuSwords size={12} color="rgba(255,255,255,0.4)" />}
                                                {activeTab === 'BOWL' && <LuStar size={12} color="rgba(255,255,255,0.4)" />}
                                                {activeTab === 'WK' && <LuShield size={12} color="rgba(255,255,255,0.4)" />}
                                                {activeTab === 'AR' && <LuTrophy size={12} color="rgba(255,255,255,0.4)" />}
                                            </div>
                                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                                                <div style={{
                                                    width: 8, height: 8, borderRadius: '50%',
                                                    background: p.team === match.participants?.[0]?.id ? '#ec4899' : '#3b82f6'
                                                }} />
                                                {p.team === match.participants?.[0]?.id ? match.participants?.[0]?.short_name : match.participants?.[1]?.short_name || 'Team'}
                                            </div>
                                        </div>
                                    </div>
                                    {isSelected && (
                                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            ✓
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer */}
            {!isMatchLocked && (
                <div style={{
                    position: 'fixed',
                    bottom: 80, // Above bottom nav
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '100%',
                    maxWidth: 600,
                    padding: '0 20px',
                    zIndex: 10
                }}>
                    <button
                        onClick={handleSave}
                        disabled={saving || totalSelected !== 11}
                        style={{
                            width: '100%',
                            padding: '16px',
                            background: totalSelected === 11 ? 'linear-gradient(135deg, #ec4899, #f9a8d4)' : 'rgba(30,30,30,0.9)',
                            backdropFilter: 'blur(10px)',
                            color: totalSelected === 11 ? '#fff' : 'rgba(255,255,255,0.3)',
                            border: totalSelected === 11 ? 'none' : '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 100,
                            fontSize: 16,
                            fontWeight: 700,
                            cursor: totalSelected === 11 ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s',
                            boxShadow: totalSelected === 11 ? '0 10px 30px rgba(236,72,153,0.3)' : '0 10px 30px rgba(0,0,0,0.5)'
                        }}
                    >
                        {saving ? 'Saving...' : `Save Draft (${totalSelected}/11)`}
                    </button>
                </div>
            )}
        </div>
    );
}
