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

        // Check if dismissed recently (session)
        const dismissed = sessionStorage.getItem('pwa-prompt-dismissed');
        if (dismissed) return;

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
        sessionStorage.setItem('pwa-prompt-dismissed', 'true');
    };

    if (!showPrompt || isStandalone) return null;

    return (
        <div className="install-prompt">
            <div className="install-prompt-content">
                <div className="install-prompt-icon">
                    <img src={appIcon} alt="App Icon" />
                </div>
                <div className="install-prompt-text">
                    <h3>Install box.cric</h3>
                    <p>Get the full app experience</p>
                </div>
            </div>

            {isIOS ? (
                <div className="install-prompt-ios">
                    {!isSafari ? (
                        <div className="ios-browser-warning">
                            <p>Please open <strong>box.cric</strong> in <strong>Safari</strong> to install.</p>
                            <button className="install-dismiss" onClick={handleDismiss}>Close</button>
                        </div>
                    ) : (
                        <>
                            <div className="ios-steps">
                                <div className="ios-step">
                                    <span className="step-number">1</span>
                                    <span>Tap the <span className="menu-icon">•••</span> menu to reveal Share</span>
                                </div>
                                <div className="ios-step">
                                    <span className="step-number">2</span>
                                    <span>Tap <strong>Share</strong> <span className="share-icon">Share</span></span>
                                </div>
                                <div className="ios-step">
                                    <span className="step-number">3</span>
                                    <span>Scroll down & <strong>"Add to Home Screen"</strong></span>
                                </div>
                            </div>
                            <div className="install-prompt-actions">
                                <button className="install-dismiss" onClick={handleDismiss}>Okay, Got it</button>
                            </div>
                        </>
                    )}
                </div>
            ) : (
                <div className="install-prompt-actions">
                    <button className="install-dismiss" onClick={handleDismiss}>Later</button>
                    <button className="install-button" onClick={handleInstall}>Install App</button>
                </div>
            )}
        </div>
    );
};

export default InstallPrompt;
