import React, { useState, useEffect } from 'react';
const appIcon = new URL('../icons/pwa-logo.png', import.meta.url).href;

const InstallPrompt = () => {
    const [showPrompt, setShowPrompt] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isSafari, setIsSafari] = useState(true);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if already installed/standalone
        const standalone = window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true;
        setIsStandalone(standalone);

        // If already standalone, don't show prompt
        if (standalone) return;

        // Check if iOS
        const ua = navigator.userAgent;
        const ios = /iphone|ipad|ipod/i.test(ua);
        setIsIOS(ios);

        // Check if plain Safari (not Chrome/Firefox on iOS)
        const isChromeIOS = /CriOS/i.test(ua);
        const isFirefoxIOS = /FxiOS/i.test(ua);
        setIsSafari(!isChromeIOS && !isFirefoxIOS);

        // For Android/Chrome - listen for beforeinstallprompt
        const handleBeforeInstall = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowPrompt(true);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstall);

        // For iOS - show after short delay
        if (ios) {
            setTimeout(() => setShowPrompt(true), 2000);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        };
    }, []);

    const handleInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setShowPrompt(false);
            }
            setDeferredPrompt(null);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
    };

    if (!showPrompt || isStandalone) return null;

    // Styles
    const styles = {
        overlay: {
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'rgba(10, 10, 10, 0.98)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '24px 24px 0 0',
            padding: '24px',
            paddingBottom: 'calc(24px + env(safe-area-inset-bottom))',
            zIndex: 1000,
            boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.5)',
            animation: 'slideUp 0.3s ease-out'
        },
        header: {
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '20px'
        },
        icon: {
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
        },
        title: {
            fontSize: '20px',
            fontWeight: '700',
            color: '#fff',
            margin: 0
        },
        subtitle: {
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.5)',
            margin: '4px 0 0 0'
        },
        // iOS Safari steps
        stepsContainer: {
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '20px'
        },
        step: {
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '12px 0',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        },
        stepLast: {
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '12px 0'
        },
        stepNumber: {
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            fontWeight: '700',
            color: '#fff',
            flexShrink: 0
        },
        stepText: {
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.8)',
            lineHeight: '1.4'
        },
        stepHighlight: {
            color: '#fff',
            fontWeight: '600'
        },
        shareIcon: {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#007AFF',
            borderRadius: '6px',
            padding: '4px 8px',
            fontSize: '12px',
            color: '#fff',
            marginLeft: '4px'
        },
        // Non-Safari warning
        warningContainer: {
            background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.15), rgba(234, 88, 12, 0.15))',
            border: '1px solid rgba(251, 146, 60, 0.3)',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '20px',
            textAlign: 'center'
        },
        warningIcon: {
            fontSize: '32px',
            marginBottom: '12px'
        },
        warningTitle: {
            fontSize: '16px',
            fontWeight: '700',
            color: '#fb923c',
            margin: '0 0 8px 0'
        },
        warningText: {
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.7)',
            margin: 0,
            lineHeight: '1.5'
        },
        safariLink: {
            color: '#3b82f6',
            fontWeight: '600'
        },
        // Buttons
        buttonRow: {
            display: 'flex',
            gap: '12px'
        },
        dismissButton: {
            flex: 1,
            padding: '14px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: '600',
            color: '#fff',
            cursor: 'pointer'
        },
        installButton: {
            flex: 1,
            padding: '14px',
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            border: 'none',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: '700',
            color: '#fff',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(34, 197, 94, 0.4)'
        },
        singleButton: {
            width: '100%',
            padding: '14px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: '600',
            color: '#fff',
            cursor: 'pointer'
        }
    };

    // iOS - Not Safari
    if (isIOS && !isSafari) {
        return (
            <div style={styles.overlay}>
                <div style={styles.header}>
                    <img src={appIcon} alt="box.cric" style={styles.icon} />
                    <div>
                        <h3 style={styles.title}>Install box.cric</h3>
                        <p style={styles.subtitle}>Get the full app experience</p>
                    </div>
                </div>

                <div style={styles.warningContainer}>
                    <div style={styles.warningIcon}>🧭</div>
                    <h4 style={styles.warningTitle}>Open in Safari</h4>
                    <p style={styles.warningText}>
                        To install this app, please open this URL in Safari.
                    </p>
                </div>

                <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                }}>
                    <span style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#fff',
                        fontFamily: 'monospace',
                        letterSpacing: '0.5px'
                    }}>boxboxcric.web.app</span>
                    <div
                        onClick={() => {
                            navigator.clipboard.writeText('https://boxboxcric.web.app');
                            const icon = document.getElementById('copy-icon');
                            const check = document.getElementById('check-icon');
                            if (icon && check) {
                                icon.style.display = 'none';
                                check.style.display = 'block';
                                setTimeout(() => {
                                    icon.style.display = 'block';
                                    check.style.display = 'none';
                                }, 1500);
                            }
                        }}
                        style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        <svg id="copy-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        <svg id="check-icon" style={{ display: 'none' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                </div>

                <div style={styles.stepsContainer}>
                    <div style={styles.step}>
                        <span style={styles.stepNumber}>1</span>
                        <span style={styles.stepText}>
                            Tap <span style={styles.stepHighlight}>Copy URL</span> above
                        </span>
                    </div>
                    <div style={styles.step}>
                        <span style={styles.stepNumber}>2</span>
                        <span style={styles.stepText}>
                            Open <span style={styles.stepHighlight}>Safari</span> and paste
                        </span>
                    </div>
                    <div style={styles.stepLast}>
                        <span style={styles.stepNumber}>3</span>
                        <span style={styles.stepText}>
                            Follow the install steps there
                        </span>
                    </div>
                </div>

                <button style={styles.singleButton} onClick={handleDismiss}>
                    Got it
                </button>
            </div>
        );
    }

    // iOS - Safari
    if (isIOS) {
        return (
            <div style={styles.overlay}>
                <div style={styles.header}>
                    <img src={appIcon} alt="box.cric" style={styles.icon} />
                    <div>
                        <h3 style={styles.title}>Install box.cric</h3>
                        <p style={styles.subtitle}>Add to your home screen</p>
                    </div>
                </div>

                <div style={styles.stepsContainer}>
                    <div style={styles.step}>
                        <span style={styles.stepNumber}>1</span>
                        <span style={styles.stepText}>
                            Tap <span style={{
                                background: 'rgba(255,255,255,0.15)',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontWeight: '600'
                            }}>•••</span> menu at bottom
                        </span>
                    </div>
                    <div style={styles.step}>
                        <span style={styles.stepNumber}>2</span>
                        <span style={styles.stepText}>
                            Tap <span style={styles.stepHighlight}>Share</span>
                            <span style={styles.shareIcon}>↑</span>
                        </span>
                    </div>
                    <div style={styles.step}>
                        <span style={styles.stepNumber}>3</span>
                        <span style={styles.stepText}>
                            Scroll and tap <span style={styles.stepHighlight}>"Add to Home Screen"</span>
                        </span>
                    </div>
                    <div style={styles.stepLast}>
                        <span style={styles.stepNumber}>4</span>
                        <span style={styles.stepText}>
                            Tap <span style={styles.stepHighlight}>"Add"</span> in top right
                        </span>
                    </div>
                </div>

                <button style={styles.singleButton} onClick={handleDismiss}>
                    Got it
                </button>
            </div>
        );
    }

    // Android/Chrome
    return (
        <div style={styles.overlay}>
            <div style={styles.header}>
                <img src={appIcon} alt="box.cric" style={styles.icon} />
                <div>
                    <h3 style={styles.title}>Install box.cric</h3>
                    <p style={styles.subtitle}>Get live scores on your home screen</p>
                </div>
            </div>

            <div style={styles.buttonRow}>
                <button style={styles.dismissButton} onClick={handleDismiss}>
                    Not now
                </button>
                <button style={styles.installButton} onClick={handleInstall}>
                    Install
                </button>
            </div>
        </div>
    );
};

export default InstallPrompt;
