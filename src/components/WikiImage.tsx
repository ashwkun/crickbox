import React, { useEffect, useState, CSSProperties } from 'react';
import { safeSetItem } from '../utils/storage';
import { isTBCName } from '../utils/tbcMatch';

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
    'india': 'in',
    'australia': 'au',
    'england': 'gb-eng',
    'pakistan': 'pk',
    'south africa': 'za',
    'new zealand': 'nz',
    'sri lanka': 'lk',
    'bangladesh': 'bd',
    'west indies': 'wi',
    'afghanistan': 'af',
    'zimbabwe': 'zw',
    'ireland': 'ie',
    'netherlands': 'nl',
    'scotland': 'gb-sct',
    'namibia': 'na',
    'nepal': 'np',
    'oman': 'om',
    'uae': 'ae',
    'united arab emirates': 'ae',
    'usa': 'us',
    'canada': 'ca',
    'kenya': 'ke',
    'hong kong': 'hk',
    'papua new guinea': 'pg',
    'cambodia': 'kh',
    'indonesia': 'id',
    'bhutan': 'bt',
    'myanmar': 'mm',
    'italy': 'it',
};

// Wisden Asset Base URLs
const WISDEN_PLAYER_IMG = "https://www.wisden.com/static-assets/images/players/";
const WISDEN_TEAM_IMG = "https://www.wisden.com/static-assets/images/teams/";
const WISDEN_SERIES_IMG = "https://www.wisden.com/static-assets/images/series/";

// Fallbacks
const TEAM_FALLBACK = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiNjODFkMjUiLz48L3N2Zz4=";
const PLAYER_FALLBACK = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23374151'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%239ca3af'/%3E%3Cellipse cx='50' cy='85' rx='28' ry='22' fill='%239ca3af'/%3E%3C/svg%3E";
const SERIES_FALLBACK = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTEyIDJMNCA1djZWMTE1bDgtNC41TDQgMTZWMTF2LTZMMTIgMnl6IiBmaWxsPSIjYzgxZDI1Ii8+PC9zdmc+";

// Get flag URL from FlagsCDN
export const getFlagUrl = (teamName: string | undefined): string | null => {
    if (!teamName) return null;
    const cleanName = teamName.toLowerCase().replace(/(\s?u19|\s?under[- ]?19|women's|women|\sW$|\sA$|-w)/gi, '').trim();
    const code = COUNTRY_CODES[cleanName];
    if (code && code !== 'wi') {
        return `https://flagcdn.com/w80/${code}.png`;
    }
    return null;
};



// WikiImage Component (Wisden Assets -> Wikipedia -> Flag -> Placeholder)
const WikiImage: React.FC<WikiImageProps> = React.memo(({
    name,
    id,
    type = 'team',
    style,
    circle = false,
    className
}) => {
    const [src, setSrc] = useState<string | null>(null);
    const [errorCount, setErrorCount] = useState(0);

    useEffect(() => {
        // Reset state when name or id changes
        setSrc(null);
        setErrorCount(0);
    }, [name, id, type]);

    useEffect(() => {
        if (src) return; // Already resolved a source

        // Strategy 1: Wisden Asset (FIRST PRIORITY)
        // For teams, default to ID '0' which returns a proper TBC placeholder from Wisden
        // Also force ID '0' if the name is detected as a TBC pattern
        const shouldUseTBCImage = isTBCName(name);
        const effectiveId = shouldUseTBCImage ? '0' : (id || (type === 'team' ? '0' : undefined));

        // Strategy 0: League Logo (High Priority for Series/Tournaments)
        if ((type === 'series' || type === 'tournament') && name) {
            // Dynamically import to avoid circular dependencies if any (though utils are safe)
            // But we already imported it at top level (need to add import)
            const { getLeagueLogo } = require('../utils/leagueLogos');
            const logoData = getLeagueLogo(name);
            if (logoData?.badge) {
                setSrc(logoData.badge);
                return;
            }
        }

        if (effectiveId && errorCount === 0) {
            let url: string | undefined;
            if (type === 'player') url = `${WISDEN_PLAYER_IMG}${effectiveId}.png`;
            else if (type === 'team') url = `${WISDEN_TEAM_IMG}${effectiveId}.png`;
            else if (type === 'series' || type === 'tournament') url = `${WISDEN_SERIES_IMG}${effectiveId}.png`;

            if (url) {
                setSrc(url);
                return;
            }
        }

        // Strategy 2: FlagCDN (Fallback for national teams only)
        // Check if Wisden failed (errorCount >= 1) OR if no ID was provided
        const shouldCheckFlag = (id && errorCount >= 1) || (!id && errorCount === 0);

        if (type === 'team' && shouldCheckFlag) {
            const flagUrl = getFlagUrl(name);
            if (flagUrl) {
                setSrc(flagUrl);
                return;
            }
            // If Flag not found, we want to trigger fallback.
            // But we can't "increment" errorCount indefinitely here without logic loop.
            // If we are here, and no flag found, we proceed to fallback below.
        }

        // Strategy 3: Final Fallback
        // Triggers if:
        // - ID provided, Wisden failed, and (Flag failed or skipped)
        // - No ID provided, and (Flag failed or skipped)
        if (!src && ((id && errorCount >= 1) || (!id))) {
            if (type === 'team') {
                setSrc(TEAM_FALLBACK);
            } else if (type === 'series' || type === 'tournament') {
                setSrc(SERIES_FALLBACK);
            } else {
                setSrc(PLAYER_FALLBACK);
            }
        }

    }, [name, id, type, errorCount, src]);

    const handleError = () => {
        // If current src is a Wisden asset, this will increment errorCount to 1,
        // triggering the Effect again to try Flag or Fallback.
        setSrc(null);
        setErrorCount(prev => prev + 1);
    };

    // Detect if loaded image is empty or Wisden's placeholder
    // Wisden returns 200 OK with content-length: 0 for missing players
    const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget;
        // Empty image (content-length: 0) will have naturalWidth/Height of 0
        // Very small images (<=64px) from Wisden are placeholders
        if (type === 'player' && (img.naturalWidth === 0 || img.naturalHeight === 0 ||
            (img.naturalWidth <= 64 && img.naturalHeight <= 64 && src?.includes('wisden.com')))) {
            setSrc(PLAYER_FALLBACK);
        }
    };

    // Calculate generic style - different for flags vs logos
    const isFlag = src?.includes('flagcdn.com');

    let imgStyle: CSSProperties;
    if (circle) {
        imgStyle = { ...style, borderRadius: '50%', objectFit: 'cover' as const };
    } else {
        // Both flags and logos: use contain to show full image without clipping
        imgStyle = { ...style, objectFit: 'contain' as const };
    }

    let fallback = TEAM_FALLBACK;
    if (type === 'player') fallback = PLAYER_FALLBACK;
    if (type === 'series' || type === 'tournament') fallback = SERIES_FALLBACK;

    const finalSrc = src || fallback;

    return (
        <img
            src={finalSrc}
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
