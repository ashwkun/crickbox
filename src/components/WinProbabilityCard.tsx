import React from 'react';
import WinProbabilityBar from './WinProbabilityBar';
import { WinProbabilityResult } from '../utils/winProbability';

interface WinProbabilityCardProps {
    data: WinProbabilityResult | null;
}

const WinProbabilityCard: React.FC<WinProbabilityCardProps> = ({ data }) => {
    if (!data) return null;

    // Just wrap the Bar in expanded mode. 
    // The Bar handles all styling (Card, Glass, etc.)
    return (
        <WinProbabilityBar data={data} expanded={true} />
    );
};

export default WinProbabilityCard;
