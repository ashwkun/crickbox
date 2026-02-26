import React, { useState } from 'react';
import { Match } from '../../types';
import { User } from 'firebase/auth';
import { Contest, useContests } from '../../utils/useContests';
import { FantasyTeam } from '../../utils/useFantasyTeam';
import { LuPlus, LuTicket, LuUsers, LuCopy, LuCheck, LuChevronRight, LuSwords, LuTrophy, LuPencil, LuCrown, LuUserPlus, LuArrowRight } from 'react-icons/lu';

interface Props {
    match: Match;
    user: User;
    existingTeam: FantasyTeam | null;
    onBuildSquad: () => void;
    onViewContest: (contest: Contest) => void;
    onBack: () => void;
}

export default function ContestList({ match, user, existingTeam, onBuildSquad, onViewContest, onBack }: Props) {
    const { myContests, loading: contestsLoading, createContest, joinByCode } = useContests(user);
    const [view, setView] = useState<'list' | 'create' | 'join'>('list');
    const [contestName, setContestName] = useState('');
    const [maxEntries, setMaxEntries] = useState(10);
    const [joinCode, setJoinCode] = useState('');
    const [creating, setCreating] = useState(false);
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState('');
    const [createdCode, setCreatedCode] = useState('');
    const [copied, setCopied] = useState(false);

    const matchContests = myContests[match.game_id] || [];

    const handleCreate = async () => {
        if (!contestName.trim()) { setError('Give your league a name'); return; }
        setCreating(true); setError('');
        try {
            const contest = await createContest(match.game_id, contestName.trim(), maxEntries);
            setCreatedCode(contest.code);
        } catch (err: any) { setError(err.message); }
        finally { setCreating(false); }
    };

    const handleJoin = async () => {
        if (joinCode.length < 6) { setError('Enter a 6-character code'); return; }
        setJoining(true); setError('');
        try {
            await joinByCode(joinCode);
            setView('list');
            setJoinCode('');
        } catch (err: any) { setError(err.message); }
        finally { setJoining(false); }
    };

    const copyCode = () => {
        navigator.clipboard?.writeText(createdCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // ── Created Success ──
    if (createdCode) {
        return (
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>

                {/* Title */}
                <div style={{ marginBottom: 36 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: 12,
                            background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                            <LuCheck size={20} color="#ec4899" strokeWidth={3} />
                        </div>
                        <h2 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.8px' }}>League Created!</h2>
                    </div>
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', margin: 0, fontWeight: 500 }}>Share this code with your friends so they can join</p>
                </div>

                {/* Invite Code Block */}
                <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>Invite Code</div>
                <div style={{
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 18, padding: '24px 20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: 32,
                }}>
                    <span style={{ fontSize: 32, fontWeight: 900, letterSpacing: 10, color: '#ec4899', fontFamily: 'monospace' }}>
                        {createdCode}
                    </span>
                    <button onClick={copyCode} style={{
                        background: copied ? '#ec4899' : 'rgba(255,255,255,0.06)',
                        border: 'none', borderRadius: 10,
                        padding: '10px 16px', cursor: 'pointer',
                        color: copied ? '#fff' : '#fff',
                        display: 'flex', alignItems: 'center', gap: 6,
                        fontSize: 13, fontWeight: 700, flexShrink: 0,
                        transition: 'all 0.15s',
                    }}>
                        {copied ? <><LuCheck size={14} /> Copied</> : <><LuCopy size={14} /> Copy</>}
                    </button>
                </div>

                <button onClick={() => { setCreatedCode(''); setView('list'); setContestName(''); }} style={{
                    width: '100%', padding: '18px', borderRadius: 14, fontSize: 15, fontWeight: 700,
                    background: '#ec4899', border: 'none', color: '#fff', cursor: 'pointer',
                }}>
                    Done
                </button>
            </div>
        );
    }

    // ── Create League Form ──
    if (view === 'create') {
        return (
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>

                {/* Title */}
                <div style={{ marginBottom: 32 }}>
                    <h2 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.8px' }}>Create League</h2>
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', margin: 0, fontWeight: 500 }}>Set up a private league for your friends</p>
                </div>

                {/* League Name */}
                <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>League Name</div>
                    <div style={{
                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: 18, overflow: 'hidden',
                    }}>
                        <input
                            value={contestName}
                            onChange={e => setContestName(e.target.value)}
                            placeholder="e.g. Office Championship"
                            maxLength={30}
                            autoFocus
                            style={{
                                width: '100%', padding: '18px 20px',
                                background: 'transparent', border: 'none',
                                color: '#fff', fontSize: 16, fontWeight: 600, outline: 'none',
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>
                </div>

                {/* Max Players */}
                <div style={{ marginTop: 28, marginBottom: 36 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>Max Players</div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        {[2, 5, 10, 20].map(n => {
                            const active = maxEntries === n;
                            return (
                                <button key={n} onClick={() => setMaxEntries(n)} style={{
                                    flex: 1, padding: '18px 0', borderRadius: 18,
                                    background: active ? 'rgba(236,72,153,0.08)' : 'rgba(255,255,255,0.02)',
                                    border: active ? '1px solid rgba(236,72,153,0.25)' : '1px solid rgba(255,255,255,0.05)',
                                    color: active ? '#ec4899' : 'rgba(255,255,255,0.4)',
                                    fontSize: 17, fontWeight: 900, cursor: 'pointer',
                                    transition: 'all 0.15s',
                                }}>{n}</button>
                            );
                        })}
                    </div>
                </div>

                {error && (
                    <div style={{ fontSize: 13, color: '#ef4444', marginBottom: 20, fontWeight: 600, textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                <button onClick={handleCreate} disabled={creating} style={{
                    width: '100%', padding: '18px', borderRadius: 14, fontSize: 15, fontWeight: 700,
                    background: creating ? 'rgba(236,72,153,0.3)' : '#ec4899',
                    border: 'none', color: '#fff', cursor: creating ? 'wait' : 'pointer',
                }}>{creating ? 'Creating...' : 'Create League'}</button>
            </div>
        );
    }

    // ── Join League Form ──
    if (view === 'join') {
        const isValid = joinCode.length === 6;
        return (
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>

                {/* Title */}
                <div style={{ marginBottom: 40 }}>
                    <h2 style={{ fontSize: 28, fontWeight: 900, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.8px' }}>Join League</h2>
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', margin: 0, fontWeight: 500 }}>Enter the 6-character code shared by your friend</p>
                </div>

                {/* Code Input */}
                <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>Invite Code</div>
                <div style={{
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 18, overflow: 'hidden',
                }}>
                    <input
                        value={joinCode}
                        onChange={e => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                        placeholder="ABC123"
                        maxLength={6}
                        autoFocus
                        style={{
                            width: '100%', padding: '22px 20px',
                            background: 'transparent', border: 'none',
                            color: '#fff', fontSize: 28, fontWeight: 900, letterSpacing: 14,
                            textAlign: 'center', outline: 'none', fontFamily: 'monospace',
                            boxSizing: 'border-box',
                        }}
                    />
                </div>

                {/* Character counter */}
                <div style={{ textAlign: 'right', marginTop: 8, marginBottom: 32, fontSize: 12, color: joinCode.length === 6 ? '#ec4899' : 'rgba(255,255,255,0.25)', fontWeight: 700, fontFamily: 'monospace' }}>
                    {joinCode.length}/6
                </div>

                {error && (
                    <div style={{ fontSize: 13, color: '#ef4444', marginBottom: 20, fontWeight: 600, textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                <button onClick={handleJoin} disabled={joining || !isValid} style={{
                    width: '100%', padding: '18px', borderRadius: 14, fontSize: 15, fontWeight: 700,
                    background: (!isValid || joining) ? 'rgba(236,72,153,0.15)' : '#ec4899',
                    border: 'none',
                    color: '#fff',
                    cursor: joining ? 'wait' : !isValid ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                }}>{joining ? 'Joining...' : 'Join League'}</button>
            </div>
        );
    }

    const canEdit = new Date(match.start_date).getTime() > Date.now();

    // ── Main List View ──
    return (
        <div style={{ padding: '20px', paddingBottom: 120 }}>

            {/* Premium Squad Status Card */}
            <div style={{
                background: 'linear-gradient(145deg, rgba(74,222,128,0.12) 0%, rgba(74,222,128,0.02) 100%)',
                border: '1px solid rgba(74,222,128,0.2)',
                borderRadius: 20, padding: '20px 24px', marginBottom: 28,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
            }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        {canEdit ? <LuCheck size={18} color="#4ade80" strokeWidth={3} /> : <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />}
                        <span style={{ fontSize: 18, fontWeight: 900, color: canEdit ? '#4ade80' : '#f59e0b', letterSpacing: '-0.3px' }}>
                            {canEdit ? 'Squad Ready' : 'Squad Locked'}
                        </span>
                    </div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
                        {existingTeam?.players?.length || 11} players selected
                    </div>
                </div>
                {canEdit && (
                    <button onClick={onBuildSquad} style={{
                        background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
                        padding: '10px 18px', color: '#fff', fontSize: 13, fontWeight: 700,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                        transition: 'background 0.2s',
                    }}>
                        <LuPencil size={15} /> Edit
                    </button>
                )}
            </div>

            {/* Prominent Action Cards (Create / Join) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 36 }}>
                <button onClick={() => setView('create')} style={{
                    background: 'linear-gradient(to bottom, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 20, padding: '20px 16px', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
                    transition: 'all 0.2s',
                }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: 14,
                        background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <LuPlus size={24} color="#ec4899" strokeWidth={2.5} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Create League</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>Play with friends</div>
                    </div>
                </button>

                <button onClick={() => setView('join')} style={{
                    background: 'linear-gradient(to bottom, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 20, padding: '20px 16px', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
                    transition: 'all 0.2s',
                }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: 14,
                        background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <LuTicket size={24} color="#818cf8" strokeWidth={2.5} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Join League</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>Enter invite code</div>
                    </div>
                </button>
            </div>

            {/* Leagues Section */}
            <div>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: '0 0 16px', letterSpacing: '-0.5px' }}>My Leagues</h3>

                {/* League Cards */}
                {matchContests.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {matchContests.map(contest => (
                            <button key={contest.id} onClick={() => onViewContest(contest)} style={{
                                display: 'flex', alignItems: 'center', gap: 16,
                                padding: '16px', borderRadius: 18,
                                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                                cursor: 'pointer', textAlign: 'left', width: '100%',
                                transition: 'background 0.2s',
                            }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: 12,
                                    background: 'rgba(236,72,153,0.06)', border: '1px solid rgba(236,72,153,0.12)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                }}>
                                    <LuTrophy size={20} color="#ec4899" />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{contest.name}</div>
                                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <LuUsers size={12} /> {contest.entry_count || 0}/{contest.max_entries}
                                        </span>
                                        <span style={{ fontFamily: 'monospace', letterSpacing: 0.5 }}>Code: {contest.code}</span>
                                    </div>
                                </div>
                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <LuChevronRight size={18} color="rgba(255,255,255,0.3)" />
                                </div>
                            </button>
                        ))}
                    </div>
                ) : contestsLoading ? (
                    <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: 600 }}>
                        <div className="login-spinner" style={{ margin: '0 auto 12px', borderColor: '#ec4899', borderRightColor: 'transparent' }} />
                        Loading leagues...
                    </div>
                ) : (
                    <div style={{
                        textAlign: 'center', padding: '40px 20px', borderRadius: 20,
                        border: '2px dashed rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.01)'
                    }}>
                        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                            <LuTrophy size={24} color="rgba(255,255,255,0.2)" />
                        </div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>No leagues yet</div>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
                            Join an existing league or create your own to start playing!
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
