import React, { useState, useEffect, useMemo } from 'react';
import { Match } from '../../types';
import { User } from 'firebase/auth';
import { FantasyTeam, FantasyPlayer, useFantasyTeam } from '../../utils/useFantasyTeam';
import { LuPlus, LuCheck, LuInfo } from 'react-icons/lu';
import { fetchScorecard } from '../../utils/dream11Predictor';
import WikiImage from '../WikiImage';
import { getTeamColor } from '../../utils/teamColors';

interface TeamBuilderProps {
    match: Match;
    user: User;
    existingTeam?: FantasyTeam;
    onBack: () => void;
}

const ROLES = ['WK', 'BAT', 'AR', 'BOWL'] as const;
const ROLE_LABELS: Record<string, string> = { WK: 'Wicket-Keeper', BAT: 'Batters', AR: 'All-Rounders', BOWL: 'Bowlers' };
const ROLE_EMOJI: Record<string, string> = { WK: '🧤', BAT: '🏏', AR: '⚡', BOWL: '🎳' };

interface RealPlayer {
    id: string;
    name: string;
    shortName: string;
    role: 'WK' | 'BAT' | 'AR' | 'BOWL';
    team: string;
    teamShort: string;
    skillName: string;
}

/* Map role using the same logic as dream11Predictor */
function mapRole(skillName: string, role: string, isKeeper: boolean): 'WK' | 'BAT' | 'AR' | 'BOWL' {
    if (isKeeper) return 'WK';
    const s = (skillName || '').toLowerCase();
    const r = (role || '').toLowerCase();
    if (s.includes('all') || r.includes('all')) return 'AR';
    if (s.includes('bowl') || r.includes('bowl')) return 'BOWL';
    if (s.includes('bat') || r.includes('bat')) return 'BAT';
    if (s.includes('wicket') || r.includes('keeper') || r.includes('wicket')) return 'WK';
    return 'BAT';
}

export default function TeamBuilder({ match, user, existingTeam, onBack }: TeamBuilderProps) {
    const { saveTeam } = useFantasyTeam(user);
    const [players, setPlayers] = useState<FantasyPlayer[]>(existingTeam?.players || []);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'WK' | 'BAT' | 'AR' | 'BOWL'>('WK');
    const [uiError, setUiError] = useState<string | null>(null);
    const [roster, setRoster] = useState<RealPlayer[]>([]);
    const [loadingRoster, setLoadingRoster] = useState(true);
    const [rosterError, setRosterError] = useState<string | null>(null);

    const t1 = match.participants?.[0];
    const t2 = match.participants?.[1];
    const team1Name = t1?.name || 'TBC';
    const team2Name = t2?.name || 'TBC';
    const c1 = getTeamColor(team1Name) || '#1a1a2e';
    const c2 = getTeamColor(team2Name) || '#1a1a2e';

    useEffect(() => {
        async function loadRoster() {
            setLoadingRoster(true);
            setRosterError(null);
            try {
                const scorecard = await fetchScorecard(match.game_id);
                if (!scorecard || !scorecard.Teams) throw new Error('No squads found for this match yet.');
                const all: RealPlayer[] = [];
                for (const [teamId, teamData] of Object.entries(scorecard.Teams) as [string, any][]) {
                    if (!teamData.Players) continue;
                    const teamShort = teamData.Name_Short || teamId;
                    for (const [playerId, pi] of Object.entries(teamData.Players) as [string, any][]) {
                        const isKeeper = (pi.Role || '').toLowerCase().includes('keeper') ||
                            (pi.Skill_Name || '').toLowerCase().includes('wicket');
                        const role = mapRole(pi.Skill_Name || '', pi.Role || '', isKeeper);
                        const fullName = pi.Name_Full || 'Unknown';
                        // Build short name: first initial + last name
                        const parts = fullName.split(' ');
                        const shortName = parts.length > 1
                            ? `${parts[0][0]}. ${parts.slice(1).join(' ')}`
                            : fullName;
                        all.push({
                            id: playerId,
                            name: fullName,
                            shortName,
                            role,
                            team: teamId,
                            teamShort,
                            skillName: pi.Skill_Name || pi.Role || '',
                        });
                    }
                }
                setRoster(all);
            } catch (err: any) {
                setRosterError(err.message || 'Failed to load squads');
            } finally {
                setLoadingRoster(false);
            }
        }
        loadRoster();
    }, [match.game_id]);

    const totalSelected = players.length;
    const roleCount = useMemo(() => {
        return players.reduce((acc, p) => { acc[p.role] = (acc[p.role] || 0) + 1; return acc; }, {} as Record<string, number>);
    }, [players]);

    const isMatchLocked = match.event_state !== 'U';

    const showError = (msg: string) => { setUiError(msg); setTimeout(() => setUiError(null), 3000); };

    const handleTogglePlayer = (id: string, role: any) => {
        if (isMatchLocked) return;
        setPlayers(prev => {
            if (prev.find(p => p.playerId === id)) return prev.filter(p => p.playerId !== id);
            if (prev.length >= 11) { showError('Maximum 11 players'); return prev; }
            if ((roleCount[role] || 0) >= 4) { showError(`Max 4 ${role} allowed`); return prev; }
            return [...prev, { playerId: id, role, isCaptain: false, isViceCaptain: false }];
        });
    };

    const handleSave = async () => {
        if (totalSelected !== 11) { showError('Select exactly 11 players'); return; }
        const missing = ROLES.filter(r => !roleCount[r]);
        if (missing.length) { showError(`Missing: ${missing.join(', ')}`); return; }
        setSaving(true);
        try { await saveTeam(match.game_id, players); onBack(); }
        catch (err: any) { showError('Failed: ' + err.message); }
        finally { setSaving(false); }
    };

    const filteredPlayers = roster.filter(p => p.role === activeTab);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', padding: '0 16px', paddingBottom: 120, maxWidth: 600, margin: '0 auto', width: '100%' }}>

            {/* Error Toast */}
            {uiError && (
                <div style={{
                    position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
                    background: '#ef4444', color: '#fff', padding: '10px 20px', borderRadius: 100,
                    fontWeight: 700, fontSize: 12, zIndex: 1000, display: 'flex', alignItems: 'center', gap: 6,
                }}>
                    <LuInfo size={14} /> {uiError}
                </div>
            )}

            {/* ── Formation Dots ── */}
            <div style={{
                padding: '14px 16px', borderRadius: 14, marginBottom: 16,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Squad
                    </span>
                    <span style={{
                        fontSize: 13, fontWeight: 900,
                        color: totalSelected === 11 ? '#4ade80' : '#fff',
                    }}>
                        {totalSelected}<span style={{ color: 'rgba(255,255,255,0.3)' }}>/11</span>
                    </span>
                </div>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                    {Array.from({ length: 11 }).map((_, i) => {
                        const filledPlayer = players[i];
                        let dotColor = 'rgba(255,255,255,0.08)';
                        if (filledPlayer) {
                            const rp = roster.find(r => r.id === filledPlayer.playerId);
                            if (rp) {
                                dotColor = rp.team === t1?.id ? c1 : c2;
                            } else {
                                dotColor = '#4ade80';
                            }
                        }
                        return (
                            <div key={i} style={{
                                width: 24, height: 24, borderRadius: 8,
                                background: dotColor,
                                border: filledPlayer ? 'none' : '1px solid rgba(255,255,255,0.08)',
                                transition: 'all 0.2s',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 9, fontWeight: 800, color: filledPlayer ? 'rgba(255,255,255,0.8)' : 'transparent',
                            }}>
                                {filledPlayer ? i + 1 : ''}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Role Tabs ── */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                {ROLES.map(r => {
                    const active = activeTab === r;
                    const count = roleCount[r] || 0;
                    const tabPlayers = roster.filter(p => p.role === r).length;
                    return (
                        <button key={r} onClick={() => setActiveTab(r)} style={{
                            flex: 1, padding: '10px 0', borderRadius: 12, border: 'none',
                            background: active ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.03)',
                            color: active ? '#fff' : 'rgba(255,255,255,0.4)',
                            fontWeight: 700, fontSize: 11, cursor: 'pointer',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                            transition: 'all 0.15s',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span>{ROLE_EMOJI[r]}</span>
                                <span>{r}</span>
                                {count > 0 && (
                                    <span style={{
                                        background: '#4ade80', color: '#000', fontSize: 8, fontWeight: 900,
                                        width: 14, height: 14, borderRadius: 5, display: 'flex',
                                        alignItems: 'center', justifyContent: 'center',
                                    }}>{count}</span>
                                )}
                            </div>
                            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>{tabPlayers} available</span>
                        </button>
                    );
                })}
            </div>

            {/* ── Section Title ── */}
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 10, fontWeight: 600 }}>
                {ROLE_LABELS[activeTab]} <span style={{ color: 'rgba(255,255,255,0.2)' }}>· Pick 1–4</span>
            </div>

            {/* ── Player List ── */}
            {loadingRoster ? (
                <div style={{ textAlign: 'center', padding: 50, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                    Loading squads…
                </div>
            ) : rosterError ? (
                <div style={{ textAlign: 'center', padding: 50, color: '#ef4444', fontSize: 13 }}>{rosterError}</div>
            ) : filteredPlayers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>
                    No {ROLE_LABELS[activeTab].toLowerCase()} in this squad
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {filteredPlayers.map(p => {
                        const isSelected = players.some(s => s.playerId === p.id);
                        const isTeam1 = p.team === t1?.id;
                        const teamColor = isTeam1 ? c1 : c2;

                        return (
                            <div
                                key={p.id}
                                onClick={() => handleTogglePlayer(p.id, p.role)}
                                style={{
                                    position: 'relative', overflow: 'hidden',
                                    borderRadius: 14, cursor: isMatchLocked ? 'default' : 'pointer',
                                    background: isSelected ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.025)',
                                    border: isSelected ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(255,255,255,0.05)',
                                    padding: '12px 14px',
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    transition: 'all 0.15s',
                                    opacity: isMatchLocked ? 0.5 : 1,
                                }}
                            >
                                {/* Team color accent strip */}
                                <div style={{
                                    position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                                    background: teamColor, borderRadius: '14px 0 0 14px',
                                }} />

                                {/* Player photo */}
                                <div style={{
                                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                                    background: 'rgba(255,255,255,0.05)', overflow: 'hidden',
                                    border: isSelected ? '2px solid #4ade80' : '2px solid rgba(255,255,255,0.08)',
                                    transition: 'all 0.15s',
                                }}>
                                    <WikiImage name={p.name} id={p.id} type="player"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} circle />
                                </div>

                                {/* Player Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontWeight: 700, fontSize: 13, color: '#fff',
                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                    }}>
                                        {p.shortName}
                                    </div>
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: 6, marginTop: 3,
                                    }}>
                                        <span style={{
                                            fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)',
                                            display: 'flex', alignItems: 'center', gap: 3,
                                        }}>
                                            <span style={{
                                                width: 6, height: 6, borderRadius: '50%', background: teamColor,
                                                display: 'inline-block',
                                            }} />
                                            {p.teamShort}
                                        </span>
                                        <span style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.08)' }} />
                                        <span style={{
                                            fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.25)',
                                            textTransform: 'capitalize',
                                        }}>
                                            {p.skillName.toLowerCase() || p.role}
                                        </span>
                                    </div>
                                </div>

                                {/* Add/Remove toggle */}
                                <div style={{
                                    width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: isSelected ? '#4ade80' : 'rgba(255,255,255,0.06)',
                                    color: isSelected ? '#000' : 'rgba(255,255,255,0.3)',
                                    transition: 'all 0.15s',
                                }}>
                                    {isSelected ? <LuCheck size={16} strokeWidth={3} /> : <LuPlus size={16} />}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Sticky Save CTA ── */}
            {!isMatchLocked && (
                <div style={{
                    position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
                    width: '100%', maxWidth: 600, padding: '0 16px', zIndex: 10,
                }}>
                    <button onClick={handleSave} disabled={saving || totalSelected !== 11} style={{
                        width: '100%', padding: '15px', borderRadius: 16, border: 'none',
                        fontSize: 14, fontWeight: 800, cursor: totalSelected === 11 ? 'pointer' : 'not-allowed',
                        background: totalSelected === 11
                            ? `linear-gradient(135deg, ${c1}, ${c2})`
                            : 'rgba(255,255,255,0.05)',
                        color: totalSelected === 11 ? '#fff' : 'rgba(255,255,255,0.25)',
                        transition: 'all 0.2s',
                        letterSpacing: '0.5px',
                    }}>
                        {saving ? 'Saving…' : totalSelected === 11 ? 'Lock Squad ✓' : `Select ${11 - totalSelected} more`}
                    </button>
                </div>
            )}
        </div>
    );
}
