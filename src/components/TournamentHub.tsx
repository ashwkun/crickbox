import React, { useState, useEffect, useMemo } from 'react';
import WikiImage from './WikiImage';
import PointsTable from './PointsTable';
import TournamentStats from './TournamentStats';
import { Match } from '../types';
import useCricketData from '../utils/useCricketData';
import { getTournamentAbbreviation, getMatchFormat } from '../utils/tournamentAbbreviations';
import { getLeagueLogo } from '../utils/leagueLogos';
import { getTournamentColor } from '../utils/tournamentColors';
import '../styles/TournamentHub.css';

interface TournamentHubProps {
    tournamentName: string;
    matches: Match[];
    onBack: () => void;
    onMatchClick: (match: Match) => void;
    isVisible?: boolean;
    style?: React.CSSProperties;
    seriesId?: string;
}

type Tab = 'fixtures' | 'table' | 'stats';

// Shorten series name for display (remove year)
const shortenSeriesName = (name: string | undefined): string => {
    if (!name) return '';
    return name
        .replace(/,?\s*\d{4}(-\d{2,4})?\/?(\d{2,4})?/g, '')
        .replace(/\s+Series$/i, '')
        .trim();
};

const TournamentHub: React.FC<TournamentHubProps> = ({
    tournamentName,
    matches,
    onBack,
    onMatchClick,
    style,
    isVisible = true,
    seriesId
}) => {
    const [activeTab, setActiveTab] = useState<Tab>('fixtures');
    const [pointsData, setPointsData] = useState<any[]>([]);
    const [loadingTable, setLoadingTable] = useState(false);
    const { fetchSeriesInfo } = useCricketData();

    // Check if we have a logo available from TheSportsDB
    const hasLogo = useMemo(() => {
        const logoData = getLeagueLogo(tournamentName);
        return logoData?.badge ? true : false;
    }, [tournamentName]);

    // Get abbreviation and format for fallback hero
    const abbreviation = getTournamentAbbreviation(tournamentName);
    const format = getMatchFormat(tournamentName);

    // Fetch Points Table when tab changes to 'table'
    useEffect(() => {
        if (activeTab === 'table' && pointsData.length === 0 && seriesId) {
            const loadPoints = async () => {
                setLoadingTable(true);
                try {
                    const data = await fetchSeriesInfo(seriesId);
                    const seriesData = Array.isArray(data) ? data[0] : data;
                    const teams = seriesData?.teams || [];
                    setPointsData(teams);
                } catch (err) {
                    console.error('Failed to load points table:', err);
                }
                setLoadingTable(false);
            };
            loadPoints();
        }
    }, [activeTab, seriesId]);

    // Sort matches by date
    const sortedMatches = useMemo(() =>
        [...matches].sort((a, b) =>
            new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
        ), [matches]);

    // Compute stats
    const stats = useMemo(() => {
        const uniqueTeams = new Set<string>();
        let completed = 0;
        let upcoming = 0;
        let live = 0;

        matches.forEach(m => {
            m.participants?.forEach(p => uniqueTeams.add(p.id));
            if (m.event_state === 'R' || m.event_state === 'C') completed++;
            else if (m.event_state === 'U') upcoming++;
            else if (m.event_state === 'L') live++;
        });

        return {
            teams: uniqueTeams.size,
            total: matches.length,
            completed,
            remaining: upcoming + live
        };
    }, [matches]);

    // Format helpers
    const formatDate = (dateStr: string): string => {
        const d = new Date(dateStr);
        return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const formatTime = (dateStr: string): string => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    const getMatchStatus = (match: Match): string => {
        if (match.event_state === 'U') {
            const isNext = sortedMatches.find(m => m.event_state === 'U')?.game_id === match.game_id;
            return isNext ? 'next' : 'upcoming';
        }
        if (match.event_state === 'L') return 'live';
        return 'completed';
    };

    const getResultText = (match: Match): string => {
        if (match.event_state === 'U') return formatTime(match.start_date);
        if (match.event_state === 'L') return 'LIVE';
        return match.short_event_status || 'Completed';
    };

    // Get tournament accent color for dynamic theming
    const accentColor = getTournamentColor(tournamentName);

    return (
        <div
            className="tournament-hub"
            style={{
                ...style,
                '--th-accent': accentColor,
                '--th-accent-light': `${accentColor}33`,
                '--th-accent-glow': `${accentColor}22`,
            } as React.CSSProperties}
        >
            {/* HERO SECTION (with integrated stats) */}
            <div className="th-hero">
                <div className="th-hero-content">
                    {/* Logo or Typography Fallback */}
                    <div className="th-hero-logo-container">
                        {hasLogo ? (
                            <WikiImage
                                name={tournamentName}
                                id={seriesId}
                                type="tournament"
                                className="th-hero-logo"
                                style={{ width: 56, height: 56, objectFit: 'contain' }}
                            />
                        ) : (
                            <div className="th-hero-abbreviation">
                                {abbreviation}
                            </div>
                        )}
                    </div>

                    <div className="th-hero-text">
                        <h1 className="th-hero-title">{shortenSeriesName(tournamentName)}</h1>
                        <div className="th-hero-subtitle">
                            <span className="th-format-badge">{format}</span>
                            <span className="th-hero-dot">·</span>
                            <span>{stats.teams} Teams</span>
                        </div>
                    </div>
                </div>

                {/* Stats bar inside hero */}
                <div className="th-stats-bar">
                    <div className="th-stat">
                        <span className="th-stat-num">{stats.teams}</span>
                        <span className="th-stat-lbl">Teams</span>
                    </div>
                    <div className="th-stat">
                        <span className="th-stat-num">{stats.total}</span>
                        <span className="th-stat-lbl">Games</span>
                    </div>
                    <div className="th-stat">
                        <span className="th-stat-num">{stats.completed}</span>
                        <span className="th-stat-lbl">Done</span>
                    </div>
                    <div className="th-stat">
                        <span className="th-stat-num">{stats.remaining}</span>
                        <span className="th-stat-lbl">Left</span>
                    </div>
                </div>
            </div>

            {/* TABS */}
            {seriesId && (
                <div className="th-tabs">
                    <button
                        className={`th-tab ${activeTab === 'fixtures' ? 'active' : ''}`}
                        onClick={() => setActiveTab('fixtures')}
                    >
                        Fixtures
                    </button>
                    <button
                        className={`th-tab ${activeTab === 'table' ? 'active' : ''}`}
                        onClick={() => setActiveTab('table')}
                    >
                        Table
                    </button>
                    <button
                        className={`th-tab ${activeTab === 'stats' ? 'active' : ''}`}
                        onClick={() => setActiveTab('stats')}
                    >
                        Stats
                    </button>
                </div>
            )}

            {/* TAB CONTENT */}
            <div className="th-content">
                {/* FIXTURES TAB */}
                {activeTab === 'fixtures' && (
                    <div className="th-fixtures">
                        {sortedMatches.map((match, idx) => {
                            const status = getMatchStatus(match);
                            const teams = match.participants || [];
                            return (
                                <div
                                    key={match.game_id || idx}
                                    className={`th-match-row ${status}`}
                                    onClick={() => onMatchClick(match)}
                                >
                                    <div className="th-match-date">
                                        {formatDate(match.start_date)}
                                    </div>
                                    <div className="th-match-teams">
                                        <span>{teams[0]?.short_name || '?'}</span>
                                        <span className="th-vs">vs</span>
                                        <span>{teams[1]?.short_name || '?'}</span>
                                    </div>
                                    <div className={`th-match-result ${status}`}>
                                        {status === 'live' && <span className="th-live-dot"></span>}
                                        {getResultText(match)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* TABLE TAB */}
                {activeTab === 'table' && (
                    <div className="th-table">
                        {loadingTable ? (
                            <div className="th-loading">Loading table...</div>
                        ) : (
                            <PointsTable standings={pointsData} matches={matches} />
                        )}
                    </div>
                )}

                {/* STATS TAB */}
                {activeTab === 'stats' && seriesId && (
                    <div className="th-stats">
                        <TournamentStats
                            seriesId={seriesId}
                            seriesName={tournamentName}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default TournamentHub;
