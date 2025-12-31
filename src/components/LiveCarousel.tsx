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
const GAP = 16;
const PADDING_X = 20;

const LiveCarousel: React.FC<LiveCarouselProps> = ({ matches, onMatchClick, onSeriesClick, activeIndex, onIndexChange }) => {
    // const [activeIndex, setActiveIndex] = useState(0); // Removed local state
    const containerRef = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);

    // Calculate constraints
    // We want the FIRST card to be centered when index=0.
    // Center offset = (WindowWidth - CardWidth) / 2
    // BUT since we can't easily adhere to window width in SSR/initial render without hydration issues,
    // we usually start at padding left.
    // Let's stick to a simple strategy:
    // Left align logic but we animate to center.
    // Actually, "Snap to Center" means the ACTIVE card is in the center of the viewport.

    // Simplification: Assume window width 390 (average mobile) for initial, then measure.
    const [centerOffset, setCenterOffset] = useState(20);

    useEffect(() => {
        const updateOffset = () => {
            if (containerRef.current) {
                const viewportWidth = containerRef.current.offsetWidth;
                // Offset to center the card:
                // (Viewport / 2) - (Card / 2)
                // But our container starts at left edge usually.
                const offset = (viewportWidth - CARD_WIDTH) / 2;
                setCenterOffset(offset);

                // Re-snap to current active index with new offset
                // We don't want to animate here, just jump or let the next render handle it?
                // Best to animate to keep it stable.
                snapTo(activeIndex, offset);
            }
        };

        updateOffset();
        window.addEventListener('resize', updateOffset);
        return () => window.removeEventListener('resize', updateOffset);
    }, [activeIndex]);


    const snapTo = (index: number, offset = centerOffset) => {
        const targetX = -(index * (CARD_WIDTH + GAP)) + offset;
        // Clamp: We might want the first card to NOT go fully to center if it leaves empty space on left?
        // User asked for "ideally aligned to center". So let's force center.

        // But we must also check bounds if we don't want to scroll past last card too much.
        // Usually carousel snaps align items.

        animate(x, targetX, { type: "spring", stiffness: 300, damping: 30, bounce: 0.2 });
        onIndexChange(index);
    };

    const handleDragEnd = (e: any, { offset, velocity }: any) => {
        const swipe = offset.x; // Distance dragged
        const stride = CARD_WIDTH + GAP;

        // Determine direction
        let nextIndex = activeIndex;

        if (swipe < -50 || velocity.x < -200) {
            // Swiped Left -> Go Next
            nextIndex = Math.min(matches.length - 1, activeIndex + 1);
        } else if (swipe > 50 || velocity.x > 200) {
            // Swiped Right -> Go Prev
            nextIndex = Math.max(0, activeIndex - 1);
        }

        snapTo(nextIndex);
    };

    return (
        <div ref={containerRef} style={{ width: '100%', overflow: 'hidden', position: 'relative', paddingTop: 10, paddingBottom: 10 }}>
            <motion.div
                style={{
                    x,
                    display: 'flex',
                    gap: GAP,
                    cursor: 'grab',
                    width: 'max-content',
                    // Initial position to center the first card
                    paddingLeft: 0 // handled by x offset
                }}
                drag="x"
                dragConstraints={{
                    // Rough constraints to prevent flying off too far, actual snapping handles the rest
                    left: -((matches.length) * (CARD_WIDTH + GAP)),
                    right: 300
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
                            opacity: 1, // i === activeIndex ? 1 : 0.6 // Keep non-active visible 
                        }}
                        transition={{ duration: 0.3 }}
                        style={{
                            // Ensure the card doesn't shrink
                            minWidth: CARD_WIDTH,
                            maxWidth: CARD_WIDTH,
                        }}
                    >
                        <MatchCard
                            match={match}
                            onClick={onMatchClick}
                            isHero={true} // Keep Hero styling
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
