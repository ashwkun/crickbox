import React, { useEffect, useMemo, useState } from 'react';
import { LuCalendarClock, LuUser, LuSwords, LuChevronRight, LuZap } from 'react-icons/lu';
import { User } from 'firebase/auth';
import useCricketData from '../../utils/useCricketData';
import { useFantasyTeam } from '../../utils/useFantasyTeam';
import TeamBuilder from './TeamBuilder';
import TeamView from './TeamView';
import WikiImage from '../WikiImage';
import { getTeamColor } from '../../utils/teamColors';

interface GameDashboardProps {
    user: User;
    onSignOut: () => void;
}

/* ── Countdown Hook ────────────────────────────────────────────── */
const useCountdown = (targetDate: string) => {
    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);
    const diff = Math.max(0, new Date(targetDate).getTime() - now);
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    const s = Math.floor((diff % 60_000) / 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    return { h, m, s, total: diff, pad };
};

/* ── Flip Clock Digit ──────────────────────────────────────────── */
const Digit: React.FC<{ value: string; color: string }> = ({ value, color }) => (
    <div style={{
        background: 'rgba(0,0,0,0.5)', borderRadius: 6, padding: '4px 6px',
        minWidth: 28, textAlign: 'center', fontSize: 18, fontWeight: 900,
        fontFamily: 'monospace', color, lineHeight: 1,
        border: `1px solid ${color}22`,
        fontVariantNumeric: 'tabular-nums',
    }}>
        {value}
    </div>
);

const ClockSeparator: React.FC<{ color: string }> = ({ color }) => (
    <span style={{ fontSize: 16, fontWeight: 900, color, opacity: 0.5, lineHeight: 1 }}>:</span>
);

/* ── Countdown Card (< 24h) ────────────────────────────────────── */
const CountdownCard: React.FC<{
    match: any; team: any; onClick: () => void;
}> = ({ match, team, onClick }) => {
    const t1 = match.participants?.[0];
    const t2 = match.participants?.[1];
    const team1 = t1?.name || 'TBC';
    const team2 = t2?.name || 'TBC';
    const c1 = getTeamColor(team1) || '#1a1a2e';
    const c2 = getTeamColor(team2) || '#1a1a2e';
    const { h, m, s, pad } = useCountdown(match.start_date);
    const urgency = h < 2 ? '#ef4444' : h < 6 ? '#f59e0b' : '#4ade80';

    return (
        <div onClick={onClick} style={{
            position: 'relative', overflow: 'hidden', borderRadius: 20,
            cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)',
            background: '#0a0a12',
        }}>
            {/* Background glow from team colors */}
            <div style={{
                position: 'absolute', inset: 0, opacity: 0.15,
                background: `linear-gradient(135deg, ${c1} 0%, transparent 50%, ${c2} 100%)`,
            }} />

            {/* Series strip */}
            <div style={{
                position: 'relative', zIndex: 1, padding: '10px 16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
                <div style={{
                    fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)',
                    textTransform: 'uppercase', letterSpacing: '1px',
                    maxWidth: '70%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                    {match.series_name || match.championship_name}
                </div>
                <div style={{
                    fontSize: 9, fontWeight: 800, color: urgency,
                    textTransform: 'uppercase', letterSpacing: '1px',
                    display: 'flex', alignItems: 'center', gap: 4,
                }}>
                    <div style={{
                        width: 5, height: 5, borderRadius: '50%', background: urgency,
                        animation: h < 2 ? 'pulse 1.5s infinite' : 'none',
                    }} />
                    STARTS SOON
                </div>
            </div>

            {/* Main content: Team — Countdown — Team */}
            <div style={{
                position: 'relative', zIndex: 1,
                display: 'flex', alignItems: 'center', padding: '16px',
                gap: 12,
            }}>
                {/* Team 1 */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 56, height: 56 }}>
                        <WikiImage name={team1} id={t1?.id} type="team"
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <span style={{
                        fontWeight: 800, fontSize: 11, color: '#fff', textTransform: 'uppercase',
                        letterSpacing: '0.5px', textAlign: 'center', lineHeight: 1.2,
                    }}>{team1}</span>
                </div>

                {/* Countdown Center */}
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    flexShrink: 0,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Digit value={pad(h)} color={urgency} />
                        <ClockSeparator color={urgency} />
                        <Digit value={pad(m)} color={urgency} />
                        <ClockSeparator color={urgency} />
                        <Digit value={pad(s)} color={urgency} />
                    </div>
                    <div style={{
                        display: 'flex', gap: 18, fontSize: 8, fontWeight: 600,
                        color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '1px',
                    }}>
                        <span>HRS</span><span>MIN</span><span>SEC</span>
                    </div>
                </div>

                {/* Team 2 */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 56, height: 56 }}>
                        <WikiImage name={team2} id={t2?.id} type="team"
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <span style={{
                        fontWeight: 800, fontSize: 11, color: '#fff', textTransform: 'uppercase',
                        letterSpacing: '0.5px', textAlign: 'center', lineHeight: 1.2,
                    }}>{team2}</span>
                </div>
            </div>

            {/* CTA */}
            <div style={{ position: 'relative', zIndex: 1, padding: '0 16px 14px' }}>
                <button style={{
                    width: '100%', padding: '11px', borderRadius: 12, border: 'none',
                    fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    cursor: 'pointer',
                    ...(team
                        ? { background: 'rgba(34,197,94,0.12)', color: '#4ade80' }
                        : { background: `linear-gradient(135deg, ${c1}90, ${c2}90)`, color: '#fff' }
                    ),
                }}>
                    {team ? <><LuUser size={13} /> Squad Ready</> : <><LuSwords size={13} /> Build Squad</>}
                    <LuChevronRight size={13} style={{ opacity: 0.5 }} />
                </button>
            </div>
        </div>
    );
};

/* ── Standard Match Card (live/completed + upcoming > 24h) ─────── */
const MatchCard: React.FC<{
    match: any; team: any; onClick: () => void;
    variant: 'live' | 'upcoming'; dateStr?: string;
}> = ({ match, team, onClick, variant, dateStr }) => {
    const t1 = match.participants?.[0];
    const t2 = match.participants?.[1];
    const team1 = t1?.name || 'TBC';
    const team2 = t2?.name || 'TBC';
    const c1 = getTeamColor(team1) || '#1a1a2e';
    const c2 = getTeamColor(team2) || '#1a1a2e';
    const isLive = match.event_state === 'L';

    return (
        <div onClick={onClick} style={{
            position: 'relative', overflow: 'hidden', borderRadius: 20,
            cursor: 'pointer', border: '1px solid rgba(255,255,255,0.06)',
        }}>
            {/* ── Background: Diagonal Split ── */}
            <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                <div style={{ position: 'absolute', inset: 0, backgroundColor: c1 }} />
                <div style={{
                    position: 'absolute', inset: 0, backgroundColor: c2,
                    clipPath: 'polygon(42% 0, 100% 0, 100% 100%, 58% 100%)',
                }} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }} />
                <div style={{
                    position: 'absolute', inset: 0, zIndex: 1,
                    background: 'linear-gradient(115deg, transparent 46%, rgba(255,255,255,0.08) 49%, rgba(255,255,255,0.08) 51%, transparent 54%)',
                }} />
            </div>

            {/* ── Top Strip ── */}
            <div style={{
                position: 'relative', zIndex: 2, padding: '10px 16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(0,0,0,0.25)',
            }}>
                {variant === 'live' ? (
                    <div style={{
                        fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 6,
                        background: isLive ? '#ef4444' : 'rgba(255,255,255,0.08)',
                        color: '#fff', textTransform: 'uppercase', letterSpacing: '1px',
                        display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                        {isLive && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />}
                        {isLive ? 'Live' : 'Completed'}
                    </div>
                ) : (
                    <div style={{
                        fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.6)',
                        maxWidth: '60%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                    }}>
                        {match.series_name || match.championship_name}
                    </div>
                )}
                {variant === 'live' ? (
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Pts <span style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginLeft: 4, letterSpacing: '-1px' }}>{team?.total_points ?? '–'}</span>
                    </div>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>
                        <LuCalendarClock size={12} /> {dateStr}
                    </div>
                )}
            </div>

            {/* ── Teams Row ── */}
            <div style={{
                position: 'relative', zIndex: 2,
                display: 'flex', alignItems: 'center', padding: '20px 16px',
            }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 52, height: 52, flexShrink: 0 }}>
                        <WikiImage name={team1} id={t1?.id} type="team"
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <span style={{ fontWeight: 800, fontSize: 13, color: '#fff', lineHeight: 1.25, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                        {team1}
                    </span>
                </div>

                <div style={{
                    flexShrink: 0, width: 44, textAlign: 'center',
                    fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.3)',
                    letterSpacing: '3px', textTransform: 'uppercase',
                }}>
                    VS
                </div>

                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end', textAlign: 'right' }}>
                    <span style={{ fontWeight: 800, fontSize: 13, color: '#fff', lineHeight: 1.25, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                        {team2}
                    </span>
                    <div style={{ width: 52, height: 52, flexShrink: 0 }}>
                        <WikiImage name={team2} id={t2?.id} type="team"
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                </div>
            </div>

            {/* ── Bottom CTA (upcoming only) ── */}
            {variant === 'upcoming' && (
                <div style={{ position: 'relative', zIndex: 2, padding: '0 16px 14px' }}>
                    <button style={{
                        width: '100%', padding: '12px', borderRadius: 12, border: 'none',
                        fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        cursor: 'pointer',
                        ...(team
                            ? { background: 'rgba(34,197,94,0.15)', color: '#4ade80' }
                            : { background: 'rgba(255,255,255,0.1)', color: '#fff' }
                        ),
                    }}>
                        {team ? <><LuUser size={14} /> Squad Ready</> : <><LuSwords size={14} /> Build Squad</>}
                        <LuChevronRight size={14} style={{ marginLeft: 2, opacity: 0.5 }} />
                    </button>
                </div>
            )}
        </div>
    );
};

/* ── Dashboard ─────────────────────────────────────────────────── */
const GameDashboard: React.FC<GameDashboardProps> = ({ user, onSignOut }) => {
    const { matches, loading: cricketLoading } = useCricketData();
    const { myTeams, loading: teamsLoading } = useFantasyTeam(user);
    const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

    const upcomingMatches = useMemo(() => {
        const cap = new Date();
        cap.setDate(cap.getDate() + 3);
        return matches
            .filter(m => m.event_state === 'U' && new Date(m.start_date) <= cap)
            .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
    }, [matches]);

    const liveMatches = useMemo(() => {
        return matches
            .filter(m => (m.event_state === 'L' || m.event_state === 'C' || m.event_state === 'R') && myTeams[m.game_id])
            .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
    }, [matches, myTeams]);

    const loading = cricketLoading || teamsLoading;

    if (selectedMatchId) {
        const match = matches.find(m => m.game_id === selectedMatchId);
        const existingTeam = myTeams[selectedMatchId];
        if (match) {
            if (match.event_state === 'U') {
                return <TeamBuilder match={match} user={user} existingTeam={existingTeam} onBack={() => setSelectedMatchId(null)} />;
            } else if (existingTeam) {
                return <TeamView match={match} user={user} team={existingTeam} onBack={() => setSelectedMatchId(null)} />;
            }
        }
    }

    const fmtDate = (iso: string) => {
        const d = new Date(iso);
        const now = new Date();
        const tom = new Date(); tom.setDate(tom.getDate() + 1);
        const time = d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' });
        if (d.toDateString() === now.toDateString()) return `Today, ${time}`;
        if (d.toDateString() === tom.toDateString()) return `Tomorrow, ${time}`;
        return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    };

    const isWithin24h = (iso: string) => {
        const diff = new Date(iso).getTime() - Date.now();
        return diff > 0 && diff < 24 * 3_600_000;
    };

    const sectionTitle = (icon: React.ReactNode, label: string) => (
        <h2 style={{
            fontSize: 13, textTransform: 'uppercase', letterSpacing: '2px',
            color: 'rgba(255,255,255,0.5)', marginBottom: 16, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 8,
        }}>
            {icon} {label}
        </h2>
    );

    return (
        <div style={{ padding: '24px 16px', paddingBottom: 110, maxWidth: 600, margin: '0 auto', width: '100%' }}>
            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0', opacity: 0.5 }}>
                    <div className="login-spinner" style={{ margin: '0 auto', borderColor: '#ec4899', borderRightColor: 'transparent' }} />
                </div>
            ) : (
                <>
                    {/* Live / Completed */}
                    {liveMatches.length > 0 && (
                        <div style={{ marginBottom: 40 }}>
                            {sectionTitle(<LuSwords size={14} />, 'Your Contests')}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {liveMatches.map(m => (
                                    <MatchCard key={m.game_id} match={m} team={myTeams[m.game_id]}
                                        onClick={() => setSelectedMatchId(m.game_id)} variant="live" />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Upcoming */}
                    <div>
                        {sectionTitle(<LuCalendarClock size={14} />, 'Upcoming')}
                        {upcomingMatches.length === 0 ? (
                            <div style={{
                                padding: '40px 20px', textAlign: 'center', borderRadius: 20,
                                color: 'rgba(255,255,255,0.3)', border: '1px dashed rgba(255,255,255,0.08)',
                                fontSize: 13,
                            }}>
                                Nothing in the next 3 days. Check back later!
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {upcomingMatches.map(m =>
                                    isWithin24h(m.start_date) ? (
                                        <CountdownCard key={m.game_id} match={m} team={myTeams[m.game_id]}
                                            onClick={() => setSelectedMatchId(m.game_id)} />
                                    ) : (
                                        <MatchCard key={m.game_id} match={m} team={myTeams[m.game_id]}
                                            onClick={() => setSelectedMatchId(m.game_id)} variant="upcoming" dateStr={fmtDate(m.start_date)} />
                                    )
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default GameDashboard;
