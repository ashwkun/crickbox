/**
 * TournamentStats.tsx
 *
 * Displays aggregated player stats for a tournament series.
 * Fetches data from Supabase views: top_run_scorers, top_wicket_takers
 */

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import WikiImage from './WikiImage';
import '../styles/TournamentStats.css';

// Supabase Client (using public anon key for read-only access)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

interface TournamentStatsProps {
    seriesId: string;
    seriesName?: string;
}

interface RunScorer {
    player_id: string;
    player_name: string;
    team_id: string;
    total_runs: number;
    matches_played: number;
    innings: number;
    average: number;
    strike_rate: number;
    highest_score: number;
    fifties: number;
    hundreds: number;
}

interface WicketTaker {
    player_id: string;
    player_name: string;
    team_id: string;
    total_wickets: number;
    matches_played: number;
    innings: number;
    economy: number;
    average: number;
    best_figures: string;
    four_wickets: number;
    five_wickets: number;
}

type StatTab = 'batting' | 'bowling';

const TournamentStats: React.FC<TournamentStatsProps> = ({ seriesId, seriesName }) => {
    const [activeTab, setActiveTab] = useState<StatTab>('batting');
    const [batters, setBatters] = useState<RunScorer[]>([]);
    const [bowlers, setBowlers] = useState<WicketTaker[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!supabase) {
            setError('Stats unavailable (database not configured)');
            setLoading(false);
            return;
        }

        const fetchStats = async () => {
            setLoading(true);
            setError(null);

            try {
                // Fetch top run scorers for this series
                const { data: runData, error: runError } = await supabase
                    .from('top_run_scorers')
                    .select('*')
                    .eq('series_id', seriesId)
                    .order('total_runs', { ascending: false })
                    .limit(10);

                if (runError) throw runError;
                setBatters(runData || []);

                // Fetch top wicket takers for this series
                const { data: wicketData, error: wicketError } = await supabase
                    .from('top_wicket_takers')
                    .select('*')
                    .eq('series_id', seriesId)
                    .order('total_wickets', { ascending: false })
                    .limit(10);

                if (wicketError) throw wicketError;
                setBowlers(wicketData || []);

            } catch (err: any) {
                console.error('Failed to fetch tournament stats:', err);
                setError('Failed to load stats');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [seriesId]);

    if (loading) {
        return (
            <div className="stats-loading">
                <div className="stats-spinner"></div>
                <span>Loading stats...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="stats-error">
                <span>⚠️ {error}</span>
            </div>
        );
    }

    const hasData = batters.length > 0 || bowlers.length > 0;

    if (!hasData) {
        return (
            <div className="stats-empty">
                <div className="stats-empty-icon">📊</div>
                <div className="stats-empty-text">No stats available yet</div>
                <div className="stats-empty-subtext">Stats will appear once matches are completed</div>
            </div>
        );
    }

    return (
        <div className="tournament-stats">
            {/* Sub-tabs for Batting / Bowling */}
            <div className="stats-sub-tabs">
                <button
                    className={`stats-sub-tab ${activeTab === 'batting' ? 'active' : ''}`}
                    onClick={() => setActiveTab('batting')}
                >
                    🏏 Most Runs
                </button>
                <button
                    className={`stats-sub-tab ${activeTab === 'bowling' ? 'active' : ''}`}
                    onClick={() => setActiveTab('bowling')}
                >
                    🎯 Most Wickets
                </button>
            </div>

            {/* Batting Stats */}
            {activeTab === 'batting' && (
                <div className="stats-list">
                    {batters.map((player, idx) => (
                        <div key={player.player_id} className="stats-card">
                            <div className="stats-rank">{idx + 1}</div>
                            <WikiImage
                                name={player.player_name}
                                type="player"
                                className="stats-player-img"
                            />
                            <div className="stats-player-info">
                                <div className="stats-player-name">{player.player_name}</div>
                                <div className="stats-player-meta">
                                    {player.innings} inn · SR {player.strike_rate?.toFixed(1) || '-'}
                                </div>
                            </div>
                            <div className="stats-primary-value">
                                <span className="stats-value">{player.total_runs}</span>
                                <span className="stats-label">runs</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Bowling Stats */}
            {activeTab === 'bowling' && (
                <div className="stats-list">
                    {bowlers.map((player, idx) => (
                        <div key={player.player_id} className="stats-card">
                            <div className="stats-rank">{idx + 1}</div>
                            <WikiImage
                                name={player.player_name}
                                type="player"
                                className="stats-player-img"
                            />
                            <div className="stats-player-info">
                                <div className="stats-player-name">{player.player_name}</div>
                                <div className="stats-player-meta">
                                    {player.innings} inn · Econ {player.economy?.toFixed(2) || '-'}
                                </div>
                            </div>
                            <div className="stats-primary-value">
                                <span className="stats-value">{player.total_wickets}</span>
                                <span className="stats-label">wkts</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TournamentStats;
