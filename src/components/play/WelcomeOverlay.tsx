import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WelcomeOverlayProps {
    name: string;
    show: boolean;
    onComplete: () => void;
}

/**
 * WelcomeOverlay - A premium, fluid entrance animation
 * 
 * displayed only on fresh logins. Uses BBH Bartle font
 * and glassmorphic aesthetics.
 */
const WelcomeOverlay: React.FC<WelcomeOverlayProps> = ({ name, show, onComplete }) => {

    // Auto-dismiss logic
    useEffect(() => {
        if (show) {
            const timer = setTimeout(() => {
                onComplete();
            }, 3500); // Display for ~3.5 seconds
            return () => clearTimeout(timer);
        }
    }, [show, onComplete]);

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 9999,
                        background: '#000', // Deep black base
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden'
                    }}
                >
                    {/* Fluid Background Effects */}
                    <div className="fluid-bg" style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.15) 0%, transparent 70%)',
                        filter: 'blur(60px)',
                    }} />

                    {/* Animated Text Container */}
                    <div style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>

                        {/* "Velcom" Text */}
                        <motion.h1
                            initial={{ y: 20, opacity: 0, filter: 'blur(10px)' }}
                            animate={{
                                y: 0,
                                opacity: 1,
                                filter: 'blur(0px)',
                                transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
                            }}
                            exit={{ y: -20, opacity: 0, filter: 'blur(10px)', transition: { duration: 0.5 } }}
                            style={{
                                fontFamily: '"BBH Bartle", sans-serif',
                                fontSize: '4rem',
                                color: '#fff',
                                margin: 0,
                                lineHeight: 1.1,
                                letterSpacing: '1px'
                            }}
                        >
                            Welcome,
                        </motion.h1>

                        {/* Name Text */}
                        <motion.h2
                            initial={{ y: 20, opacity: 0, filter: 'blur(10px)' }}
                            animate={{
                                y: 0,
                                opacity: 1,
                                filter: 'blur(0px)',
                                transition: { delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }
                            }}
                            exit={{ y: 20, opacity: 0, filter: 'blur(10px)', transition: { duration: 0.5 } }}
                            style={{
                                fontSize: '2.5rem',
                                fontWeight: 800,
                                margin: '8px 0 0',
                                background: 'linear-gradient(135deg, #ec4899 0%, #f9a8d4 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                letterSpacing: '-0.5px'
                            }}
                        >
                            {name}
                        </motion.h2>

                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default WelcomeOverlay;
