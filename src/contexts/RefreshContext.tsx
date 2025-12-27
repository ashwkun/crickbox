import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

interface RefreshContextType {
    refreshTrigger: number;
    triggerRefresh: () => void;
    isRefreshing: boolean;
    setIsRefreshing: (value: boolean) => void;
    lastRefresh: Date;
}

const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

export function RefreshProvider({ children }: { children: React.ReactNode }) {
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const lastVisibleTime = useRef(Date.now());

    const triggerRefresh = useCallback(() => {
        // Prevent rapid-fire refreshes (min 2 seconds apart)
        const now = Date.now();
        if (now - lastVisibleTime.current < 2000) {
            return;
        }
        lastVisibleTime.current = now;

        console.log('[RefreshContext] Triggering refresh');
        setIsRefreshing(true);
        setRefreshTrigger(prev => prev + 1);
        setLastRefresh(new Date());
    }, []);

    // Handle iOS PWA resume - visibilitychange
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                console.log('[RefreshContext] Visibility changed to visible');
                triggerRefresh();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [triggerRefresh]);

    // Handle BFCache restore (pageshow with persisted = true)
    useEffect(() => {
        const handlePageShow = (e: PageTransitionEvent) => {
            if (e.persisted) {
                console.log('[RefreshContext] Page restored from BFCache');
                triggerRefresh();
            }
        };

        window.addEventListener('pageshow', handlePageShow);
        return () => window.removeEventListener('pageshow', handlePageShow);
    }, [triggerRefresh]);

    // Handle PWA focus (especially iOS standalone mode)
    useEffect(() => {
        const handleFocus = () => {
            // Only trigger in standalone mode (PWA)
            if (window.matchMedia('(display-mode: standalone)').matches) {
                console.log('[RefreshContext] PWA focus detected');
                triggerRefresh();
            }
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [triggerRefresh]);

    return (
        <RefreshContext.Provider value={{
            refreshTrigger,
            triggerRefresh,
            isRefreshing,
            setIsRefreshing,
            lastRefresh
        }}>
            {children}
        </RefreshContext.Provider>
    );
}

export function useRefresh() {
    const context = useContext(RefreshContext);
    if (!context) {
        throw new Error('useRefresh must be used within RefreshProvider');
    }
    return context;
}
