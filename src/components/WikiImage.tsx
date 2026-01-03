import React, { useMemo, useState, CSSProperties } from 'react';
import { isTBCName } from '../utils/tbcMatch';
import { getLeagueLogo } from '../utils/leagueLogos';

// Types
interface WikiImageProps {
    name?: string;
    id?: string;
    type?: 'team' | 'player' | 'series' | 'tournament';
    style?: CSSProperties;
    circle?: boolean;
    className?: string;
}

// Country code mapping for national teams
const COUNTRY_CODES: Record<string, string> = {
    'india': 'in', 'australia': 'au', 'england': 'gb-eng', 'pakistan': 'pk',
    'south africa': 'za', 'new zealand': 'nz', 'sri lanka': 'lk', 'bangladesh': 'bd',
    'west indies': 'wi', 'afghanistan': 'af', 'zimbabwe': 'zw', 'ireland': 'ie',
    'netherlands': 'nl', 'scotland': 'gb-sct', 'namibia': 'na', 'nepal': 'np',
    'oman': 'om', 'uae': 'ae', 'united arab emirates': 'ae', 'usa': 'us',
    'canada': 'ca', 'kenya': 'ke', 'hong kong': 'hk', 'papua new guinea': 'pg',
    'cambodia': 'kh', 'indonesia': 'id', 'bhutan': 'bt', 'myanmar': 'mm', 'italy': 'it',
};

// Wisden Asset Base URLs
const WISDEN_PLAYER_IMG = "https://www.wisden.com/static-assets/images/players/";
const WISDEN_TEAM_IMG = "https://www.wisden.com/static-assets/images/teams/";
const WISDEN_SERIES_IMG = "https://www.wisden.com/static-assets/images/series/";

// Fallback SVGs (inline data URIs)
const FALLBACKS = {
    team: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiNjODFkMjUiLz48L3N2Zz4=",
    player: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23374151'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%239ca3af'/%3E%3Cellipse cx='50' cy='85' rx='28' ry='22' fill='%239ca3af'/%3E%3C/svg%3E",
    series: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTEyIDJMNCA1djZWMTE1bDgtNC41TDQgMTZWMTF2LTZMMTIgMnl6IiBmaWxsPSIjYzgxZDI1Ii8+PC9zdmc+"
};

// Get flag URL from FlagsCDN (for national teams)
export const getFlagUrl = (teamName: string | undefined): string | null => {
    if (!teamName) return null;
    const cleanName = teamName.toLowerCase().replace(/(\s?u19|\s?under[- ]?19|women's|women|\sW$|\sA$|-w)/gi, '').trim();
    const code = COUNTRY_CODES[cleanName];
    if (code && code !== 'wi') { // West Indies has no single flag
        return `https://flagcdn.com/w80/${code}.png`;
    }
    return null;
};

/**
 * Build ordered queue of image URLs to try for a given entity.
 * Returns sources in priority order. First successful load wins.
 */
const buildSrcQueue = (
    name: string | undefined,
    id: string | undefined,
    type: 'team' | 'player' | 'series' | 'tournament'
): string[] => {
    const queue: string[] = [];

    // Handle TBC teams → use ID '0' for generic placeholder from Wisden
    const effectiveId = isTBCName(name) ? '0' : id;

    if (type === 'tournament' || type === 'series') {
        // 1. TheSportsDB (via leagues.json)
        if (name) {
            const logo = getLeagueLogo(name);
            if (logo?.badge) queue.push(logo.badge);
        }
        // 2. Wisden Series Asset
        if (effectiveId) queue.push(`${WISDEN_SERIES_IMG}${effectiveId}.png`);
    }
    else if (type === 'team') {
        // 1. Wisden Team Asset (by ID)
        if (effectiveId) queue.push(`${WISDEN_TEAM_IMG}${effectiveId}.png`);
        // 2. FlagCDN (for national teams, by name)
        const flag = getFlagUrl(name);
        if (flag) queue.push(flag);
    }
    else if (type === 'player') {
        // 1. Wisden Player Asset (by ID)
        if (effectiveId) queue.push(`${WISDEN_PLAYER_IMG}${effectiveId}.png`);
    }

    return queue;
};

/**
 * WikiImage Component
 * Tries multiple image sources in order, falling back gracefully.
 */
const WikiImage: React.FC<WikiImageProps> = React.memo(({
    name,
    id,
    type = 'team',
    style,
    circle = false,
    className
}) => {
    // Build source queue once per prop change
    const srcQueue = useMemo(
        () => buildSrcQueue(name, id, type),
        [name, id, type]
    );

    // Track which index in the queue we're currently trying
    const [srcIndex, setSrcIndex] = useState(0);

    // Reset index when props change
    useMemo(() => {
        setSrcIndex(0);
    }, [name, id, type]);

    // Current source to display (or fallback if exhausted)
    const fallback = type === 'player' ? FALLBACKS.player
        : (type === 'series' || type === 'tournament') ? FALLBACKS.series
            : FALLBACKS.team;

    const currentSrc = srcQueue[srcIndex] || fallback;

    // On error, try next source in queue
    const handleError = () => {
        if (srcIndex < srcQueue.length - 1) {
            setSrcIndex(prev => prev + 1);
        } else {
            // Exhausted queue, will show fallback
            setSrcIndex(srcQueue.length); // Force fallback
        }
    };

    // Detect broken/tiny images from Wisden (content-length: 0 or placeholder)
    const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget;
        const isWisdenSrc = currentSrc.includes('wisden.com');
        const isTinyOrEmpty = img.naturalWidth === 0 || img.naturalHeight === 0 ||
            (img.naturalWidth <= 64 && img.naturalHeight <= 64);

        if (type === 'player' && isWisdenSrc && isTinyOrEmpty) {
            handleError(); // Treat as failed, try next
        }
    };

    // Style: contain for logos, cover for circles
    const imgStyle: CSSProperties = circle
        ? { ...style, borderRadius: '50%', objectFit: 'cover' }
        : { ...style, objectFit: 'contain' };

    return (
        <img
            src={currentSrc}
            style={imgStyle}
            className={className}
            alt={name || 'Asset'}
            onError={handleError}
            onLoad={handleLoad}
            loading="lazy"
        />
    );
});

WikiImage.displayName = 'WikiImage';

export default WikiImage;
