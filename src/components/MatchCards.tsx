import React from 'react';
import WikiImage from './WikiImage';
import { Match } from '../types';
import { getTeamColor } from '../utils/teamColors';

// === SHARED MATCH CARD COMPONENTS ===

// MatchRow - for upcoming matches (VS style)
export const MatchRow: React.FC<{ match: Match, onClick: () => void }> = ({ match, onClick }) => {
    const teams = match.participants || [];
    const team1 = teams[0];
    const team2 = teams[1];

    const matchTime = new Date(match.start_date).toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });

    const isLive = match.event_state === 'L';
    const isCompleted = match.event_state === 'R' || match.event_state === 'C';

    const color1 = getTeamColor(team1?.name);
    const color2 = getTeamColor(team2?.name);

    const bgGradient = (color1 && color2)
        ? `radial-gradient(circle at 0% 50%, ${color1}35, transparent 55%), radial-gradient(circle at 100% 50%, ${color2}35, transparent 55%), #1a1a1a`
        : '#1a1a1a';

    return (
        <div className="new-match-card" onClick={onClick} style={{ background: bgGradient }}>
            {/* BG Watermarks */}
            <div className="new-match-bg new-match-bg-left">
                <WikiImage name={team1?.name} id={String(team1?.id || '0')} type="team" />
            </div>
            <div className="new-match-bg new-match-bg-right">
                <WikiImage name={team2?.name} id={String(team2?.id || '0')} type="team" />
            </div>

            {/* Teams Row */}
            <div className="new-match-teams">
                <div className="new-team">
                    <div className="new-team-logo">
                        <WikiImage name={team1?.name} id={String(team1?.id || '0')} type="team" />
                    </div>
                    <div className="new-team-name">{team1?.name || 'TBC'}</div>
                </div>

                <div className="new-match-center">
                    {isLive && <span className="new-live">LIVE</span>}
                    {!isLive && !isCompleted && <span className="new-vs">VS</span>}
                    {isCompleted && match.result && <span className="new-result">{match.result}</span>}
                    <span className="new-time-chip">{matchTime.toUpperCase()}</span>
                </div>

                <div className="new-team">
                    <div className="new-team-logo">
                        <WikiImage name={team2?.name} id={String(team2?.id || '0')} type="team" />
                    </div>
                    <div className="new-team-name">{team2?.name || 'TBC'}</div>
                </div>
            </div>
        </div>
    );
};

// ResultCard - for completed matches (score display)
export const ResultCard: React.FC<{ match: Match, onClick: () => void }> = ({ match, onClick }) => {
    const team1 = match.participants?.[0];
    const team2 = match.participants?.[1];

    const winnerId = match.participants?.find(p => p.highlight === 'true')?.id ||
        (match.short_event_status?.includes(team1?.short_name || 'ZZZ') ? team1?.id :
            match.short_event_status?.includes(team2?.short_name || 'ZZZ') ? team2?.id : null);

    const isDraw = match.result_code === 'D';
    const isT1Winner = !isDraw && team1?.id === winnerId;
    const isT2Winner = !isDraw && team2?.id === winnerId;

    const color1 = getTeamColor(team1?.name);
    const color2 = getTeamColor(team2?.name);

    let bgGradient = '#1a1a1a';
    if (color1 && color2) {
        bgGradient = `radial-gradient(circle at top left, ${color1}30, transparent 50%), radial-gradient(circle at bottom right, ${color2}30, transparent 50%), #1a1a1a`;
    }

    const renderScore = (score: string | undefined, isWinner: boolean) => {
        if (!score) return <span style={{ color: 'rgba(255,255,255,0.3)' }}>-</span>;
        const cleanScore = score.replace(/\s*\([^)]*\)/g, '');
        return (
            <span style={{
                fontSize: '13px',
                fontWeight: isWinner ? 700 : 500,
                color: isWinner ? '#fff' : 'rgba(255,255,255,0.6)'
            }}>
                {cleanScore}
            </span>
        );
    };

    return (
        <div className="result-card" onClick={onClick} style={{ background: bgGradient }}>
            <div className="result-teams">
                <div className="result-team-row">
                    <div className="result-team-info">
                        <WikiImage name={team1?.name} id={String(team1?.id || '0')} type="team" className="result-logo" />
                        <span className={`result-team-name ${isT1Winner ? 'winner' : ''}`}>{team1?.name || 'TBC'}</span>
                    </div>
                    {renderScore(team1?.value, isT1Winner)}
                </div>
                <div className="result-team-row">
                    <div className="result-team-info">
                        <WikiImage name={team2?.name} id={String(team2?.id || '0')} type="team" className="result-logo" />
                        <span className={`result-team-name ${isT2Winner ? 'winner' : ''}`}>{team2?.name || 'TBC'}</span>
                    </div>
                    {renderScore(team2?.value, isT2Winner)}
                </div>
            </div>
            <div className="result-summary">{match.short_event_status || match.result || 'Match Completed'}</div>
        </div>
    );
};
