import React, { useState, useMemo } from 'react';
import WikiImage from './WikiImage';
import { MatchRow, ResultCard } from './MatchCards';
import { Match, Participant } from '../types';
import { getTeamColor } from '../utils/teamColors';
import '../styles/SeriesHub.css';

interface SeriesHubProps {
    seriesName: string;
    matches: Match[];
    onBack: () => void;
    onMatchClick: (match: Match) => void;
    isVisible?: boolean;
    style?: React.CSSProperties;
}

type SubTab = 'upcoming' | 'results';

// Parse winner from event_status text
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

    if (statusLower.includes('draw') || statusLower.includes('drawn')) {
        return 'DRAW';
    }

    return null;
};

// Calculate series standings
const calculateStandings = (matches: Match[], teams: Participant[]): { t1Wins: number, t2Wins: number, draws: number } => {
    let t1Wins = 0, t2Wins = 0, draws = 0;
    const t1Short = teams[0]?.short_name;
    const t2Short = teams[1]?.short_name;

    matches.forEach(m => {
        if (m.event_state === 'U' || m.event_state === 'L') return;
        const winner = parseWinner(m.event_status, m.participants);
        if (winner === 'DRAW') draws++;
        else if (winner === t1Short) t1Wins++;
        else if (winner === t2Short) t2Wins++;
    });

    return { t1Wins, t2Wins, draws };
};

const SeriesHub: React.FC<SeriesHubProps> = ({ seriesName, matches, onBack, onMatchClick, style }) => {
    const [subTab, setSubTab] = useState<SubTab>('upcoming');

    const teams = matches[0]?.participants?.slice(0, 2) || [];
    const team1 = teams[0];
    const team2 = teams[1];
    const tourName = (matches[0] as any)?.tour_name || '';

    // Sort matches by date
    const sortedMatches = useMemo(() =>
        [...matches].sort((a, b) =>
            new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
        ), [matches]);

    // Calculate standings
    const { t1Wins, t2Wins, draws } = useMemo(() =>
        calculateStandings(matches, teams), [matches, teams]);

    // Filter by tab
    const filteredMatches = useMemo(() => {
        if (subTab === 'results') {
            return sortedMatches
                .filter(m => m.event_state !== 'U')
                .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
        }
        return sortedMatches.filter(m => m.event_state === 'U' || m.event_state === 'L');
    }, [sortedMatches, subTab]);

    // Team colors for theming
    const color1 = getTeamColor(team1?.name);
    const color2 = getTeamColor(team2?.name);

    const heroGradient = (color1 && color2)
        ? `linear-gradient(135deg, ${color1}40 0%, transparent 50%, ${color2}40 100%)`
        : 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, transparent 100%)';

    return (
        <div className="series-hub-v2" style={style}>
            {/* HERO - H2H Style */}
            <div className="sh-hero" style={{ background: heroGradient }}>
                {/* Back Button */}
                <button className="sh-back" onClick={onBack}>
                    <span>←</span>
                </button>

                {/* Teams Face-off */}
                <div className="sh-teams">
                    <div className="sh-team">
                        <div className="sh-team-logo">
                            <WikiImage name={team1?.name} id={String(team1?.id || '0')} type="team" />
                        </div>
                        <span className="sh-team-name">{team1?.short_name || team1?.name || 'TBC'}</span>
                    </div>

                    <div className="sh-score-block">
                        <div className="sh-score">
                            <span className="sh-score-num">{t1Wins}</span>
                            <span className="sh-score-sep">-</span>
                            <span className="sh-score-num">{t2Wins}</span>
                        </div>
                        {draws > 0 && (
                            <div className="sh-draws">{draws} draw{draws > 1 ? 's' : ''}</div>
                        )}
                    </div>

                    <div className="sh-team">
                        <div className="sh-team-logo">
                            <WikiImage name={team2?.name} id={String(team2?.id || '0')} type="team" />
                        </div>
                        <span className="sh-team-name">{team2?.short_name || team2?.name || 'TBC'}</span>
                    </div>
                </div>

                {/* Series Name */}
                <h1 className="sh-title">{seriesName}</h1>
                {tourName && <div className="sh-tour">{tourName}</div>}
            </div>

            {/* TABS */}
            <div className="sh-tabs">
                <button
                    className={`sh-tab ${subTab === 'upcoming' ? 'active' : ''}`}
                    onClick={() => setSubTab('upcoming')}
                >
                    Upcoming
                </button>
                <button
                    className={`sh-tab ${subTab === 'results' ? 'active' : ''}`}
                    onClick={() => setSubTab('results')}
                >
                    Results
                </button>
            </div>

            {/* MATCHES */}
            <div className="sh-matches">
                {filteredMatches.length > 0 ? (
                    filteredMatches.map((match, idx) => (
                        subTab === 'results'
                            ? <ResultCard key={match.game_id || idx} match={match} onClick={() => onMatchClick(match)} />
                            : <MatchRow key={match.game_id || idx} match={match} onClick={() => onMatchClick(match)} />
                    ))
                ) : (
                    <div className="sh-empty">
                        {subTab === 'upcoming' ? 'No upcoming matches' : 'No results yet'}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SeriesHub;
