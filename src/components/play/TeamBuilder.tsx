import React, { useState, useEffect, useMemo } from 'react';
import { Match } from '../../types';
import { User } from 'firebase/auth';
import { FantasyTeam, FantasyPlayer, useFantasyTeam } from '../../utils/useFantasyTeam';
import { LuCheck, LuInfo, LuChevronLeft, LuCrown, LuStar, LuTrophy, LuTriangleAlert } from 'react-icons/lu';
import { fetchScorecard } from '../../utils/dream11Predictor';
import WikiImage from '../WikiImage';
import { getTeamColor } from '../../utils/teamColors';
import { supabase } from '../../utils/supabaseClient';

interface TeamBuilderProps {
    match: Match;
    user: User;
    existingTeam?: FantasyTeam;
    onBack: () => void;
    onTeamSaved?: () => void;
}

// Dream11 exact rules
const ROLES = ['WK', 'BAT', 'AR', 'BOWL'] as const;
const ROLE_LIMITS: Record<string, { min: number }> = {
    WK: { min: 1 },
    BAT: { min: 1 },
    AR: { min: 1 },
    BOWL: { min: 1 },
};

interface RealPlayer {
    id: string;
    name: string;
    shortName: string;
    role: 'WK' | 'BAT' | 'AR' | 'BOWL';
    team: string;
    teamShort: string;
}

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

type Step = 'select' | 'captain' | 'success';

// Helper: given team IDs, fetch each team's last completed match and return the set of player IDs that played
async function fetchLastMatchPlayers(teamIds: string[], callback: (ids: Set<string>) => void) {
    try {
        const allPlayerIds = new Set<string>();
        for (const teamId of teamIds) {
            const { data } = await supabase
                .from('matches')
                .select('id')
                .or(`teama_id.eq.${teamId},teamb_id.eq.${teamId}`)
                .lt('match_date', new Date().toISOString().split('T')[0])
                .order('match_date', { ascending: false })
                .limit(1);
            if (!data?.length) continue;
            const lastMatchId = data[0].id;
            const sc = await fetchScorecard(lastMatchId);
            if (!sc?.Teams) continue;
            for (const teamData of Object.values(sc.Teams) as any[]) {
                if (teamData.Players) {
                    for (const playerId of Object.keys(teamData.Players)) {
                        allPlayerIds.add(playerId);
                    }
                }
            }
        }
        callback(allPlayerIds);
    } catch { /* silently fail — last match data is non-critical */ }
}

export default function TeamBuilder({ match, user, existingTeam, onBack, onTeamSaved }: TeamBuilderProps) {
    const { saveTeam } = useFantasyTeam(user);
    const [players, setPlayers] = useState<FantasyPlayer[]>(existingTeam?.players || []);
    const [saving, setSaving] = useState(false);
    const [step, setStep] = useState<Step>('select');
    const [activeTab, setActiveTab] = useState<typeof ROLES[number]>('WK');
    const [uiError, setUiError] = useState<string | null>(null);
    const [roster, setRoster] = useState<RealPlayer[]>([]);
    const [loadingRoster, setLoadingRoster] = useState(true);
    const [rosterError, setRosterError] = useState<string | null>(null);
    const [lineupConfirmed, setLineupConfirmed] = useState(false);
    const [playedLastMatch, setPlayedLastMatch] = useState<Set<string>>(new Set());

    const t1 = match.participants?.[0];
    const t2 = match.participants?.[1];
    const team1Name = t1?.name || 'TBC';
    const team2Name = t2?.name || 'TBC';
    const t1Short = t1?.short_name || team1Name.slice(0, 3).toUpperCase();
    const t2Short = t2?.short_name || team2Name.slice(0, 3).toUpperCase();
    const c1 = getTeamColor(team1Name) || '#3b82f6';
    const c2 = getTeamColor(team2Name) || '#ef4444';

    useEffect(() => {
        async function loadRoster() {
            setLoadingRoster(true);
            setRosterError(null);
            try {
                const scorecard = await fetchScorecard(match.game_id);
                if (!scorecard?.Teams) throw new Error('No squads available yet.');

                // Lineup_status: 0 = full squad (not announced), >=1 = Playing 11 confirmed
                const lineupStatus = scorecard.Matchdetail?.Lineup_status ?? 0;
                setLineupConfirmed(lineupStatus >= 1);

                const all: RealPlayer[] = [];
                for (const [teamId, teamData] of Object.entries(scorecard.Teams) as [string, any][]) {
                    if (!teamData.Players) continue;
                    const teamShort = teamData.Name_Short || teamId;
                    for (const [playerId, pi] of Object.entries(teamData.Players) as [string, any][]) {
                        const isKeeper = (pi.Role || '').toLowerCase().includes('keeper') ||
                            (pi.Skill_Name || '').toLowerCase().includes('wicket');
                        const role = mapRole(pi.Skill_Name || '', pi.Role || '', isKeeper);
                        const fullName = pi.Name_Full || 'Unknown';
                        const parts = fullName.split(' ');
                        const shortName = parts.length > 1 ? `${parts[0][0]}. ${parts.slice(1).join(' ')}` : fullName;
                        all.push({ id: playerId, name: fullName, shortName, role, team: teamId, teamShort });
                    }
                }
                setRoster(all);

                // Fetch last-match played status for each team
                fetchLastMatchPlayers(
                    Object.keys(scorecard.Teams),
                    (ids) => setPlayedLastMatch(ids)
                );
            } catch (err: any) {
                setRosterError(err.message || 'Failed to load squads');
            } finally {
                setLoadingRoster(false);
            }
        }
        loadRoster();
    }, [match.game_id]);

    const totalSelected = players.length;
    const roleCount = useMemo(() =>
        players.reduce((a, p) => { a[p.role] = (a[p.role] || 0) + 1; return a; }, {} as Record<string, number>),
        [players]);

    const team1Count = useMemo(() =>
        players.filter(p => roster.find(r => r.id === p.playerId)?.team === t1?.id).length,
        [players, roster, t1?.id]);
    const team2Count = useMemo(() =>
        players.filter(p => roster.find(r => r.id === p.playerId)?.team === t2?.id).length,
        [players, roster, t2?.id]);

    const isMatchLocked = new Date(match.start_date).getTime() <= Date.now();
    const showError = (msg: string) => { setUiError(msg); setTimeout(() => setUiError(null), 2500); };

    const captain = players.find(p => p.isCaptain);
    const viceCaptain = players.find(p => p.isViceCaptain);

    const handleToggle = (id: string, role: any) => {
        if (isMatchLocked) return;
        setPlayers(prev => {
            if (prev.find(p => p.playerId === id)) return prev.filter(p => p.playerId !== id);
            if (prev.length >= 11) { showError('Max 11 players'); return prev; }
            const rp = roster.find(r => r.id === id);
            if (rp) {
                const ct = prev.filter(p => roster.find(r => r.id === p.playerId)?.team === rp.team).length;
                if (ct >= 10) { showError('Max 10 from one team'); return prev; }
            }
            return [...prev, { playerId: id, role, isCaptain: false, isViceCaptain: false }];
        });
    };

    const handleSetCaptain = (id: string) => {
        setPlayers(prev => prev.map(p => ({
            ...p,
            isCaptain: p.playerId === id,
            isViceCaptain: p.playerId === id ? false : p.isViceCaptain,
        })));
    };

    const handleSetVC = (id: string) => {
        setPlayers(prev => prev.map(p => ({
            ...p,
            isViceCaptain: p.playerId === id,
            isCaptain: p.playerId === id ? false : p.isCaptain,
        })));
    };

    const isSquadReady = totalSelected === 11;

    const handleNextStep = () => {
        if (!isSquadReady) {
            showError(`Select ${11 - totalSelected} more player${11 - totalSelected !== 1 ? 's' : ''}`);
            return;
        }
        setStep('captain');
    };

    const handleSave = async () => {
        if (!captain || !viceCaptain) { showError('Select Captain and Vice-Captain'); return; }
        setSaving(true);
        try { await saveTeam(match.game_id, players); setStep('success'); }
        catch (err: any) { showError('Failed: ' + err.message); }
        finally { setSaving(false); }
    };

    const filtered = roster.filter(p => p.role === activeTab);

    // ═══════════════ SUCCESS SCREEN ═══════════════
    if (step === 'success') {
        const captainPlayer = roster.find(r => r.id === captain?.playerId);
        const vcPlayer = roster.find(r => r.id === viceCaptain?.playerId);

        return (
            <div style={{ maxWidth: 600, margin: '0 auto', width: '100%', padding: '40px 16px 180px', textAlign: 'center' }}>
                {/* Checkmark */}
                <div style={{
                    width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px',
                    background: 'rgba(236,72,153,0.12)', border: '2px solid rgba(236,72,153,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <LuCheck size={32} color="#ec4899" strokeWidth={3} />
                </div>

                <div style={{ fontWeight: 800, fontSize: 18, color: '#fff', marginBottom: 6 }}>Squad Locked!</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 600, marginBottom: 28 }}>
                    {totalSelected} players selected
                </div>

                {/* C/VC summary */}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 32 }}>
                    {[{ label: 'Captain', player: captainPlayer, color: '#f59e0b', mult: '2x' },
                    { label: 'Vice-Captain', player: vcPlayer, color: '#818cf8', mult: '1.5x' }].map(({ label, player, color, mult }) => (
                        <div key={label} style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                            padding: '16px 20px', borderRadius: 16,
                            background: `${color}08`, border: `1px solid ${color}20`,
                        }}>
                            <div style={{ position: 'relative' }}>
                                <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', border: `2.5px solid ${color}` }}>
                                    <WikiImage name={player?.name || ''} id={player?.id || ''} type="player"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} circle />
                                </div>
                                <div style={{
                                    position: 'absolute', bottom: -3, right: -3,
                                    background: color, color: '#000', fontSize: 8, fontWeight: 900,
                                    width: 20, height: 20, borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>{mult}</div>
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{player?.shortName}</span>
                            <span style={{ fontSize: 8, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 300, margin: '0 auto' }}>
                    <button onClick={() => { setStep('select'); }} style={{
                        width: '100%', padding: '13px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)',
                        background: 'rgba(255,255,255,0.04)', color: '#fff',
                        fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    }}>
                        Edit Squad
                    </button>
                    <button onClick={onTeamSaved || onBack} style={{
                        width: '100%', padding: '13px', borderRadius: 14, border: 'none',
                        background: '#ec4899', color: '#fff',
                        fontSize: 12, fontWeight: 800, cursor: 'pointer',
                    }}>
                        Join / Create a League
                    </button>
                    <button onClick={onBack} style={{
                        width: '100%', padding: '13px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)',
                        background: 'transparent', color: 'rgba(255,255,255,0.5)',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}>
                        Back to Matches
                    </button>
                </div>
            </div>
        );
    }

    // ═══════════════ CAPTAIN SELECTION STEP ═══════════════
    if (step === 'captain') {
        return (
            <div style={{ maxWidth: 600, margin: '0 auto', width: '100%', paddingBottom: 180 }}>
                {/* Error toast */}
                {uiError && (
                    <div style={{
                        position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
                        background: '#ef4444', color: '#fff', padding: '8px 18px', borderRadius: 100,
                        fontWeight: 700, fontSize: 11, zIndex: 1000, display: 'flex', alignItems: 'center', gap: 6,
                        boxShadow: '0 4px 20px rgba(239,68,68,0.4)',
                    }}>
                        <LuInfo size={13} /> {uiError}
                    </div>
                )}



                {/* Header */}
                <div style={{ padding: '14px 16px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button onClick={() => setStep('select')} style={{
                        background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 10,
                        width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: '#fff', flexShrink: 0,
                    }}>
                        <LuChevronLeft size={16} />
                    </button>
                    <div style={{ fontWeight: 800, fontSize: 14, color: '#fff' }}>Pick your Captain & Vice-Captain</div>
                </div>

                {/* C/VC selection cards */}
                <div style={{ display: 'flex', gap: 10, margin: '8px 16px 16px' }}>
                    {/* Captain card */}
                    <div style={{
                        flex: 1, padding: '16px 12px', borderRadius: 16, textAlign: 'center',
                        background: captain ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.02)',
                        border: captain ? '1.5px solid rgba(245,158,11,0.2)' : '1px solid rgba(255,255,255,0.05)',
                        transition: 'all 0.2s',
                    }}>
                        {captain ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', border: '2.5px solid #f59e0b' }}>
                                        <WikiImage name={roster.find(r => r.id === captain.playerId)?.name || ''} id={captain.playerId} type="player"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} circle />
                                    </div>
                                    <div style={{
                                        position: 'absolute', bottom: -4, right: -4,
                                        background: '#f59e0b', color: '#000', fontSize: 9, fontWeight: 900,
                                        width: 22, height: 22, borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>2x</div>
                                </div>
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>
                                    {roster.find(r => r.id === captain.playerId)?.shortName}
                                </span>
                            </div>
                        ) : (
                            <div style={{ padding: '8px 0' }}>
                                <div style={{ width: 52, height: 52, borderRadius: '50%', border: '2px dashed rgba(245,158,11,0.3)', margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ fontSize: 16, fontWeight: 900, color: 'rgba(245,158,11,0.4)' }}>C</span>
                                </div>
                                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>Captain (2x pts)</span>
                            </div>
                        )}
                    </div>

                    {/* VC card */}
                    <div style={{
                        flex: 1, padding: '16px 12px', borderRadius: 16, textAlign: 'center',
                        background: viceCaptain ? 'rgba(129,140,248,0.08)' : 'rgba(255,255,255,0.02)',
                        border: viceCaptain ? '1.5px solid rgba(129,140,248,0.2)' : '1px solid rgba(255,255,255,0.05)',
                        transition: 'all 0.2s',
                    }}>
                        {viceCaptain ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                                <div style={{ position: 'relative' }}>
                                    <div style={{ width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', border: '2.5px solid #818cf8' }}>
                                        <WikiImage name={roster.find(r => r.id === viceCaptain.playerId)?.name || ''} id={viceCaptain.playerId} type="player"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} circle />
                                    </div>
                                    <div style={{
                                        position: 'absolute', bottom: -4, right: -4,
                                        background: '#818cf8', color: '#000', fontSize: 8, fontWeight: 900,
                                        width: 22, height: 22, borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>1.5x</div>
                                </div>
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>
                                    {roster.find(r => r.id === viceCaptain.playerId)?.shortName}
                                </span>
                            </div>
                        ) : (
                            <div style={{ padding: '8px 0' }}>
                                <div style={{ width: 52, height: 52, borderRadius: '50%', border: '2px dashed rgba(129,140,248,0.3)', margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ fontSize: 14, fontWeight: 900, color: 'rgba(129,140,248,0.4)' }}>VC</span>
                                </div>
                                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>Vice-Captain (1.5x pts)</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Player list for C/VC selection */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '0 16px' }}>
                    {players.map(p => {
                        const rp = roster.find(r => r.id === p.playerId);
                        if (!rp) return null;
                        const isC = p.isCaptain;
                        const isVC = p.isViceCaptain;
                        const tc = rp.team === t1?.id ? c1 : c2;

                        return (
                            <div key={p.playerId} style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '10px 12px', borderRadius: 14,
                                background: isC ? 'rgba(245,158,11,0.06)' : isVC ? 'rgba(129,140,248,0.06)' : 'rgba(255,255,255,0.02)',
                                border: isC ? '1px solid rgba(245,158,11,0.2)' : isVC ? '1px solid rgba(129,140,248,0.2)' : '1px solid rgba(255,255,255,0.04)',
                            }}>
                                {/* Photo */}
                                <div style={{
                                    width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                                    border: `2px solid ${tc}40`,
                                }}>
                                    <WikiImage name={rp.name} id={rp.id} type="player"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} circle />
                                </div>

                                {/* Name */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, fontSize: 12, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {rp.name}
                                    </div>
                                    <div style={{ fontSize: 9, fontWeight: 700, color: tc, opacity: 0.6, marginTop: 1 }}>
                                        {rp.teamShort} · {rp.role}
                                    </div>
                                </div>

                                {/* C button */}
                                <button onClick={(e) => { e.stopPropagation(); handleSetCaptain(p.playerId); }} style={{
                                    width: 32, height: 32, borderRadius: '50%',
                                    cursor: 'pointer',
                                    background: isC ? '#f59e0b' : 'rgba(255,255,255,0.05)',
                                    color: isC ? '#000' : 'rgba(255,255,255,0.3)',
                                    fontWeight: 900, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.15s',
                                    border: isC ? 'none' : '1px solid rgba(255,255,255,0.08)',
                                }}>
                                    C
                                </button>

                                {/* VC button */}
                                <button onClick={(e) => { e.stopPropagation(); handleSetVC(p.playerId); }} style={{
                                    width: 32, height: 32, borderRadius: '50%',
                                    cursor: 'pointer',
                                    background: isVC ? '#818cf8' : 'rgba(255,255,255,0.05)',
                                    color: isVC ? '#000' : 'rgba(255,255,255,0.3)',
                                    fontWeight: 900, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.15s',
                                    border: isVC ? 'none' : '1px solid rgba(255,255,255,0.08)',
                                }}>
                                    VC
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* Save button */}
                <div style={{
                    position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
                    width: '100%', maxWidth: 600, padding: '0 16px', zIndex: 10,
                }}>
                    <button onClick={handleSave} disabled={saving} style={{
                        width: '100%', padding: '14px 20px', borderRadius: 14, border: 'none',
                        fontSize: 13, fontWeight: 800,
                        cursor: captain && viceCaptain ? 'pointer' : 'default',
                        background: captain && viceCaptain ? '#fff' : 'rgba(255,255,255,0.06)',
                        color: captain && viceCaptain ? '#0a0a12' : 'rgba(255,255,255,0.25)',
                        transition: 'all 0.2s',
                    }}>
                        {saving ? 'Saving…' : captain && viceCaptain ? 'Save Team' : 'Pick both C & VC above'}
                    </button>
                </div>
            </div>
        );
    }

    // ═══════════════ PLAYER SELECTION STEP ═══════════════
    return (
        <div style={{ maxWidth: 600, margin: '0 auto', width: '100%', paddingBottom: 180 }}>

            {/* Error toast */}
            {uiError && (
                <div style={{
                    position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
                    background: '#ef4444', color: '#fff', padding: '8px 18px', borderRadius: 100,
                    fontWeight: 700, fontSize: 11, zIndex: 1000, display: 'flex', alignItems: 'center', gap: 6,
                    boxShadow: '0 4px 20px rgba(239,68,68,0.4)',
                }}>
                    <LuInfo size={13} /> {uiError}
                </div>
            )}

            {/* Playing 11 status text */}
            {!lineupConfirmed && !loadingRoster && !rosterError && (
                <div style={{
                    textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#f59e0b',
                    margin: '4px 0 12px', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center'
                }}>
                    <LuTriangleAlert size={12} /> Playing 11 not yet announced
                </div>
            )}

            {/* Squad Counter */}
            <div style={{
                padding: '16px 16px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
            }}>
                {/* Big count */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                    <span style={{
                        fontSize: 36, fontWeight: 900, letterSpacing: -2,
                        color: totalSelected === 11 ? '#ec4899' : '#fff',
                        transition: 'color 0.2s',
                    }}>{totalSelected}</span>
                    <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.2)', fontWeight: 700 }}>/11</span>
                </div>

                {/* Slot dots */}
                <div style={{ display: 'flex', gap: 5 }}>
                    {Array.from({ length: 11 }).map((_, i) => {
                        const filled = i < totalSelected;
                        return (
                            <div key={i} style={{
                                width: 8, height: 8, borderRadius: '50%',
                                background: filled ? '#ec4899' : 'rgba(255,255,255,0.08)',
                                transition: 'all 0.15s',
                            }} />
                        );
                    })}
                </div>

                {/* Team split bar */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%', maxWidth: 280,
                }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: c1, minWidth: 28 }}>{t1Short}</span>
                    <div style={{
                        flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.05)',
                        display: 'flex', overflow: 'hidden',
                    }}>
                        <div style={{ width: `${(team1Count / 11) * 100}%`, background: c1, transition: 'width 0.2s' }} />
                        <div style={{ flex: 1 }} />
                        <div style={{ width: `${(team2Count / 11) * 100}%`, background: c2, transition: 'width 0.2s' }} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: c2, minWidth: 28, textAlign: 'right' }}>{t2Short}</span>
                </div>
            </div>

            {/* Minimal league CTA for new teams */}
            {!existingTeam && (
                <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#ec4899', margin: '-4px 0 12px' }}>
                    Save squad to join a league
                </div>
            )}

            {/* Role Tabs */}
            <div style={{
                display: 'flex', margin: '0 16px 10px',
                background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 3,
                border: '1px solid rgba(255,255,255,0.04)',
            }}>
                {ROLES.map(r => {
                    const active = activeTab === r;
                    const count = roleCount[r] || 0;
                    return (
                        <button key={r} onClick={() => setActiveTab(r)} style={{
                            flex: 1, padding: '9px 0', border: 'none', borderRadius: 9,
                            background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                            color: active ? '#fff' : 'rgba(255,255,255,0.3)',
                            fontWeight: 800, fontSize: 11, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                            transition: 'all 0.12s',
                        }}>
                            {r}
                            {count > 0 && (
                                <span style={{
                                    background: '#ec4899', color: '#fff',
                                    fontSize: 8, fontWeight: 900,
                                    width: 15, height: 15, borderRadius: 5,
                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                }}>{count}</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Player Grid */}
            {loadingRoster ? (
                <div style={{ textAlign: 'center', padding: 50, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Loading squads…</div>
            ) : rosterError ? (
                <div style={{ textAlign: 'center', padding: 50, color: '#ef4444', fontSize: 13 }}>{rosterError}</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '0 16px' }}>
                    {filtered.map(p => {
                        const sel = players.some(s => s.playerId === p.id);
                        const tc = p.team === t1?.id ? c1 : c2;
                        // Lock if: not selected AND (team full OR 10 from this team)
                        const teamPlayerCount = players.filter(pl => roster.find(r => r.id === pl.playerId)?.team === p.team).length;
                        const locked = !sel && (totalSelected >= 11 || teamPlayerCount >= 10);

                        return (
                            <div
                                key={p.id}
                                onClick={() => {
                                    if (locked) {
                                        if (totalSelected >= 11) showError('Squad is full — remove a player first');
                                        else if (teamPlayerCount >= 10) showError(`Max 10 players from one team`);
                                    } else {
                                        handleToggle(p.id, p.role);
                                    }
                                }}
                                style={{
                                    position: 'relative', overflow: 'hidden',
                                    borderRadius: 16, cursor: 'pointer',
                                    background: sel ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.02)',
                                    border: sel ? '1.5px solid rgba(34,197,94,0.25)' : '1px solid rgba(255,255,255,0.04)',
                                    padding: '14px 12px',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                                    transition: 'all 0.12s',
                                    opacity: locked ? 0.3 : 1,
                                }}
                            >
                                {/* Player photo */}
                                <div style={{
                                    width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
                                    background: `${tc}15`, overflow: 'hidden', position: 'relative',
                                    border: sel ? '2.5px solid #4ade80' : `2px solid ${tc}30`,
                                }}>
                                    <WikiImage name={p.name} id={p.id} type="player"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} circle />
                                    {sel && (
                                        <div style={{
                                            position: 'absolute', inset: 0, background: 'rgba(34,197,94,0.35)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <LuCheck size={18} color="#fff" strokeWidth={3} />
                                        </div>
                                    )}
                                </div>

                                {/* Name + team */}
                                <div style={{ textAlign: 'center', minWidth: 0, width: '100%' }}>
                                    <div style={{
                                        fontWeight: 700, fontSize: 12, color: '#fff', lineHeight: 1.3,
                                        overflow: 'hidden', textOverflow: 'ellipsis',
                                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any,
                                    }}>
                                        {p.name}
                                    </div>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: tc, opacity: 0.7, marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                        {p.teamShort}
                                        {playedLastMatch.has(p.id) && (
                                            <>
                                                <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
                                                <span style={{ color: '#4ade80', fontSize: 9, fontWeight: 600 }}>Played last match</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Next / Proceed CTA */}
            {!isMatchLocked && (
                <div style={{
                    position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
                    width: '100%', maxWidth: 600, padding: '0 16px', zIndex: 10,
                }}>
                    <button onClick={handleNextStep} style={{
                        width: '100%', padding: '14px 20px', borderRadius: 14, border: 'none',
                        fontSize: 13, fontWeight: 800,
                        cursor: isSquadReady ? 'pointer' : 'default',
                        background: isSquadReady ? '#fff' : 'rgba(255,255,255,0.06)',
                        color: isSquadReady ? '#0a0a12' : 'rgba(255,255,255,0.25)',
                        transition: 'all 0.2s',
                    }}>
                        {isSquadReady ? 'Continue — Pick C & VC' : `${totalSelected}/11 selected`}
                    </button>
                </div>
            )}
        </div>
    );
}
