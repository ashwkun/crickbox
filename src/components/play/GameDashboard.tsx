import React, { useMemo, useState } from 'react';
import { LuChevronRight, LuCalendarClock, LuUser, LuSwords, LuZap } from 'react-icons/lu';
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

const GameDashboard: React.FC<GameDashboardProps> = ({ user, onSignOut }) => {
    const { matches, loading: cricketLoading } = useCricketData();
    const { myTeams, loading: teamsLoading } = useFantasyTeam(user);
    const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

    // Get upcoming matches within 3 days
    const upcomingMatches = useMemo(() => {
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

        return matches.filter(m => {
            if (m.event_state !== 'U') return false;
            const matchDate = new Date(m.start_date);
            return matchDate <= threeDaysFromNow;
        }).sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
    }, [matches]);

    const liveMatches = useMemo(() => {
        return matches.filter(m => m.event_state === 'L' || m.event_state === 'C' || m.event_state === 'R')
            .filter(m => myTeams[m.game_id]) // Only show live/completed if user created a team
            .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
    }, [matches, myTeams]);

    const loading = cricketLoading || teamsLoading;

    if (selectedMatchId) {
        const match = matches.find(m => m.game_id === selectedMatchId);
        const existingTeam = myTeams[selectedMatchId];

        if (match) {
            if (match.event_state === 'U') {
                return (
                    <TeamBuilder
                        match={match}
                        user={user}
                        existingTeam={existingTeam}
                        onBack={() => setSelectedMatchId(null)}
                    />
                );
            } else if (existingTeam) {
                return (
                    <TeamView
                        match={match}
                        user={user}
                        team={existingTeam}
                        onBack={() => setSelectedMatchId(null)}
                    />
                );
            }
        }
    }

    return (
        <div style={{
            padding: '24px 20px',
            paddingBottom: 110,
            maxWidth: 600,
            margin: '0 auto',
            width: '100%',
        }}>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0', opacity: 0.5 }}>
                    <div className="login-spinner" style={{ margin: '0 auto', borderColor: '#ec4899', borderRightColor: 'transparent' }} />
                </div>
            ) : (
                <>
                    {/* Live/Completed Teams (active contests) */}
                    {liveMatches.length > 0 && (
                        <div style={{ marginBottom: 48 }}>
                            <h2 style={{
                                fontSize: 14,
                                textTransform: 'uppercase',
                                letterSpacing: '2px',
                                color: '#fff',
                                marginBottom: 20,
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10
                            }}>
                                <div style={{ padding: 8, background: 'rgba(236,72,153,0.15)', borderRadius: 10, color: '#ec4899', display: 'flex' }}>
                                    <LuSwords size={18} />
                                </div>
                                Your Contests
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {liveMatches.map(match => {
                                    const team = myTeams[match.game_id];
                                    const team1Name = match.participants?.[0]?.name || 'TBC';
                                    const team2Name = match.participants?.[1]?.name || 'TBC';
                                    const color1 = getTeamColor(team1Name) || '#1e1e24';
                                    const color2 = getTeamColor(team2Name) || '#1e1e24';

                                    return (
                                        <div
                                            key={match.game_id}
                                            onClick={() => setSelectedMatchId(match.game_id)}
                                            style={{
                                                position: 'relative',
                                                overflow: 'hidden',
                                                borderRadius: 24,
                                                cursor: 'pointer',
                                                boxShadow: match.event_state === 'L' ? `0 8px 32px ${color1}40, 0 8px 32px ${color2}40` : '0 8px 32px rgba(0,0,0,0.4)',
                                                border: match.event_state === 'L' ? '2px solid rgba(255, 255, 255, 0.4)' : '1px solid rgba(255,255,255,0.1)',
                                                display: 'flex',
                                                flexDirection: 'column'
                                            }}
                                        >
                                            {/* Solid Color Backgrounds with integrated VS Thunder */}
                                            <div style={{ position: 'absolute', inset: 0, display: 'flex', zIndex: 0, overflow: 'hidden' }}>
                                                {/* Left Color */}
                                                <div style={{ flex: 1, backgroundColor: color1, position: 'relative' }}>
                                                </div>

                                                {/* Right Color */}
                                                <div style={{ flex: 1, backgroundColor: color2, position: 'relative' }}>
                                                </div>

                                                {/* Full-Height Background Thunder Separator */}
                                                <div style={{
                                                    position: 'absolute',
                                                    left: '50%',
                                                    top: '50%',
                                                    transform: 'translate(-50%, -50%)',
                                                    height: '120%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    zIndex: 1,
                                                    opacity: 0.8
                                                }}>
                                                    <LuZap size={220} color="#ffbd00" strokeWidth={1.5} fill="#ffbd00" style={{ transform: 'rotate(15deg)' }} />
                                                </div>
                                            </div>

                                            {/* Top Banner: Status & Points */}
                                            <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.6)', borderBottom: '1px solid rgba(0,0,0,0.5)', zIndex: 2 }}>
                                                <div style={{
                                                    fontSize: 10,
                                                    fontWeight: 800,
                                                    padding: '6px 12px',
                                                    borderRadius: 100,
                                                    background: match.event_state === 'L' ? '#ef4444' : 'rgba(255,255,255,0.1)',
                                                    color: '#fff',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '1px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 6
                                                }}>
                                                    {match.event_state === 'L' && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                                                    {match.event_state === 'L' ? 'LIVE NOW' : 'COMPLETED'}
                                                </div>
                                                <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '1px' }}>Points <br /><span style={{ fontSize: 24, fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-1px' }}>{team?.total_points ?? '--'}</span></div>
                                                </div>
                                            </div>

                                            {/* Contenders */}
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 20px', zIndex: 2, background: 'rgba(0,0,0,0.2)' }}>
                                                {/* Team 1 */}
                                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
                                                    <div style={{ width: 64, height: 64, background: 'rgba(0,0,0,0.2)', borderRadius: '50%', padding: 8 }}>
                                                        <WikiImage name={team1Name} id={match.participants?.[0]?.id} type="team" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                    </div>
                                                    <span style={{ fontWeight: 900, fontSize: 16, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: 1.2, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>{team1Name}</span>
                                                </div>

                                                {/* Invisible Spacer to keep layout balanced around the background thunder */}
                                                <div style={{ width: 60, flexShrink: 0 }}></div>

                                                {/* Team 2 */}
                                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
                                                    <div style={{ width: 64, height: 64, background: 'rgba(0,0,0,0.2)', borderRadius: '50%', padding: 8 }}>
                                                        <WikiImage name={team2Name} id={match.participants?.[1]?.id} type="team" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                    </div>
                                                    <span style={{ fontWeight: 900, fontSize: 16, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: 1.2, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>{team2Name}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Upcoming Matches */}
                    <div>
                        <h2 style={{
                            fontSize: 14,
                            textTransform: 'uppercase',
                            letterSpacing: '2px',
                            color: '#fff',
                            marginBottom: 20,
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10
                        }}>
                            <div style={{ padding: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 10, color: '#fff', display: 'flex' }}>
                                <LuCalendarClock size={18} />
                            </div>
                            Upcoming Battles
                        </h2>
                        {upcomingMatches.length === 0 ? (
                            <div style={{
                                padding: '40px 20px',
                                textAlign: 'center',
                                background: 'rgba(255,255,255,0.02)',
                                borderRadius: 24,
                                color: 'rgba(255,255,255,0.4)',
                                border: '1px dashed rgba(255,255,255,0.1)'
                            }}>
                                No upcoming battles in the next 3 days.<br />Check back later!
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {upcomingMatches.map(match => {
                                    const team = myTeams[match.game_id];
                                    const date = new Date(match.start_date);
                                    const team1Name = match.participants?.[0]?.name || 'TBC';
                                    const team2Name = match.participants?.[1]?.name || 'TBC';
                                    const color1 = getTeamColor(team1Name) || '#1e1e24';
                                    const color2 = getTeamColor(team2Name) || '#1e1e24';

                                    // Determine if it's today or tomorrow
                                    const today = new Date();
                                    const tomorrow = new Date();
                                    tomorrow.setDate(tomorrow.getDate() + 1);

                                    let dateStr = date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
                                    if (date.toDateString() === today.toDateString()) {
                                        dateStr = `Today, ${date.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
                                    } else if (date.toDateString() === tomorrow.toDateString()) {
                                        dateStr = `Tomorrow, ${date.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
                                    }

                                    return (
                                        <div
                                            key={match.game_id}
                                            onClick={() => setSelectedMatchId(match.game_id)}
                                            style={{
                                                position: 'relative',
                                                borderRadius: 24,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                overflow: 'hidden',
                                                boxShadow: team ? `0 8px 32px ${color1}40, 0 8px 32px ${color2}40` : '0 8px 24px rgba(0,0,0,0.4)',
                                                border: team ? '2px solid rgba(255, 255, 255, 0.4)' : '1px solid rgba(255,255,255,0.1)'
                                            }}
                                        >
                                            {/* Solid Color Backgrounds with integrated VS Thunder */}
                                            <div style={{ position: 'absolute', inset: 0, display: 'flex', zIndex: 0, overflow: 'hidden' }}>
                                                {/* Left Color */}
                                                <div style={{ flex: 1, backgroundColor: color1, position: 'relative' }}>
                                                </div>

                                                {/* Right Color */}
                                                <div style={{ flex: 1, backgroundColor: color2, position: 'relative' }}>
                                                </div>

                                                {/* Full-Height Background Thunder Separator */}
                                                <div style={{
                                                    position: 'absolute',
                                                    left: '50%',
                                                    top: '50%',
                                                    transform: 'translate(-50%, -50%)',
                                                    height: '120%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    zIndex: 1,
                                                    opacity: 0.8
                                                }}>
                                                    <LuZap size={220} color="#ffbd00" strokeWidth={1.5} fill="#ffbd00" style={{ transform: 'rotate(15deg)' }} />
                                                </div>
                                            </div>

                                            {/* Top Info Banner */}
                                            <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.6)', zIndex: 2, borderBottom: '1px solid rgba(0,0,0,0.5)' }}>
                                                <div style={{ padding: '4px 10px', background: 'rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 10, color: '#fff', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px', maxWidth: '65%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {match.series_name || match.championship_name}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#fff', fontWeight: 900 }}>
                                                    <LuCalendarClock size={14} />
                                                    {dateStr}
                                                </div>
                                            </div>

                                            {/* Contenders */}
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 20px', zIndex: 2, background: 'rgba(0,0,0,0.2)' }}>
                                                {/* Team 1 */}
                                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
                                                    <div style={{ width: 64, height: 64, background: 'rgba(0,0,0,0.2)', borderRadius: '50%', padding: 8 }}>
                                                        <WikiImage name={team1Name} id={match.participants?.[0]?.id} type="team" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                    </div>
                                                    <span style={{ fontWeight: 900, fontSize: 16, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: 1.2, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>{team1Name}</span>
                                                </div>

                                                {/* Invisible Spacer to keep layout balanced around the background thunder */}
                                                <div style={{ width: 60, flexShrink: 0 }}></div>

                                                {/* Team 2 */}
                                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
                                                    <div style={{ width: 64, height: 64, background: 'rgba(0,0,0,0.2)', borderRadius: '50%', padding: 8 }}>
                                                        <WikiImage name={team2Name} id={match.participants?.[1]?.id} type="team" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                    </div>
                                                    <span style={{ fontWeight: 900, fontSize: 16, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: 1.2, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>{team2Name}</span>
                                                </div>
                                            </div>

                                            <div style={{ padding: '0 20px 20px 20px', zIndex: 1, background: 'rgba(0,0,0,0.2)' }}>
                                                {team ? (
                                                    <button style={{
                                                        width: '100%', padding: '14px', borderRadius: 16, background: '#22c55e', border: 'none', color: '#fff', fontSize: 14, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s', textTransform: 'uppercase', letterSpacing: '1px', boxShadow: '0 4px 20px rgba(34, 197, 94, 0.4)'
                                                    }}>
                                                        <LuUser size={18} /> Team Ready
                                                    </button>
                                                ) : (
                                                    <button style={{
                                                        width: '100%', padding: '14px', borderRadius: 16, background: '#fff', border: 'none', color: '#000', fontSize: 14, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textTransform: 'uppercase', letterSpacing: '1px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', transition: 'all 0.2s'
                                                    }}>
                                                        <LuSwords size={18} /> Build Squad
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default GameDashboard;
