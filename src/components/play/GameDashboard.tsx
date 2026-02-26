import React, { useEffect, useMemo, useState } from 'react';
import { LuCalendarClock, LuUser, LuSwords, LuChevronRight, LuZap, LuTrophy, LuClock, LuRadio, LuCheck } from 'react-icons/lu';
import { User } from 'firebase/auth';
import useCricketData from '../../utils/useCricketData';
import { useFantasyTeam } from '../../utils/useFantasyTeam';
import { useContests, Contest } from '../../utils/useContests';
import TeamBuilder from './TeamBuilder';
import LiveTeamView from './LiveTeamView';
import ContestList from './ContestList';
import WikiImage from '../WikiImage';
import { getTeamColor } from '../../utils/teamColors';

interface GameDashboardProps {
    user: User;
    onSignOut: () => void;
    selectedMatchId: string | null;
    setSelectedMatchId: (id: string | null) => void;
}

/* ── Countdown Hook ──────────────────────────────────────────── */
function useCountdown(targetDate: string) {
    const [diff, setDiff] = useState(new Date(targetDate).getTime() - Date.now());
    useEffect(() => {
        const t = setInterval(() => setDiff(new Date(targetDate).getTime() - Date.now()), 1000);
        return () => clearInterval(t);
    }, [targetDate]);
    const total = Math.max(0, diff);
    const h = Math.floor(total / 3_600_000);
    const m = Math.floor((total % 3_600_000) / 60_000);
    const s = Math.floor((total % 60_000) / 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    return { h, m, s, pad, total };
}

/* ── Section Tab ──────────────────────────────────────────────── */
const TABS = ['upcoming', 'live', 'completed'] as const;
type TabType = typeof TABS[number];
const TAB_LABELS: Record<TabType, { icon: React.ReactNode; label: string }> = {
    upcoming: { icon: <LuClock size={13} />, label: 'Upcoming' },
    live: { icon: <LuRadio size={13} />, label: 'Live' },
    completed: { icon: <LuTrophy size={13} />, label: 'Completed' },
};

/* ── Helper: can user still build/edit squad? ──────────────── */
function canBuildSquad(match: any): boolean {

    const startTime = new Date(match.start_date).getTime();
    return startTime > Date.now();
}

/* ── Compact Match Card ───────────────────────────────────────── */
const MatchCard: React.FC<{
    match: any; team: any; onClick: () => void; tab: TabType; hasLeague?: boolean;
}> = ({ match, team, onClick, tab, hasLeague }) => {
    const t1 = match.participants?.[0];
    const t2 = match.participants?.[1];
    const team1 = t1?.name || 'TBC';
    const team2 = t2?.name || 'TBC';
    const t1Short = t1?.short_name || team1.slice(0, 3).toUpperCase();
    const t2Short = t2?.short_name || team2.slice(0, 3).toUpperCase();
    const c1 = getTeamColor(team1) || '#333';
    const c2 = getTeamColor(team2) || '#333';
    const isLive = match.event_state === 'L';
    const canBuild = canBuildSquad(match);

    // Date formatting
    const d = new Date(match.start_date);
    const now = new Date();
    const tom = new Date(); tom.setDate(tom.getDate() + 1);
    let dateLabel: string;
    const time = d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' });
    if (d.toDateString() === now.toDateString()) dateLabel = `Today, ${time}`;
    else if (d.toDateString() === tom.toDateString()) dateLabel = `Tomorrow, ${time}`;
    else dateLabel = d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

    // Series short name
    const series = match.series_name || match.championship_name || '';

    return (
        <div onClick={onClick} style={{
            position: 'relative', overflow: 'hidden', borderRadius: 16,
            cursor: 'pointer', border: '1px solid rgba(255,255,255,0.06)',
            background: '#0c0c14',
            transition: 'transform 0.15s, box-shadow 0.15s',
        }}>
            {/* Subtle team color glow */}
            <div style={{
                position: 'absolute', inset: 0, opacity: 0.12,
                background: `linear-gradient(135deg, ${c1} 0%, transparent 40%, transparent 60%, ${c2} 100%)`,
            }} />

            {/* Top bar: series + status */}
            <div style={{
                position: 'relative', zIndex: 1, padding: '8px 14px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
                <div style={{
                    fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.35)',
                    textTransform: 'uppercase', letterSpacing: '0.8px',
                    maxWidth: '60%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                    {series}
                </div>
                {tab === 'live' && isLive && (
                    <div style={{
                        fontSize: 9, fontWeight: 800, color: '#ef4444',
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '2px 8px', borderRadius: 6,
                        background: 'rgba(239,68,68,0.12)',
                    }}>
                        <span style={{
                            width: 5, height: 5, borderRadius: '50%', background: '#ef4444',
                            animation: 'pulse 1.5s infinite',
                        }} />
                        LIVE
                    </div>
                )}
                {tab === 'completed' && (
                    <div style={{
                        fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)',
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                    }}>
                        Completed
                    </div>
                )}
                {tab === 'upcoming' && (
                    <div style={{
                        fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.45)',
                        display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                        <LuClock size={10} /> {dateLabel}
                    </div>
                )}
            </div>

            {/* Teams row */}
            <div style={{
                position: 'relative', zIndex: 1,
                display: 'flex', alignItems: 'center', padding: '14px 16px',
            }}>
                {/* Team 1 */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 40, height: 40, flexShrink: 0,
                        borderRadius: 10, overflow: 'hidden',
                        background: `${c1}20`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <WikiImage name={team1} id={t1?.id} type="team"
                            style={{ width: 32, height: 32, objectFit: 'contain' }} />
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 14, color: '#fff', letterSpacing: '0.3px' }}>
                            {t1Short}
                        </div>
                        <div style={{
                            fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 600,
                            marginTop: 1, maxWidth: 100, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                            {team1}
                        </div>
                    </div>
                </div>

                {/* VS center */}
                <div style={{
                    flexShrink: 0, width: 36, textAlign: 'center',
                    fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.15)',
                    letterSpacing: '2px',
                }}>
                    VS
                </div>

                {/* Team 2 */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, fontSize: 14, color: '#fff', letterSpacing: '0.3px' }}>
                            {t2Short}
                        </div>
                        <div style={{
                            fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 600,
                            marginTop: 1, maxWidth: 100, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                            {team2}
                        </div>
                    </div>
                    <div style={{
                        width: 40, height: 40, flexShrink: 0,
                        borderRadius: 10, overflow: 'hidden',
                        background: `${c2}20`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <WikiImage name={team2} id={t2?.id} type="team"
                            style={{ width: 32, height: 32, objectFit: 'contain' }} />
                    </div>
                </div>
            </div>

            {/* Bottom bar: CTA or points */}
            <div style={{
                position: 'relative', zIndex: 1, padding: '0 14px 10px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
                {tab === 'upcoming' && (
                    <div style={{
                        flex: 1, padding: '9px', borderRadius: 10,
                        fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        ...(team
                            ? { background: 'rgba(34,197,94,0.08)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.15)' }
                            : { background: `linear-gradient(135deg, ${c1}60, ${c2}60)`, color: '#fff' }
                        ),
                    }}>
                        {team ? (
                            hasLeague ? (
                                <>
                                    <LuTrophy size={12} strokeWidth={2.5} />
                                    <span>My Leagues</span>
                                    <span style={{ opacity: 0.5 }}>·</span>
                                    <span style={{ fontSize: 10, fontWeight: 800 }}>View</span>
                                </>
                            ) : (
                                <>
                                    <LuCheck size={12} strokeWidth={3} />
                                    <span>Team Ready</span>
                                    <span style={{ opacity: 0.5 }}>·</span>
                                    <span style={{ fontSize: 10, fontWeight: 800 }}>Compete with Friends</span>
                                </>
                            )
                        ) : (
                            <><LuSwords size={12} /> Create/Join League</>
                        )}
                        <LuChevronRight size={12} style={{ opacity: 0.5 }} />
                    </div>
                )}
                {tab === 'live' && (
                    <div style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                        {team ? (
                            <>
                                <div style={{
                                    fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600,
                                    display: 'flex', alignItems: 'center', gap: 4,
                                }}>
                                    <LuUser size={11} /> Your squad is playing
                                </div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>PTS</span>
                                    <span style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-1px' }}>
                                        {team.total_points ?? '–'}
                                    </span>
                                </div>
                            </>
                        ) : canBuild ? (
                            <div style={{
                                flex: 1, padding: '9px', borderRadius: 10,
                                fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                background: `linear-gradient(135deg, ${c1}60, ${c2}60)`, color: '#fff',
                            }}>
                                <LuZap size={12} /> Still time! Create/Join League
                                <LuChevronRight size={12} style={{ opacity: 0.5 }} />
                            </div>
                        ) : (
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>
                                Match started — squad locked
                            </div>
                        )}
                    </div>
                )}
                {tab === 'completed' && team && (
                    <div style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                        <div style={{
                            fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                            <LuTrophy size={11} /> Final Score
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>PTS</span>
                            <span style={{ fontSize: 22, fontWeight: 900, color: '#4ade80', letterSpacing: '-1px' }}>
                                {team.total_points ?? '–'}
                            </span>
                        </div>
                    </div>
                )}
                {tab === 'completed' && !team && (
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontWeight: 600, padding: '4px 0' }}>
                        No squad entered
                    </div>
                )}
            </div>
        </div>
    );
};

/* ── Countdown Highlight Card (first upcoming match within 24h) ── */
const CountdownHighlight: React.FC<{
    match: any; team: any; onClick: () => void; hasLeague?: boolean;
}> = ({ match, team, onClick, hasLeague }) => {
    const t1 = match.participants?.[0];
    const t2 = match.participants?.[1];
    const team1 = t1?.name || 'TBC';
    const team2 = t2?.name || 'TBC';
    const t1Short = t1?.short_name || team1.slice(0, 3).toUpperCase();
    const t2Short = t2?.short_name || team2.slice(0, 3).toUpperCase();
    const c1 = getTeamColor(team1) || '#333';
    const c2 = getTeamColor(team2) || '#333';
    const { h, m, s, pad } = useCountdown(match.start_date);
    const urgency = h < 2 ? '#ef4444' : h < 6 ? '#f59e0b' : '#4ade80';

    return (
        <div onClick={onClick} style={{
            position: 'relative', overflow: 'hidden', borderRadius: 20,
            cursor: 'pointer', border: `1px solid ${urgency}30`,
            background: '#0a0a12',
            marginBottom: 16,
        }}>
            {/* Animated gradient border effect */}
            <div style={{
                position: 'absolute', inset: 0, opacity: 0.1,
                background: `radial-gradient(circle at 0% 50%, ${c1}, transparent 50%), radial-gradient(circle at 100% 50%, ${c2}, transparent 50%)`,
            }} />

            {/* Header */}
            <div style={{
                position: 'relative', zIndex: 1, padding: '10px 16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
                <div style={{
                    fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.35)',
                    textTransform: 'uppercase', letterSpacing: '0.8px',
                    maxWidth: '65%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                    {match.series_name || match.championship_name}
                </div>
                <div style={{
                    fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)',
                    display: 'flex', alignItems: 'center', gap: 4,
                }}>
                    <LuClock size={10} />
                    {new Date(match.start_date).toLocaleString('en-US', {
                        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                    })}
                </div>
            </div>

            {/* Main: Teams + Countdown */}
            <div style={{
                position: 'relative', zIndex: 1,
                display: 'flex', alignItems: 'center', padding: '18px 16px', gap: 8,
            }}>
                {/* Team 1 */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 48, height: 48 }}>
                        <WikiImage name={team1} id={t1?.id} type="team"
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <span style={{
                        fontWeight: 800, fontSize: 13, color: '#fff',
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                    }}>{t1Short}</span>
                </div>

                {/* Countdown */}
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    flexShrink: 0,
                }}>
                    <div style={{
                        fontSize: 7, fontWeight: 700, color: 'rgba(255,255,255,0.3)',
                        textTransform: 'uppercase', letterSpacing: '1.5px',
                    }}>
                        Locks in
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {[pad(h), pad(m), pad(s)].map((v, i) => (
                            <React.Fragment key={i}>
                                {i > 0 && <span style={{ fontSize: 18, fontWeight: 900, color: `${urgency}60`, marginBottom: 2 }}>:</span>}
                                <div style={{
                                    background: `${urgency}15`, borderRadius: 8,
                                    padding: '6px 8px', minWidth: 36, textAlign: 'center',
                                    fontSize: 18, fontWeight: 900, color: urgency,
                                    fontVariantNumeric: 'tabular-nums',
                                    border: `1px solid ${urgency}20`,
                                }}>{v}</div>
                            </React.Fragment>
                        ))}
                    </div>
                    <div style={{
                        display: 'flex', gap: 26, fontSize: 7, fontWeight: 600,
                        color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '1px',
                    }}>
                        <span>HRS</span><span>MIN</span><span>SEC</span>
                    </div>
                </div>

                {/* Team 2 */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 48, height: 48 }}>
                        <WikiImage name={team2} id={t2?.id} type="team"
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <span style={{
                        fontWeight: 800, fontSize: 13, color: '#fff',
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                    }}>{t2Short}</span>
                </div>
            </div>

            <div style={{ position: 'relative', zIndex: 1, padding: '0 16px 14px' }}>
                <div style={{
                    padding: '10px', borderRadius: 12,
                    fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    ...(team
                        ? { background: 'rgba(236,72,153,0.1)', color: '#ec4899' }
                        : { background: `linear-gradient(135deg, ${c1}80, ${c2}80)`, color: '#fff' }
                    ),
                }}>
                    {team ? (
                        hasLeague
                            ? <><LuTrophy size={12} strokeWidth={2.5} /> My Leagues<span style={{ opacity: 0.5 }}>·</span><span style={{ fontSize: 10, fontWeight: 800 }}>View</span></>
                            : <><LuCheck size={12} strokeWidth={3} /> Team Ready<span style={{ opacity: 0.5 }}>·</span><span style={{ fontSize: 10, fontWeight: 800 }}>Compete with Friends</span></>
                    ) : (
                        <><LuSwords size={12} /> Create / Join League</>
                    )}
                    <LuChevronRight size={12} style={{ opacity: 0.5 }} />
                </div>
            </div>
        </div>
    );
};

/* ── Dashboard ─────────────────────────────────────────────────── */
const GameDashboard: React.FC<GameDashboardProps> = ({ user, onSignOut, selectedMatchId, setSelectedMatchId }) => {
    const { matches, loading: cricketLoading } = useCricketData();
    const { myTeams, loading: teamsLoading, refreshTeams } = useFantasyTeam(user);
    const contestsHook = useContests(user);
    const [activeTab, setActiveTab] = useState<TabType>('upcoming');
    const [detailView, setDetailView] = useState<'contests' | 'build' | 'live'>('contests');
    const [activeContest, setActiveContest] = useState<Contest | null>(null);

    // Categorize matches
    const upcoming = useMemo(() => {
        const cap = new Date();
        cap.setDate(cap.getDate() + 1); // Only show matches within 24 hours
        return matches
            .filter(m => m.event_state === 'U' || (m.event_state === 'L' && canBuildSquad(m)))
            .filter(m => new Date(m.start_date) <= cap)
            .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
    }, [matches]);

    const live = useMemo(() => {
        return matches
            .filter(m => m.event_state === 'L' && !canBuildSquad(m))
            .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
    }, [matches]);

    const completed = useMemo(() => {
        return matches
            .filter(m => m.event_state === 'C' || m.event_state === 'R')
            .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
            .slice(0, 20); // Last 20
    }, [matches]);

    // Counts for tab badges
    const counts: Record<TabType, number> = { upcoming: upcoming.length, live: live.length, completed: completed.length };

    // Auto-select tab with content
    useEffect(() => {
        if (live.length > 0 && upcoming.length === 0) setActiveTab('live');
        else if (upcoming.length > 0) setActiveTab('upcoming');
        else if (completed.length > 0) setActiveTab('completed');
    }, [upcoming.length, live.length, completed.length]);

    // Reset detailView when match changes
    useEffect(() => { setDetailView('contests'); setActiveContest(null); }, [selectedMatchId]);

    const loading = cricketLoading || teamsLoading;

    // Detail view
    if (selectedMatchId) {
        const match = matches.find(m => m.game_id === selectedMatchId);
        const existingTeam = myTeams[selectedMatchId];
        if (match) {
            // TeamBuilder — for upcoming matches or when explicitly building
            if (detailView === 'build' || (canBuildSquad(match) && !existingTeam)) {
                return <TeamBuilder match={match} user={user} existingTeam={existingTeam}
                    onBack={() => setSelectedMatchId(null)}
                    onTeamSaved={() => { refreshTeams(); setDetailView('contests'); }}
                />;
            }

            // LiveTeamView — when viewing a contest for a live/completed match
            if (detailView === 'live' && existingTeam) {
                return <LiveTeamView match={match} user={user} team={existingTeam} contest={activeContest} contestsHook={contestsHook} onBack={() => setDetailView('contests')} />;
            }

            // ContestList — shown after team save or for live matches with existing team
            if (detailView === 'contests' && existingTeam) {
                return <ContestList
                    match={match}
                    user={user}
                    existingTeam={existingTeam}
                    onBuildSquad={() => setDetailView('build')}
                    onViewContest={(contest) => { setActiveContest(contest); setDetailView('live'); }}
                    onBack={() => setSelectedMatchId(null)}
                />;
            }

            // Fallback for live/completed with team — go to contests
            if (existingTeam && !canBuildSquad(match)) {
                return <ContestList
                    match={match}
                    user={user}
                    existingTeam={existingTeam}
                    onBuildSquad={() => setDetailView('build')}
                    onViewContest={(contest) => { setActiveContest(contest); setDetailView('live'); }}
                    onBack={() => setSelectedMatchId(null)}
                />;
            }
        }
    }

    const activeMatches = activeTab === 'upcoming' ? upcoming : activeTab === 'live' ? live : completed;

    // First upcoming within 24h for hero card
    const heroMatch = activeTab === 'upcoming' ? upcoming.find(m => {
        const diff = new Date(m.start_date).getTime() - Date.now();
        return diff > 0 && diff < 24 * 3_600_000;
    }) : null;
    const remainingUpcoming = heroMatch ? upcoming.filter(m => m.game_id !== heroMatch.game_id) : upcoming;
    const displayMatches = activeTab === 'upcoming' ? remainingUpcoming : activeMatches;

    return (
        <div style={{ padding: '16px 16px', paddingBottom: 110, maxWidth: 600, margin: '0 auto', width: '100%' }}>
            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0', opacity: 0.5 }}>
                    <div className="login-spinner" style={{ margin: '0 auto', borderColor: '#ec4899', borderRightColor: 'transparent' }} />
                </div>
            ) : (
                <>
                    {/* ── Tab Bar ── */}
                    <div style={{
                        display: 'flex', gap: 4, marginBottom: 20,
                        background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 4,
                        border: '1px solid rgba(255,255,255,0.04)',
                    }}>
                        {TABS.map(tab => {
                            const active = activeTab === tab;
                            const count = counts[tab];
                            const { icon, label } = TAB_LABELS[tab];
                            return (
                                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                                    flex: 1, padding: '10px 0', borderRadius: 11, border: 'none',
                                    background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                                    color: active ? '#fff' : 'rgba(255,255,255,0.35)',
                                    fontWeight: 700, fontSize: 11, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                                    transition: 'all 0.15s',
                                }}>
                                    {icon}
                                    {label}
                                    {count > 0 && (
                                        <span style={{
                                            fontSize: 9, fontWeight: 800,
                                            minWidth: 16, height: 16, borderRadius: 6,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            background: active
                                                ? (tab === 'live' ? '#ef4444' : 'rgba(255,255,255,0.15)')
                                                : 'rgba(255,255,255,0.06)',
                                            color: active ? '#fff' : 'rgba(255,255,255,0.3)',
                                        }}>{count}</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* ── Hero Countdown Card ── */}
                    {heroMatch && (
                        <CountdownHighlight
                            match={heroMatch}
                            team={myTeams[heroMatch.game_id]}
                            hasLeague={(contestsHook.myContests[heroMatch.game_id]?.length ?? 0) > 0}
                            onClick={() => setSelectedMatchId(heroMatch.game_id)}
                        />
                    )}

                    {/* ── Match List ── */}
                    {displayMatches.length === 0 && !heroMatch ? (
                        <div style={{
                            padding: '50px 20px', textAlign: 'center', borderRadius: 16,
                            color: 'rgba(255,255,255,0.25)', border: '1px dashed rgba(255,255,255,0.06)',
                            fontSize: 13, fontWeight: 600,
                        }}>
                            {activeTab === 'upcoming' && 'No upcoming matches. Check back later!'}
                            {activeTab === 'live' && 'No live matches right now'}
                            {activeTab === 'completed' && 'No completed matches yet'}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {displayMatches.map(m => (
                                <MatchCard
                                    key={m.game_id}
                                    match={m}
                                    team={myTeams[m.game_id]}
                                    hasLeague={(contestsHook.myContests[m.game_id]?.length ?? 0) > 0}
                                    onClick={() => setSelectedMatchId(m.game_id)}
                                    tab={activeTab}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default GameDashboard;
