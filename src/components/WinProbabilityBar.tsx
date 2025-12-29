import React, { useEffect, useState } from 'react';
import { WinProbabilityResult } from '../utils/winProbability';

interface WinProbabilityBarProps {
    data: WinProbabilityResult | null;
    isLoading?: boolean;
}

const WinProbabilityBar: React.FC<WinProbabilityBarProps> = ({ data, isLoading }) => {
    // Animation state
    const [animatedProb, setAnimatedProb] = useState(50);

    useEffect(() => {
        if (data?.team1.probability) {
            setAnimatedProb(data.team1.probability);
        }
    }, [data]);

    if (isLoading) {
        return (
            <div className="w-full bg-white/5 rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-1/3 mb-4"></div>
                <div className="h-6 bg-white/10 rounded-full w-full"></div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="w-full bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-4 my-2">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-white/80 text-xs font-medium uppercase tracking-wider">
                    Win Probability
                </h3>
                {data.message && (
                    <span className="text-[10px] text-white/40 bg-white/5 px-2 py-0.5 rounded">
                        {data.message}
                    </span>
                )}
            </div>

            {/* Bar Container */}
            <div className="relative h-6 w-full rounded-full overflow-hidden bg-gray-800 flex">
                {/* Team 1 Bar */}
                <div
                    className="h-full bg-gradient-to-r from-[#e87070] to-[#c53030] flex items-center justify-start pl-3 transition-all duration-1000 ease-out relative"
                    style={{ width: `${animatedProb}%` }}
                >
                    <span className="text-[10px] font-bold text-white whitespace-nowrap z-10 drop-shadow-md">
                        {data.team1.name} {Math.round(animatedProb)}%
                    </span>
                    {/* Skewed shine effect */}
                    <div className="absolute top-0 right-0 w-8 h-full bg-white/20 skew-x-[-20deg] translate-x-4 blur-sm transform"></div>
                </div>

                {/* Team 2 Bar (Remaining width) */}
                <div className="flex-1 bg-gray-700/50 flex items-center justify-end pr-3 transition-all duration-1000 relative">
                    <span className="text-[10px] font-bold text-white/80 whitespace-nowrap z-10">
                        {Math.round(100 - animatedProb)}% {data.team2.name}
                    </span>
                </div>
            </div>

            {/* Factors (Optional / Advanced) */}
            {data.phase && (
                <div className="mt-2 flex justify-between text-[9px] text-white/30">
                    <span>{data.phase.replace('-', ' ').toUpperCase()} MODEL</span>
                    <span>UPDATED LIVE</span>
                </div>
            )}
        </div>
    );
};

export default WinProbabilityBar;
