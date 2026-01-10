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

// Shorten series name
const shortenSeriesName = (name: string | undefined): string => {
    if (!name) return '';
    return name
        .replace(/,?\s*\d{4}(-\d{2,4})?\/?(\/\d{2,4})?/g, '')
        .replace(/\s+Series$/i, '')
        .trim();
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

    // Stats
    const totalMatches = matches.length;
    const completed = matches.filter(m => m.event_state !== 'U' && m.event_state !== 'L').length;
    const remaining = totalMatches - completed;

    return (
        <div
            className="series-hub-v2"
            style={{
                ...style,
                '--sh-color1': color1 || '#6366f1',
                '--sh-color2': color2 || '#8b5cf6',
            } as React.CSSProperties}
        >
            {/* HERO - Extends under FloatingHeader */}
            <div className="sh-hero">
                {/* Teams Face-off */}
                <div className="sh-teams">
                    <div className="sh-team">
                        <div className="sh-team-logo">
                            <WikiImage name={team1?.name} id={String(team1?.id || '0')} type="team" />
                        </div>
                        <span className="sh-team-name">{team1?.name || 'TBC'}</span>
                    </div>

                    <div className="sh-vs">VS</div>

                    <div className="sh-team">
                        <div className="sh-team-logo">
                            <WikiImage name={team2?.name} id={String(team2?.id || '0')} type="team" />
                        </div>
                        <span className="sh-team-name">{team2?.name || 'TBC'}</span>
                    </div>
                </div>

                {/* Series Name */}
                <h1 className="sh-title">{shortenSeriesName(seriesName)}</h1>
                {tourName && <div className="sh-tour">{tourName}</div>}

                {/* Stats Bar - like TournamentHub */}
                <div className="sh-stats-bar">
                    <div className="sh-stat">
                        <span className="sh-stat-num">{t1Wins}</span>
                        <span className="sh-stat-lbl">{team1?.short_name || 'T1'}</span>
                    </div>
                    <div className="sh-stat">
                        <span className="sh-stat-num">{draws}</span>
                        <span className="sh-stat-lbl">Draws</span>
                    </div>
                    <div className="sh-stat">
                        <span className="sh-stat-num">{t2Wins}</span>
                        <span className="sh-stat-lbl">{team2?.short_name || 'T2'}</span>
                    </div>
                    <div className="sh-stat-divider" />
                    <div className="sh-stat">
                        <span className="sh-stat-num">{remaining}</span>
                        <span className="sh-stat-lbl">Left</span>
                    </div>
                </div>
            </div>

            {/* TABS - Same pill style as TournamentHub */}
            <div className="sh-tabs">
                <div
                    className="sh-tab-indicator"
                    style={{ transform: `translateX(${subTab === 'upcoming' ? 0 : 100}%)` }}
                />
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
            <div className="sh-content">
                <div className="sh-master-card">
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
        </div>
    );
};

export default SeriesHub;
