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
    const containerRef = useRef<HTMLDivElement>(null);

    // Initial calculation to prevent jump
    // We assume full width for mobile initially
    const initialWidth = typeof window !== 'undefined' ? window.innerWidth : 390;
    const initialOffset = (initialWidth - CARD_WIDTH) / 2;

    const [centerOffset, setCenterOffset] = useState(initialOffset);

    // Initialize X correctly so it doesn't animate from 0
    const x = useMotionValue(-(activeIndex * (CARD_WIDTH + GAP)) + initialOffset);

    // Update center more accurately after mount/resize
    // Use useLayoutEffect to block paint until we measure, preventing the visual jump
    React.useLayoutEffect(() => {
        const updateCenter = () => {
            if (containerRef.current) {
                const width = containerRef.current.offsetWidth;
                const newOffset = (width - CARD_WIDTH) / 2;

                console.log('[Carousel Debug] Resizing:', {
                    windowWidth: window.innerWidth,
                    containerWidth: width,
                    oldOffset: centerOffset,
                    newOffset,
                    diff: newOffset - centerOffset
                });

                setCenterOffset(newOffset);
                // Force X update immediately without animation for the initial correction
                if (Math.abs(newOffset - centerOffset) > 1) { // Only if diff is significant
                    x.set(-(activeIndex * (CARD_WIDTH + GAP)) + newOffset);
                }
            }
        };

        console.log('[Carousel Debug] Initial Render:', { initialWidth, initialOffset });
        updateCenter();
        window.addEventListener('resize', updateCenter);
        return () => window.removeEventListener('resize', updateCenter);
    }, []);

    // Animate to position whenever index or offset changes
    useEffect(() => {
        const stride = CARD_WIDTH + GAP;
        // Target = - (Index * Stride) + CenterOffset
        const targetX = -(activeIndex * stride) + centerOffset;

        animate(x, targetX, { type: "spring", stiffness: 300, damping: 30, bounce: 0.2 });
    }, [activeIndex, centerOffset, x]);

    const handleDragEnd = (e: any, { offset, velocity }: any) => {
        const swipe = offset.x;
        let nextIndex = activeIndex;

        // Tuning sensitivity
        if (swipe < -40 || velocity.x < -400) {
            nextIndex = Math.min(matches.length - 1, activeIndex + 1);
        } else if (swipe > 40 || velocity.x > 400) {
            nextIndex = Math.max(0, activeIndex - 1);
        }

        onIndexChange(nextIndex);
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
                    // No padding on the motion div itself, we use 'x' offset
                    paddingLeft: 0,
                    paddingRight: 0
                }}
                drag="x"
                dragConstraints={{
                    // Allow dragging past bounds slightly (rubber band)
                    left: -((matches.length * (CARD_WIDTH + GAP)) - centerOffset),
                    right: centerOffset
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
