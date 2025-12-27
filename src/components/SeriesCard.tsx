import React from 'react';
import WikiImage from './WikiImage';
import { Match, Participant } from '../types';

interface SeriesCardProps {
    seriesName: string;
    matches: Match[];
    onClick: (match: Match) => void;
}

interface Standings {
    wins: Record<string, number>;
    draws: number;
}

// Parse winner from event_status text like "India won by 295 runs"
const parseWinner = (status: string | undefined, participants: Participant[] | undefined): string | null => {
    if (!status) return null;
    const statusLower = status.toLowerCase();

    for (const p of participants || []) {
        const name = p.name?.toLowerCase() || '';
        const shortName = p.short_name?.toLowerCase() || '';
        if (statusLower.includes(name + ' won') || statusLower.includes(shortName + ' won')) {
            return p.short_name;
        }
    }

    // Check for draw
    if (statusLower.includes('draw') || statusLower.includes('drawn')) {
        return 'DRAW';
    }

    return null;
};

// Calculate series standings from completed matches
const calculateStandings = (seriesMatches: Match[]): Standings => {
    const wins: Record<string, number> = {};
    let draws = 0;

    seriesMatches.forEach(m => {
        if (m.event_state === 'U') return; // Skip upcoming

        const winner = parseWinner(m.event_status, m.participants);
        if (winner === 'DRAW') {
            draws++;
        } else if (winner) {
            wins[winner] = (wins[winner] || 0) + 1;
        }
    });

    return { wins, draws };
};

// Normalize format to only ODI, TEST, or T20
const normalizeFormat = (format: string | undefined): string => {
    if (!format) return '';
    const f = format.toUpperCase();
    if (f.includes('TEST')) return 'TEST';
    if (f.includes('ODI') || f.includes('OD') || f.includes('LIST')) return 'ODI';
    return 'T20';
};

// Series Card for bilateral tours (2 teams)
const SeriesCard: React.FC<SeriesCardProps> = ({ seriesName, matches, onClick }) => {
    // Get teams from first match
    const teams = matches[0]?.participants || [];

    // Find next upcoming match
    const nextMatch = matches
        .filter(m => m.event_state === 'U')
        .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())[0];

    // Calculate standings
    const { wins, draws } = calculateStandings(matches);

    // Count remaining matches
    const remaining = matches.filter(m => m.event_state === 'U').length;

    // Format standings text
    const formatStandings = () => {
        const teamNames = teams.map(t => t.short_name);
        if (teamNames.length < 2) return '';

        const [t1, t2] = teamNames;
        const w1 = wins[t1] || 0;
        const w2 = wins[t2] || 0;

        if (w1 === 0 && w2 === 0 && draws === 0) return 'Series begins';

        let text = `${t1} ${w1}-${w2} ${t2}`;
        if (draws > 0) text += ` (${draws} draw${draws > 1 ? 's' : ''})`;
        return text;
    };

    // Format next match date
    const formatNextMatch = () => {
        if (!nextMatch) return 'Series completed';
        const date = new Date(nextMatch.start_date);
        const day = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
        const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
        const format = normalizeFormat(nextMatch.event_format);
        const eventName = nextMatch.event_name || '';
        return `${day}, ${time} · ${eventName} · ${format}`;
    };

    return (
        <div className="series-card" onClick={() => nextMatch && onClick(nextMatch)}>
            {/* Series Title */}
            <div className="series-title">{seriesName}</div>

            {/* Teams Row */}
            <div className="series-teams">
                {teams.slice(0, 2).map((team, idx) => (
                    <React.Fragment key={idx}>
                        <div className="series-team">
                            <WikiImage
                                name={team.name}
                                id={team.id}
                                type="team"
                                style={{ maxHeight: 48, width: 'auto', height: 'auto', borderRadius: 12, background: '#1a1a1a', padding: 4 }}
                            />
                            <span className="series-team-name">{team.short_name}</span>
                        </div>
                        {idx === 0 && <span className="series-vs">vs</span>}
                    </React.Fragment>
                ))}
            </div>

            {/* Standings */}
            <div className="series-standings">{formatStandings()}</div>

            {/* Divider */}
            <div className="series-divider"></div>

            {/* Next Match Info */}
            <div className="series-next">
                <span className="series-next-label">NEXT</span>
                <span className="series-next-info">{formatNextMatch()}</span>
            </div>

            {/* Remaining count */}
            {remaining > 0 && (
                <div className="series-remaining">{remaining} match{remaining !== 1 ? 'es' : ''} remaining</div>
            )}
        </div>
    );
};

export default SeriesCard;
