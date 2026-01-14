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
                        width: '100vw',
                        height: '100vh',
                        zIndex: 9999,
                        background: '#050505', // Deep black base
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden'
                    }}
                >
                    {/* Active Fluid Background Blobs */}
                    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
                        {/* Blob 1 - Pink */}
                        <motion.div
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.3, 0.5, 0.3],
                                x: [0, 50, -50, 0],
                                y: [0, -30, 30, 0],
                            }}
                            transition={{
                                duration: 8,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            style={{
                                position: 'absolute',
                                top: '30%',
                                left: '50%',
                                width: '60vw',
                                height: '60vw',
                                maxHeight: 400,
                                maxWidth: 400,
                                transform: 'translate(-50%, -50%)',
                                borderRadius: '50%',
                                background: 'radial-gradient(circle, rgba(236, 72, 153, 0.4) 0%, transparent 70%)',
                                filter: 'blur(40px)',
                            }}
                        />
                        {/* Blob 2 - Purple Accent */}
                        <motion.div
                            animate={{
                                scale: [1.2, 1, 1.2],
                                opacity: [0.2, 0.4, 0.2],
                                x: [0, -30, 30, 0],
                                y: [0, 50, -50, 0],
                            }}
                            transition={{
                                duration: 10,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            style={{
                                position: 'absolute',
                                bottom: '20%',
                                right: '20%',
                                width: '50vw',
                                height: '50vw',
                                maxHeight: 300,
                                maxWidth: 300,
                                borderRadius: '50%',
                                background: 'radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)',
                                filter: 'blur(50px)',
                            }}
                        />
                    </div>

                    {/* Animated Text Container */}
                    <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', width: '100%', padding: '0 20px' }}>

                        {/* Floating Container Wrapper */}
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        >
                            {/* "Welcome," Text */}
                            <motion.h1
                                initial={{ y: 40, opacity: 0, filter: 'blur(10px)' }}
                                animate={{
                                    y: 0,
                                    opacity: 1,
                                    filter: 'blur(0px)',
                                    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
                                }}
                                exit={{ y: -40, opacity: 0, filter: 'blur(10px)', transition: { duration: 0.5 } }}
                                style={{
                                    fontFamily: '"BBH Bartle", sans-serif',
                                    fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', // Responsive Size
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
                                initial={{ y: 40, opacity: 0, filter: 'blur(10px)' }}
                                animate={{
                                    y: 0,
                                    opacity: 1,
                                    filter: 'blur(0px)',
                                    transition: { delay: 0.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] }
                                }}
                                exit={{ y: 40, opacity: 0, filter: 'blur(10px)', transition: { duration: 0.5 } }}
                                style={{
                                    fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', // Responsive Size
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
                        </motion.div>

                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default WelcomeOverlay;
