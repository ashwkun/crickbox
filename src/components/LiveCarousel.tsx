import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import MatchCard from './MatchCard';
import { Match } from '../types';

interface LiveCarouselProps {
    matches: Match[];
    onMatchClick: (match: Match) => void;
    onSeriesClick: (seriesId: string) => void;
    activeIndex: number;
    onIndexChange: (index: number) => void;
}

const CARD_WIDTH = 300;
const GAP = 24;
const PADDING_X = 20;

const LiveCarousel: React.FC<LiveCarouselProps> = ({ matches, onMatchClick, onSeriesClick, activeIndex, onIndexChange }) => {
    // Simplified: Just use activeIndex for X, relying on CSS padding for centering
    const x = useMotionValue(-(activeIndex * (CARD_WIDTH + GAP)));

    // Animate to position whenever index changes
    useEffect(() => {
        const stride = CARD_WIDTH + GAP;
        const targetX = -(activeIndex * stride);

        animate(x, targetX, { type: "spring", stiffness: 300, damping: 30, bounce: 0.2 });
    }, [activeIndex, x]);

    const handleDragEnd = (e: any, { offset, velocity }: any) => {
        const swipe = offset.x;
        let nextIndex = activeIndex;

        // Tuning sensitivity - stronger snap
        if (swipe < -40 || velocity.x < -400) {
            nextIndex = Math.min(matches.length - 1, activeIndex + 1);
        } else if (swipe > 40 || velocity.x > 400) {
            nextIndex = Math.max(0, activeIndex - 1);
        }

        onIndexChange(nextIndex);
    };

    return (
        <div style={{ width: '100%', overflow: 'hidden', position: 'relative', paddingTop: 10, paddingBottom: 10 }}>
            <motion.div
                style={{
                    x,
                    display: 'flex',
                    gap: GAP,
                    cursor: 'grab',
                    width: 'max-content',
                    // CSS Centering: 50% of container - Half Card
                    // This ensures layout engine handles the math instantly
                    paddingLeft: `calc(50% - ${CARD_WIDTH / 2}px)`,
                    paddingRight: `calc(50% - ${CARD_WIDTH / 2}px)`,
                    boxSizing: 'border-box'
                }}
                drag="x"
                dragConstraints={{
                    // Constraints relative to the padded container
                    left: -((matches.length * (CARD_WIDTH + GAP)) - (CARD_WIDTH + GAP)),
                    right: CARD_WIDTH
                }}
                onDragEnd={handleDragEnd}
                whileTap={{ cursor: 'grabbing' }}
            >
                {matches.map((match, i) => (
                    <motion.div
                        key={match.game_id}
                        initial={{ scale: 0.9, opacity: 0.8 }}
                        animate={{
                            scale: i === activeIndex ? 1 : 0.92,
                            opacity: 1,
                        }}
                        transition={{ duration: 0.3 }}
                        style={{
                            minWidth: CARD_WIDTH,
                            maxWidth: CARD_WIDTH,
                        }}
                    >
                        <MatchCard
                            match={match}
                            onClick={onMatchClick}
                            isHero={true}
                            onSeriesClick={(seriesId) => onSeriesClick(seriesId)}
                        />
                    </motion.div>
                ))}
            </motion.div>

            {/* Pagination Dots */}
            {matches.length > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 16 }}>
                    {matches.map((_, idx) => {
                        // Simple sliding window logic for dots if too many
                        // Only show 5 dots around active index?
                        // Let's implement the previous logic or simpler
                        const isActive = idx === activeIndex;

                        // Visibility window
                        if (Math.abs(idx - activeIndex) > 3) return null; // Simple window

                        return (
                            <motion.div
                                key={idx}
                                animate={{
                                    width: isActive ? 24 : 6,
                                    height: 6,
                                    backgroundColor: isActive ? '#fff' : 'rgba(255,255,255,0.3)'
                                }}
                                style={{
                                    borderRadius: 3,
                                }}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default LiveCarousel;
