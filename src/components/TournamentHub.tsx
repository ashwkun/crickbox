import React, { useState, useEffect, useMemo } from 'react';
import WikiImage from './WikiImage';
import PointsTable from './PointsTable';
import TournamentStats from './TournamentStats';
import { Match } from '../types';
import useCricketData from '../utils/useCricketData';
import { getTournamentAbbreviation, getMatchFormat } from '../utils/tournamentAbbreviations';
import { getLeagueLogo } from '../utils/leagueLogos';
import { getTournamentColor } from '../utils/tournamentColors';
import { getTeamColor } from '../utils/teamColors';
import { isKnockoutStage, hasUndeterminedTeams } from '../utils/tbcMatch';
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
type FixturesSubTab = 'upcoming' | 'results' | 'knockouts';

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

            {/* TABS with sliding indicator */}
            {seriesId && (
                <div className="th-tabs">
                    {/* Sliding pill indicator */}
                    <div
                        className="th-tab-indicator"
                        style={{
                            transform: `translateX(${activeTab === 'fixtures' ? 0 : activeTab === 'table' ? 100 : 200}%)`
                        }}
                    />
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
                    <FixturesTab matches={sortedMatches} onMatchClick={onMatchClick} />
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

// === SUB COMPONENTS ===

const FixturesTab: React.FC<{ matches: Match[], onMatchClick: (m: Match) => void }> = ({ matches, onMatchClick }) => {
    const [subTab, setSubTab] = useState<FixturesSubTab>('upcoming');

    // Filter Logic
    const filteredMatches = useMemo(() => {
        if (subTab === 'knockouts') {
            return matches.filter(m => isKnockoutStage(m) || hasUndeterminedTeams(m));
        }
        if (subTab === 'results') {
            return matches
                .filter(m => m.event_state === 'R' || m.event_state === 'C')
                .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()); // Newest first
        }
        // Upcoming defaults (including Live)
        return matches.filter(m => m.event_state === 'U' || m.event_state === 'L');
    }, [matches, subTab]);

    // Grouping Logic
    const groupedMatches = useMemo(() => {
        if (subTab === 'knockouts') return null; // No date grouping for knockouts

        const groups: { [date: string]: Match[] } = {};
        filteredMatches.forEach(match => {
            const dateParams = { weekday: 'short', month: 'short', day: 'numeric' } as const;
            const d = new Date(match.start_date);
            const dateKey = d.toLocaleDateString(undefined, dateParams);

            // Allow relative keys like Today/Tomorrow for nicer UI
            const today = new Date();
            const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
            const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);

            let displayKey = dateKey;
            if (d.toDateString() === today.toDateString()) displayKey = 'Today';
            else if (d.toDateString() === tomorrow.toDateString()) displayKey = 'Tomorrow';
            else if (d.toDateString() === yesterday.toDateString()) displayKey = 'Yesterday';

            if (!groups[displayKey]) groups[displayKey] = [];
            groups[displayKey].push(match);
        });
        return groups;
    }, [filteredMatches, subTab]);

    // Auto-scroll to first item
    useEffect(() => {
        const el = document.querySelector('.th-fixtures-list');
        if (el) el.scrollTop = 0;
    }, [subTab]);

    return (
        <div className="th-fixtures">
            {/* Sub Tabs */}
            <div className="th-fixtures-tabs">
                {(['upcoming', 'results', 'knockouts'] as const).map(t => (
                    <button
                        key={t}
                        className={`th-sub-tab ${subTab === t ? 'active' : ''}`}
                        onClick={() => setSubTab(t)}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {/* Content List */}
            <div className="th-fixtures-list">
                {subTab === 'knockouts' ? (
                    filteredMatches.length > 0 ? (
                        filteredMatches.map(m => (
                            <KnockoutCard key={m.game_id} match={m} onClick={() => onMatchClick(m)} />
                        ))
                    ) : (
                        <div className="th-empty-state">No knockout matches detected yet.</div>
                    )
                ) : (
                    Object.keys(groupedMatches || {}).length > 0 ? (
                        Object.entries(groupedMatches!).map(([date, groupMatches]) => (
                            <div key={date} className="th-date-group">
                                <div className="th-date-header">
                                    <span>{date}</span>
                                </div>
                                {groupMatches.map((match, idx) => (
                                    <MatchRow key={match.game_id || idx} match={match} onClick={() => onMatchClick(match)} />
                                ))}
                            </div>
                        ))
                    ) : (
                        <div className="th-empty-state">
                            {subTab === 'upcoming' ? 'No upcoming matches scheduled.' : 'No completed matches yet.'}
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

const MatchRow: React.FC<{ match: Match, onClick: () => void }> = ({ match, onClick }) => {
    const teams = match.participants || [];
    const team1 = teams[0];
    const team2 = teams[1];

    // Formatting
    const formatTime = (d: string) => new Date(d).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });

    // Status Logic
    let status = 'completed';
    let statusText = match.short_event_status || 'Completed';

    if (match.event_state === 'U') {
        status = 'upcoming';
        statusText = 'Starts ' + formatTime(match.start_date);
    } else if (match.event_state === 'L') {
        status = 'live';
        statusText = match.short_event_status || 'LIVE';
    }

    // Dynamic Colors
    const color1 = getTeamColor(team1?.name);
    const color2 = getTeamColor(team2?.name);

    const bgStyle: React.CSSProperties = (color1 && color2)
        ? { backgroundImage: `radial-gradient(circle at -20% -20%, ${color1}50, transparent 60%), radial-gradient(circle at 120% 120%, ${color2}50, transparent 60%)` }
        : color1
            ? { backgroundImage: `radial-gradient(circle at -20% -20%, ${color1}40, transparent 70%)` }
            : {};

    // Venue Logic (Robust)
    const venue = match.venue_city || match.venue_name || match.venue || '';
    const displayVenue = venue.split(',')[0];

    return (
        <div className={`th-match-row ${status}`} onClick={onClick} style={bgStyle}>
            <div className="th-card-content">
                {/* Header: Venue/Date */}
                <div className="th-row-header">
                    <span>{displayVenue || 'Scheduled'}</span>
                    {!displayVenue && <span>{formatTime(match.start_date)}</span>}
                </div>

                {/* Team Rows */}
                <div className="th-team-item">
                    <WikiImage
                        name={team1?.name}
                        type="team"
                        className="th-team-logo"
                        style={{ width: 28, height: 28 }}
                    />
                    <div className="th-team-name">{team1?.name || 'TBC'}</div>
                </div>

                <div className="th-team-item">
                    <WikiImage
                        name={team2?.name}
                        type="team"
                        className="th-team-logo"
                        style={{ width: 28, height: 28 }}
                    />
                    <div className="th-team-name">{team2?.name || 'TBC'}</div>
                </div>

                {/* Footer: Result/Status */}
                <div className="th-match-footer">
                    <div className="th-footer-status">
                        {status === 'live' && <span className="th-live-badge">LIVE</span>}
                        <span>{statusText}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const KnockoutCard: React.FC<{ match: Match, onClick: () => void }> = ({ match, onClick }) => {
    const teams = match.participants || [];
    // Identify stage
    let stage = match.event_stage || match.event_name || 'Knockout';
    if (stage === 'final') stage = 'GRAND FINAL';
    const isFinal = /final/i.test(stage) && !/semi/i.test(stage) && !/quarter/i.test(stage);

    return (
        <div className={`th-knockout-card ${isFinal ? 'final' : ''}`} onClick={onClick}>
            <div className="th-ko-stage">{stage}</div>
            <div className="th-ko-teams">
                <div className="th-ko-team">
                    <WikiImage name={teams[0]?.name} type="team" className="th-ko-logo" style={{ width: 40, height: 40 }} />
                    <div className="th-ko-name">{teams[0]?.short_name || teams[0]?.name || 'TBC'}</div>
                </div>
                <div className="th-ko-vs">VS</div>
                <div className="th-ko-team">
                    <WikiImage name={teams[1]?.name} type="team" className="th-ko-logo" style={{ width: 40, height: 40 }} />
                    <div className="th-ko-name">{teams[1]?.short_name || teams[1]?.name || 'TBC'}</div>
                </div>
            </div>
            <div className="th-ko-result">
                {match.event_state === 'U' ? new Date(match.start_date).toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' }) : match.status_note || match.result || 'Match Completed'}
            </div>
        </div>
    )
}

export default TournamentHub;
