import React from 'react';
import WikiImage from '../WikiImage';
import { TopPlayer } from '../../utils/h2hApi';

interface TopPlayersProps {
    teams: Array<{
        id: number;
        name: string;
        short_name: string;
        top_players: {
            batsmen: { player: TopPlayer[] };
            bowler: { player: TopPlayer[] };
        };
    }>;
    venueName?: string;
}

const TopPlayers: React.FC<TopPlayersProps> = ({ teams, venueName }) => {
    if (!teams || teams.length === 0) return null;

    const renderPlayer = (player: TopPlayer, type: 'bat' | 'bowl') => (
        <div key={player.id} className="top-player-card">
            <WikiImage
                name={player.short_name}
                id={player.id?.toString()}
                type="player"
                style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }}
            />
            <div className="top-player-info">
                <div className="top-player-name">{player.short_name}</div>
                {player.icc_ranking && (
                    <div className="top-player-rank">#{player.icc_ranking} ICC</div>
                )}
            </div>
            <div className="top-player-stats">
                {type === 'bat' ? (
                    <>
                        <div className="stat-main">{player.runs} runs</div>
                        <div className="stat-sub">Avg {player.batting_average?.toFixed(1)}</div>
                    </>
                ) : (
                    <>
                        <div className="stat-main">{player.wickets} wkts</div>
                        <div className="stat-sub">Avg {player.bowling_average?.toFixed(1)}</div>
                    </>
                )}
            </div>
        </div>
    );

    return (
        <div className="top-players">
            <div className="top-players-header">
                Top Performers {venueName ? `at ${venueName}` : ''}
            </div>

            {teams.map((team, idx) => {
                const topBatsman = team.top_players?.batsmen?.player?.[0];
                const topBowler = team.top_players?.bowler?.player?.[0];

                if (!topBatsman && !topBowler) return null;

                return (
                    <div key={team.id || idx} className="top-players-team">
                        <div className="top-players-team-name">{team.short_name}</div>
                        <div className="top-players-list">
                            {topBatsman && renderPlayer(topBatsman, 'bat')}
                            {topBowler && renderPlayer(topBowler, 'bowl')}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default TopPlayers;
