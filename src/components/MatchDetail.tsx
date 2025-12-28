import React from 'react';
import UpcomingDetail from './UpcomingDetail';
import LiveDetail from './LiveDetail';
import CompletedDetail from './CompletedDetail';
import { WallstreamData } from '../utils/wallstreamApi';

interface MatchDetailProps {
    match: any;
    scorecard: any;
    wallstream?: WallstreamData | null;
    onClose: () => void;
    onSeriesClick?: (seriesId: string, seriesMatches?: any[]) => void;
}

/**
 * MatchDetail - Router component that renders the appropriate detail view
 * based on match state (Upcoming, Live, or Completed)
 */
const MatchDetail: React.FC<MatchDetailProps> = ({ match, scorecard, wallstream, onClose, onSeriesClick }) => {
    // Route to appropriate component based on match state
    if (match.event_state === 'U') {
        return <UpcomingDetail match={match} onClose={onClose} onSeriesClick={onSeriesClick} />;
    }

    if (match.event_state === 'L') {
        return (
            <LiveDetail
                match={match}
                scorecard={scorecard}
                wallstream={wallstream}
                onClose={onClose}
                onSeriesClick={onSeriesClick}
            />
        );
    }

    // Default: Completed match
    return <CompletedDetail match={match} scorecard={scorecard} onClose={onClose} />;
};

export default MatchDetail;
