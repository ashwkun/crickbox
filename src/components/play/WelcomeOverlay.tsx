import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WelcomeOverlayProps {
    name: string;
    photoURL?: string | null;
    show: boolean;
    onComplete: () => void;
}

/**
 * WelcomeOverlay - A premium, fluid entrance animation
 * 
 * displayed only on fresh logins. Uses BBH Bartle font
 * and glassmorphic aesthetics.
 */
const WelcomeOverlay: React.FC<WelcomeOverlayProps> = ({ name, photoURL, show, onComplete }) => {
    const [phase, setPhase] = useState<'text' | 'avatar' | 'done'>('text');

    // Phase transition logic
    useEffect(() => {
        if (show) {
            // Phase 1: Show text for 2.5s
            const textTimer = setTimeout(() => {
                setPhase('avatar');
            }, 2500);

            // Phase 2: Show avatar for 1.5s then complete
            const avatarTimer = setTimeout(() => {
                setPhase('done');
                onComplete();
            }, 4000);

            return () => {
                clearTimeout(textTimer);
                clearTimeout(avatarTimer);
            };
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
                    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity: 0.7 }}>
                        {/* Blob 1: Pink/Rose - Fast orbiting */}
                        <motion.div
                            animate={{
                                scale: [1, 1.6, 0.9, 1],
                                x: ['-20%', '30%', '-10%', '-20%'],
                                y: ['-15%', '20%', '-25%', '-15%'],
                                rotate: [0, 180, 360]
                            }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                            style={{
                                position: 'absolute',
                                top: '15%',
                                left: '20%',
                                width: '55vw',
                                height: '55vw',
                                background: '#ec4899',
                                filter: 'blur(80px)',
                                borderRadius: '40%',
                                opacity: 0.6,
                                mixBlendMode: 'screen'
                            }}
                        />
                        {/* Blob 2: Indigo - Counter rotation */}
                        <motion.div
                            animate={{
                                scale: [1.2, 0.8, 1.4, 1.2],
                                x: ['20%', '-25%', '15%', '20%'],
                                y: ['15%', '-20%', '25%', '15%'],
                                rotate: [0, -120, -240, -360]
                            }}
                            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                            style={{
                                position: 'absolute',
                                bottom: '10%',
                                right: '15%',
                                width: '65vw',
                                height: '65vw',
                                background: '#6366f1',
                                filter: 'blur(100px)',
                                borderRadius: '50%',
                                opacity: 0.5,
                                mixBlendMode: 'screen'
                            }}
                        />
                        {/* Blob 3: Cyan Accent - Pulsing */}
                        <motion.div
                            animate={{
                                scale: [1, 1.5, 1, 1.3, 1],
                                x: ['-5%', '15%', '-10%', '5%', '-5%'],
                                y: ['5%', '-10%', '15%', '-5%', '5%'],
                            }}
                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                            style={{
                                position: 'absolute',
                                top: '35%',
                                right: '35%',
                                width: '45vw',
                                height: '45vw',
                                background: '#06b6d4',
                                filter: 'blur(70px)',
                                borderRadius: '60%',
                                opacity: 0.4,
                                mixBlendMode: 'screen'
                            }}
                        />
                        {/* Blob 4: Orange/Amber - Quick pulse */}
                        <motion.div
                            animate={{
                                scale: [0.8, 1.3, 0.9, 1.1, 0.8],
                                x: ['10%', '-15%', '20%', '-5%', '10%'],
                                y: ['-10%', '15%', '-5%', '10%', '-10%'],
                            }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            style={{
                                position: 'absolute',
                                top: '60%',
                                left: '50%',
                                width: '35vw',
                                height: '35vw',
                                background: '#f97316',
                                filter: 'blur(60px)',
                                borderRadius: '45%',
                                opacity: 0.35,
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
                                    fontSize: 'clamp(1.2rem, 7vw, 2.8rem)',
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
                                    fontSize: 'clamp(1.3rem, 5.2vw, 2.6rem)',
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
                                .{name.toUpperCase()}
                            </motion.div>

                            {/* Keyframes for shimmer */}
                            <style>{`
                                @keyframes liveShimmer {
                                    0% { background-position: 100% 0; }
                                    100% { background-position: 0% 0; }
                                }
                            `}</style>
                        </motion.div>

                        {/* Profile Picture Reveal */}
                        <AnimatePresence>
                            {phase === 'avatar' && photoURL && (
                                <motion.div
                                    layoutId="user-avatar-shared"
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{
                                        scale: 1,
                                        opacity: 1,
                                        transition: {
                                            type: "spring",
                                            stiffness: 200,
                                            damping: 20
                                        }
                                    }}
                                    exit={{
                                        opacity: 0,
                                        transition: { duration: 0.3 }
                                    }}
                                    style={{
                                        width: 100,
                                        height: 100,
                                        borderRadius: '50%',
                                        overflow: 'hidden',
                                        border: '3px solid rgba(236, 72, 153, 0.6)',
                                        boxShadow: '0 0 40px rgba(236, 72, 153, 0.4), 0 20px 50px rgba(0,0,0,0.5)',
                                        marginTop: 30
                                    }}
                                >
                                    <img
                                        src={photoURL}
                                        alt="Profile"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover'
                                        }}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default WelcomeOverlay;
