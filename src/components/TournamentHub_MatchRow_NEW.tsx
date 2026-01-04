// NEW CLEAN MATCH ROW - MINIMAL DESIGN
// Only: Time, Team Logos, Team Names, Team Colors, BG Watermarks

import React from 'react';
import WikiImage from './WikiImage';
import { Match } from '../types';
import { getTeamColor } from '../utils/teamColors';

const MatchRow: React.FC<{ match: Match, onClick: () => void }> = ({ match, onClick }) => {
    const teams = match.participants || [];
    const team1 = teams[0];
    const team2 = teams[1];

    // Time
    const matchTime = new Date(match.start_date).toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });

    // Status
    const isLive = match.event_state === 'L';
    const isCompleted = match.event_state === 'R' || match.event_state === 'C';

    // Colors
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

            <div className="new-match-inner">
                {/* Time */}
                <div className="new-match-time">{matchTime}</div>

                {/* Teams Row */}
                <div className="new-match-teams">
                    {/* Team 1 */}
                    <div className="new-team">
                        <div className="new-team-logo">
                            <WikiImage name={team1?.name} id={String(team1?.id || '0')} type="team" />
                        </div>
                        <div className="new-team-name">{team1?.name || 'TBC'}</div>
                    </div>

                    {/* VS / Result */}
                    <div className="new-match-vs">
                        {isLive && <span className="new-live">LIVE</span>}
                        {!isLive && !isCompleted && <span>VS</span>}
                        {isCompleted && match.result && <span className="new-result">{match.result}</span>}
                    </div>

                    {/* Team 2 */}
                    <div className="new-team">
                        <div className="new-team-logo">
                            <WikiImage name={team2?.name} id={String(team2?.id || '0')} type="team" />
                        </div>
                        <div className="new-team-name">{team2?.name || 'TBC'}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MatchRow;
