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
            }, 3800); // Extended slightly for staggered text
            return () => clearTimeout(timer);
        }
    }, [show, onComplete]);

    // Stagger logic for name
    const letters = name.split('');

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        zIndex: 9999,
                        background: '#020202',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden'
                    }}
                >
                    {/* 1. Aurora Mesh Background */}
                    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity: 0.6 }}>
                        {/* Blob 1: Pink/Rose */}
                        <motion.div
                            animate={{
                                scale: [1, 1.4, 1],
                                x: ['-10%', '10%', '-10%'],
                                y: ['-10%', '10%', '-10%'],
                                rotate: [0, 90, 0]
                            }}
                            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                            style={{
                                position: 'absolute',
                                top: '20%',
                                left: '30%',
                                width: '50vw',
                                height: '50vw',
                                background: '#ec4899',
                                filter: 'blur(100px)',
                                borderRadius: '40%',
                                opacity: 0.5,
                                mixBlendMode: 'screen'
                            }}
                        />
                        {/* Blob 2: Indigo */}
                        <motion.div
                            animate={{
                                scale: [1, 1.2, 1],
                                x: ['10%', '-10%', '10%'],
                                y: ['10%', '-15%', '10%'],
                            }}
                            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                            style={{
                                position: 'absolute',
                                bottom: '20%',
                                right: '20%',
                                width: '60vw',
                                height: '60vw',
                                background: '#6366f1',
                                filter: 'blur(120px)',
                                borderRadius: '50%',
                                opacity: 0.4,
                                mixBlendMode: 'screen'
                            }}
                        />
                        {/* Blob 3: Cyan Accent */}
                        <motion.div
                            animate={{
                                scale: [1, 1.3, 1],
                                x: ['0%', '5%', '0%'],
                            }}
                            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                            style={{
                                position: 'absolute',
                                top: '40%',
                                right: '40%',
                                width: '40vw',
                                height: '40vw',
                                background: '#06b6d4',
                                filter: 'blur(90px)',
                                borderRadius: '60%',
                                opacity: 0.3,
                                mixBlendMode: 'screen'
                            }}
                        />
                    </div>

                    {/* 2. Grain/Noise Overlay */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        opacity: 0.05,
                        pointerEvents: 'none',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                    }} />

                    {/* 3. Cinema Vignette */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'radial-gradient(circle at center, transparent 30%, #000 100%)',
                        pointerEvents: 'none',
                        zIndex: 2
                    }} />

                    {/* Content */}
                    <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', width: '100%', padding: '0 20px' }}>
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        >
                            {/* "Welcome," */}
                            <motion.h1
                                initial={{ y: 20, opacity: 0, filter: 'blur(10px)' }}
                                animate={{
                                    y: 0,
                                    opacity: 1,
                                    filter: 'blur(0px)',
                                    transition: { duration: 1, ease: [0.16, 1, 0.3, 1] }
                                }}
                                exit={{ y: -20, opacity: 0, filter: 'blur(5px)', transition: { duration: 0.4 } }}
                                style={{
                                    fontFamily: '"BBH Bartle", sans-serif',
                                    fontSize: 'clamp(1.5rem, 9vw, 3.5rem)',
                                    width: '100%',
                                    maxWidth: '100vw',
                                    color: 'rgba(255,255,255,0.95)',
                                    marginBottom: '0.1em',
                                    lineHeight: 1.1,
                                    letterSpacing: '0.02em',
                                    textShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                    whiteSpace: 'nowrap', // Force single line
                                    padding: '0 10px'
                                }}
                            >
                                Welcome,
                            </motion.h1>

                            {/* Name Text - .PLAY Style */}
                            <motion.div
                                initial={{ y: 20, opacity: 0, filter: 'blur(10px)' }}
                                animate={{
                                    y: 0,
                                    opacity: 1,
                                    filter: 'blur(0px)',
                                    transition: { delay: 0.2, duration: 1, ease: [0.16, 1, 0.3, 1] }
                                }}
                                exit={{ y: 20, opacity: 0, filter: 'blur(5px)', transition: { duration: 0.4 } }}
                                style={{
                                    fontFamily: '"BBH Bartle", sans-serif',
                                    fontSize: 'clamp(2rem, 8vw, 4rem)',
                                    fontWeight: 600,
                                    letterSpacing: '1px',
                                    background: 'linear-gradient(90deg, #ec4899 0%, #ec4899 35%, #f9a8d4 50%, #ec4899 65%, #ec4899 100%)',
                                    backgroundSize: '200% 100%',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    color: '#ec4899', // Fallback
                                    animation: 'liveShimmer 1.5s ease-in-out infinite alternate',
                                    marginTop: '10px'
                                }}
                            >
                                {name}
                            </motion.div>

                            {/* Keyframes for shimmer */}
                            <style>{`
                                @keyframes liveShimmer {
                                    0% { background-position: 100% 0; }
                                    100% { background-position: 0% 0; }
                                }
                            `}</style>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default WelcomeOverlay;
