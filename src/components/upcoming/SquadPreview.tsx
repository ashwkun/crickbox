import React from 'react';
import WikiImage from '../WikiImage';
import { SquadData, SquadPlayer } from '../../utils/h2hApi';

interface SquadPreviewProps {
    squad1: SquadData | null;
    squad2: SquadData | null;
}

const SquadPreview: React.FC<SquadPreviewProps> = ({ squad1, squad2 }) => {
    if (!squad1 && !squad2) return null;

    const renderSquad = (squad: SquadData | null) => {
        if (!squad || !squad.players) return null;

        // Sort: Captain first, then Keeper, then by role
        const sortedPlayers = [...squad.players].sort((a, b) => {
            if (a.is_captain) return -1;
            if (b.is_captain) return 1;
            if (a.is_keeper) return -1;
            if (b.is_keeper) return 1;
            return 0;
        });

        const getRoleBadge = (player: SquadPlayer) => {
            if (player.is_captain) return 'C';
            if (player.is_keeper) return 'WK';
            return null;
        };

        const getRoleIcon = (player: SquadPlayer) => {
            const role = player.role?.toLowerCase() || '';
            if (role.includes('batter') || role.includes('batsman')) return '🏏';
            if (role.includes('bowler')) return '🎳';
            if (role.includes('all')) return '⚡';
            return '';
        };

        return (
            <div className="squad-team">
                <div className="squad-team-header">{squad.team_short_name || squad.team_name}</div>
                <div className="squad-players">
                    {sortedPlayers.slice(0, 11).map((player, idx) => (
                        <div key={player.player_id || idx} className="squad-player">
                            <WikiImage
                                name={player.short_name || player.player_name}
                                id={player.player_id?.toString()}
                                type="player"
                                style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                            />
                            <div className="squad-player-info">
                                <span className="squad-player-name">
                                    {player.short_name || player.player_name}
                                    {getRoleBadge(player) && (
                                        <span className="squad-badge">{getRoleBadge(player)}</span>
                                    )}
                                </span>
                                <span className="squad-player-role">
                                    {getRoleIcon(player)} {player.role || player.skill || ''}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="squad-preview">
            <div className="squad-header">Squad Preview</div>
            <div className="squad-teams">
                {renderSquad(squad1)}
                {renderSquad(squad2)}
            </div>
        </div>
    );
};

export default SquadPreview;
