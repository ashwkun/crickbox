import React from 'react';
import UpcomingDetail from './UpcomingDetail';
import LiveDetail from './LiveDetail';
import CompletedDetail from './CompletedDetail';
import { Match, Scorecard, WallstreamData } from '../types';
import { HeaderDisplayData } from './FloatingHeader';

interface MatchDetailProps {
    match: Match;
    scorecard: Scorecard;
    wallstream?: WallstreamData | null;
    onClose: () => void;
    onSeriesClick?: (seriesId: string, seriesMatches?: any[]) => void;
    setHeaderData: (data: HeaderDisplayData | null) => void;
    isVisible?: boolean;
    zIndex?: number;
}

/**
 * MatchDetail - Router component that renders the appropriate detail view
 * based on match state (Upcoming, Live, or Completed)
 */
const MatchDetail: React.FC<MatchDetailProps> = ({
    match, scorecard, wallstream, onClose, onSeriesClick, setHeaderData, isVisible = true, zIndex
}) => {
    // Check for forceLive URL parameter (for testing)
    const params = new URLSearchParams(window.location.search);
    const forceLive = params.get('forceLive') === 'true';

    // 1. Force Live Override (Testing)
    if (forceLive) {
        return (
            <LiveDetail
                match={match}
                scorecard={scorecard}
                wallstream={wallstream}
                onClose={onClose}
                onSeriesClick={onSeriesClick}
                setHeaderData={setHeaderData}
                isVisible={isVisible}
                style={zIndex ? { zIndex } : undefined}
            />
        );
    }

    // 2. Upcoming Match
    if (match.event_state === 'U') {
        return (
            <UpcomingDetail
                match={match}
                onClose={onClose}
                onSeriesClick={onSeriesClick}
                style={zIndex ? { zIndex } : undefined}
            />
        );
    }

    // 3. Live Match
    if (match.event_state === 'L') {
        return (
            <LiveDetail
                match={match}
                scorecard={scorecard}
                wallstream={wallstream}
                onClose={onClose}
                onSeriesClick={onSeriesClick}
                setHeaderData={setHeaderData}
                isVisible={isVisible}
                style={zIndex ? { zIndex } : undefined}
            />
        );
    }

    // Default: Completed match
    return (
        <CompletedDetail
            match={match}
            scorecard={scorecard}
            onClose={onClose}
            style={zIndex ? { zIndex } : undefined}
        />
    );
};

export default MatchDetail;
