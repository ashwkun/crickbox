import React, { useState, useEffect, useMemo } from 'react';
import { Match } from '../../types';
import { User } from 'firebase/auth';
import { FantasyTeam, FantasyPlayer, useFantasyTeam } from '../../utils/useFantasyTeam';
import { LuChevronLeft, LuPlus, LuCheck, LuInfo, LuChevronRight } from 'react-icons/lu';
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
const ROLE_LABELS: Record<string, string> = { WK: 'Keeper', BAT: 'Batters', AR: 'All-Round', BOWL: 'Bowlers' };

interface RealPlayer {
    id: string;
    name: string;
    role: 'WK' | 'BAT' | 'AR' | 'BOWL';
    team: string;
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
                    for (const [playerId, pi] of Object.entries(teamData.Players) as [string, any][]) {
                        let role: 'WK' | 'BAT' | 'AR' | 'BOWL' = 'BAT';
                        const pos = (pi.Position || '').toLowerCase();
                        if (pos === '2' || pos === '8' || pos.includes('wicket')) role = 'WK';
                        else if (pos === '3' || pos === '4' || pos.includes('all')) role = 'AR';
                        else if (pos === '5' || pos === '6' || pos.includes('bowl')) role = 'BOWL';
                        else if (pos === '1' || pos === '7' || pos.includes('bat')) role = 'BAT';
                        all.push({ id: playerId, name: pi.Name_Full || `Unknown`, role, team: teamId });
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

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', padding: '20px 16px', paddingBottom: 120, maxWidth: 600, margin: '0 auto', width: '100%' }}>

            {/* Error Toast */}
            {uiError && (
                <div style={{
                    position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
                    background: '#ef4444', color: '#fff', padding: '10px 20px', borderRadius: 100,
                    fontWeight: 700, fontSize: 12, zIndex: 1000, display: 'flex', alignItems: 'center', gap: 6,
                }}>
                    <LuInfo size={14} /> {uiError}
                </div>
            )}

            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <button onClick={onBack} style={{
                    background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff',
                    cursor: 'pointer', display: 'flex', padding: 8, borderRadius: 12,
                }}>
                    <LuChevronLeft size={20} />
                </button>
                <div style={{ flex: 1 }}>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px', color: '#fff' }}>Build Your XI</h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28 }}>
                        <WikiImage name={team1Name} id={t1?.id} type="team" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>vs</span>
                    <div style={{ width: 28, height: 28 }}>
                        <WikiImage name={team2Name} id={t2?.id} type="team" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                </div>
            </div>

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
                        // Color the dot based on which player filled it
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
                    return (
                        <button key={r} onClick={() => setActiveTab(r)} style={{
                            flex: 1, padding: '10px 0', borderRadius: 12, border: 'none',
                            background: active ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.03)',
                            color: active ? '#fff' : 'rgba(255,255,255,0.4)',
                            fontWeight: 700, fontSize: 12, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                            transition: 'all 0.15s',
                        }}>
                            {r}
                            {count > 0 && (
                                <span style={{
                                    background: '#4ade80', color: '#000', fontSize: 9, fontWeight: 900,
                                    width: 16, height: 16, borderRadius: 6, display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                }}>{count}</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ── Subtitle ── */}
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 12, padding: '0 2px' }}>
                {ROLE_LABELS[activeTab]} · Pick 1–4
            </div>

            {/* ── Player Grid ── */}
            {loadingRoster ? (
                <div style={{ textAlign: 'center', padding: 50, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                    Loading squads…
                </div>
            ) : rosterError ? (
                <div style={{ textAlign: 'center', padding: 50, color: '#ef4444', fontSize: 13 }}>{rosterError}</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {roster.filter(p => p.role === activeTab).map(p => {
                        const isSelected = players.some(s => s.playerId === p.id);
                        const isTeam1 = p.team === t1?.id;
                        const teamColor = isTeam1 ? c1 : c2;
                        const teamShort = isTeam1 ? (t1?.short_name || 'T1') : (t2?.short_name || 'T2');

                        return (
                            <div
                                key={p.id}
                                onClick={() => handleTogglePlayer(p.id, p.role)}
                                style={{
                                    position: 'relative', overflow: 'hidden',
                                    borderRadius: 14, cursor: isMatchLocked ? 'default' : 'pointer',
                                    background: isSelected ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.025)',
                                    border: isSelected ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(255,255,255,0.05)',
                                    padding: '14px 12px',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
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
                                    width: 48, height: 48, borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.05)', overflow: 'hidden',
                                    border: isSelected ? '2px solid #4ade80' : '2px solid transparent',
                                    transition: 'all 0.15s',
                                }}>
                                    <WikiImage name={p.name} id={p.id} type="player"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} circle />
                                </div>

                                {/* Name */}
                                <div style={{
                                    fontWeight: 700, fontSize: 12, color: '#fff', textAlign: 'center',
                                    lineHeight: 1.2, maxWidth: '100%',
                                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                }}>
                                    {p.name.split(' ').slice(-1)[0]}
                                </div>

                                {/* Team badge */}
                                <div style={{
                                    fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)',
                                    display: 'flex', alignItems: 'center', gap: 4,
                                    textTransform: 'uppercase', letterSpacing: '0.5px',
                                }}>
                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: teamColor }} />
                                    {teamShort}
                                </div>

                                {/* Add/Remove toggle */}
                                <div style={{
                                    width: 28, height: 28, borderRadius: 8,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: isSelected ? '#4ade80' : 'rgba(255,255,255,0.06)',
                                    color: isSelected ? '#000' : 'rgba(255,255,255,0.3)',
                                    transition: 'all 0.15s',
                                }}>
                                    {isSelected ? <LuCheck size={14} strokeWidth={3} /> : <LuPlus size={14} />}
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
