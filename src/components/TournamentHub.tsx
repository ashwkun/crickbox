import React, { useState, useEffect } from 'react';
import WikiImage from './WikiImage';
import PointsTable from './PointsTable';
import TournamentStats from './TournamentStats';
import { Match } from '../types';
import useCricketData from '../utils/useCricketData';
import '../styles/PointsTable.css';

interface TournamentHubProps {
    tournamentName: string;
    matches: Match[];
    onBack: () => void;
    onMatchClick: (match: Match) => void;
    isVisible?: boolean;
    style?: React.CSSProperties;
    seriesId?: string; // Need seriesId to fetch points table
}

type Tab = 'fixtures' | 'table' | 'stats';

// Shorten series name for display
const shortenSeriesName = (name: string | undefined): string => {
    if (!name) return '';
    const bilateralMatch = name.match(/(\d+)\s*(T20I?|ODI|Test|Youth ODI|Youth T20I)/i);
    if (bilateralMatch) {
        return `${bilateralMatch[1]} ${bilateralMatch[2].toUpperCase()}`;
    }
    return name
        .replace(/,?\s*\d{4}(\/\d{2,4})?/g, '')
        .replace(/\s+Series$/i, '')
        .trim();
};

// Tournament Hub - Shows matches, points table, and stats
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

    // Fetch Points Table when tab changes to 'table'
    useEffect(() => {
        if (activeTab === 'table' && pointsData.length === 0 && seriesId) {
            const loadPoints = async () => {
                setLoadingTable(true);
                const data = await fetchSeriesInfo(seriesId);
                // Extract standings from response
                // Structure: data.series.standings.groups[0].team
                const teams = data?.series?.standings?.groups?.[0]?.team || [];
                setPointsData(teams);
                setLoadingTable(false);
            };
            loadPoints();
        }
    }, [activeTab, seriesId]);

    // Sort matches by date
    const sortedMatches = [...matches].sort((a, b) =>
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    );

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

    // Get unique teams count
    const uniqueTeams = new Set<string>();
    matches.forEach(m => {
        m.participants?.forEach(p => uniqueTeams.add(p.short_name));
    });

    return (
        <div className="tournament-hub" style={style}>
            {/* Header */}
            <div className="tournament-hub-header">
                <button className="back-button" onClick={onBack}>
                    ← Back
                </button>
            </div>

            {/* Tournament Info */}
            <div className="tournament-hub-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                    <WikiImage
                        name={tournamentName}
                        id={tournamentName?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}
                        type="tournament"
                        style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'contain' }}
                    />
                    <div>
                        <h1 className="tournament-hub-title">{shortenSeriesName(tournamentName)}</h1>
                        <div className="tournament-hub-meta">{uniqueTeams.size} teams · {matches.length} matches</div>
                    </div>
                </div>

                {/* Tabs */}
                {seriesId && (
                    <div className="tournament-tabs">
                        <button
                            className={`tab-item ${activeTab === 'fixtures' ? 'active' : ''}`}
                            onClick={() => setActiveTab('fixtures')}
                        >
                            Fixtures
                        </button>
                        <button
                            className={`tab-item ${activeTab === 'table' ? 'active' : ''}`}
                            onClick={() => setActiveTab('table')}
                        >
                            Table
                        </button>
                        <button
                            className={`tab-item ${activeTab === 'stats' ? 'active' : ''}`}
                            onClick={() => setActiveTab('stats')}
                        >
                            Stats
                        </button>
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="tournament-content">

                {/* 1. FIXTURES TAB */}
                {activeTab === 'fixtures' && (
                    <div className="tournament-hub-matches">
                        <div className="section-header" style={{ padding: '0 0 16px 0' }}>
                            <h3 className="section-title">Fixtures</h3>
                            <div className="section-line"></div>
                        </div>

                        {sortedMatches.map((match, idx) => {
                            const status = getMatchStatus(match);
                            const teams = match.participants || [];
                            return (
                                <div
                                    key={match.game_id || idx}
                                    className={`tournament-match-row ${status}`}
                                    onClick={() => onMatchClick(match)}
                                >
                                    <div className="tournament-match-date">
                                        <span className="tournament-date">{formatDate(match.start_date)}</span>
                                    </div>
                                    <div className="tournament-match-teams">
                                        <span className="tournament-team">{teams[0]?.short_name || '?'}</span>
                                        <span className="tournament-vs">vs</span>
                                        <span className="tournament-team">{teams[1]?.short_name || '?'}</span>
                                    </div>
                                    <div className={`tournament-match-result ${status}`}>
                                        {status === 'live' && <span className="live-dot"></span>}
                                        {getResultText(match)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* 2. POINTS TABLE TAB */}
                {activeTab === 'table' && (
                    <div className="tournament-table-view">
                        <div className="section-header">
                            <h3 className="section-title">Points Table</h3>
                            <div className="section-line"></div>
                        </div>

                        {loadingTable ? (
                            <div className="loading-spinner">Loading table...</div>
                        ) : (
                            <PointsTable standings={pointsData} />
                        )}
                    </div>
                )}

                {/* 3. STATS TAB */}
                {activeTab === 'stats' && seriesId && (
                    <div className="tournament-stats-view">
                        <div className="section-header">
                            <h3 className="section-title">Player Stats</h3>
                            <div className="section-line"></div>
                        </div>
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
