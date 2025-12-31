import React, { useEffect, useState, CSSProperties } from 'react';
import { safeSetItem } from '../utils/storage';

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
    const cleanName = teamName.toLowerCase().replace(/(-w|\sW$|women|women's|-u19|under-19)/gi, '').trim();
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
        if (id && errorCount === 0) {
            let url: string | undefined;
            if (type === 'player') url = `${WISDEN_PLAYER_IMG}${id}.png`;
            else if (type === 'team') url = `${WISDEN_TEAM_IMG}${id}.png`;
            else if (type === 'series' || type === 'tournament') url = `${WISDEN_SERIES_IMG}${id}.png`;

            if (url) {
                setSrc(url);
                return;
            }
        }

        // Strategy 0: FlagCDN (Fallback for national teams)
        // Try if Wisden failed (errorCount==1) OR if no ID (errorCount==0)
        // But be careful not to override Wikipedia logic (Strategy 3) which runs later
        // Let's make this run if we haven't found a source yet.
        const shouldCheckFlag = (id && errorCount === 1) || (!id && errorCount === 0);

        if (type === 'team' && shouldCheckFlag) {
            const flagUrl = getFlagUrl(name);
            if (flagUrl) {
                setSrc(flagUrl);
                return;
            }
            // If no flag found, proceed to next strategies (by letting errorCount increment or fall through? 
            // Wait, if setSrc is not called, we do nothing. 
            // But if we fail to find a flag, we want to go towards Wikipedia.
            // If getFlagUrl returns null, we just continue.
            // But 'continue' in useEffect means fall through to next if statements.
            // But we need to ensure the NEXT strategies run. 
            // If (id && errorCount === 1) runs this block, and fails, we need errorCount to increment to 2 to trigger fallback?
            // Or trigger Wikipedia?

            // Actually, Strategy 3 (Wikipedia) runs at: errorCount === (id ? 1 : 0).
            // If id exists: Wisden(0) -> Error(1) -> Wiki(1)?
            // If I insert Flag at (1), I delay Wiki to (2)?
            // Yes.
            // If flagUrl found -> setSrc -> Good.
            // If flagUrl NOT found -> I must increment errorCount to skip to Wiki? 
            // OR simply let Wiki run? 
            // If (id && errorCount===1), and flagUrl is null.
            // Then Wiki checks `errorCount === (id ? 1 : 0)`. i.e. 1.
            // So Wiki ALSO runs?
            // If multiple blocks run in one effect pass? No, setSrc triggers re-render if state changes.
            // If setSrc NOT called, effect continues execution? Yes.
            // So safely placing Flag logic before Wiki logic is fine.
        }

        // Strategy 2: LocalStorage Cache for Wiki
        if (!id && errorCount === 0) {
            const cacheKey = `wiki_img_v5_${name}`;
            const cached = localStorage.getItem(cacheKey);
            if (cached && cached !== 'PLACEHOLDER') {
                setSrc(cached);
                return;
            }
        }

        // Strategy 3: Fetch from Wikipedia (if no ID or Wisden failed)
        if (errorCount === (id ? 1 : 0)) {
            fetchWiki(name, type);
        }

        // Strategy 4: Fallback placeholder
        if ((errorCount === 2 && id) || (errorCount === 1 && !id)) {
            if (type === 'team') {
                setSrc(TEAM_FALLBACK);
            } else if (type === 'series' || type === 'tournament') {
                setSrc(SERIES_FALLBACK);
            } else {
                setSrc(PLAYER_FALLBACK);
            }
        }

    }, [name, id, type, errorCount, src]);

    const fetchWiki = async (name: string | undefined, type: string) => {
        if (!name) {
            setErrorCount(prev => prev + 1);
            return;
        }

        try {
            const cleanName = type === 'team' ? name.replace(/(-W|\sW$|Women|Women's)/gi, '').trim() : name;
            let query = cleanName;

            if (type === 'team' && !cleanName.toLowerCase().includes('team')) query += ' cricket team';
            else if (type === 'player') query += ' cricketer';
            else if ((type === 'series' || type === 'tournament') && !cleanName.toLowerCase().includes('cup') && !cleanName.toLowerCase().includes('trophy') && !cleanName.toLowerCase().includes('league')) query += ' cricket';

            const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = await res.json();
            const thumb = data.thumbnail?.source;

            if (thumb) {
                setSrc(thumb);
                const cacheKey = `wiki_img_v5_${name}`;
                safeSetItem(cacheKey, thumb);
            } else {
                setErrorCount(prev => prev + 1);
            }
        } catch (e) {
            setErrorCount(prev => prev + 1);
        }
    };

    const handleError = () => {
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
