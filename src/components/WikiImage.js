import React, { useEffect, useState } from 'react';
import { safeSetItem } from '../utils/storage';

// Country code mapping for national teams
const COUNTRY_CODES = {
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
const PLAYER_FALLBACK = "https://www.espncricinfo.com/static/images/squad-placeholder.png";
const SERIES_FALLBACK = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTEyIDJMNCA1djZWMTE1bDgtNC41TDQgMTZWMTF2LTZMMTIgMnl6IiBmaWxsPSIjYzgxZDI1Ii8+PC9zdmc+"; // Simple shield placeholder

// Get flag URL from FlagsCDN
const getFlagUrl = (teamName) => {
    if (!teamName) return null;
    const cleanName = teamName.toLowerCase().replace(/(-w|women|women's|-u19|under-19)/gi, '').trim();
    const code = COUNTRY_CODES[cleanName];
    if (code && code !== 'wi') {
        return `https://flagcdn.com/w80/${code}.png`;
    }
    return null;
};

// WikiImage Component (Wisden Assets -> Wikipedia -> Flag -> Placeholder)
const WikiImage = ({ name, id, type = 'team', style, circle = false, className }) => {
    const [src, setSrc] = useState(null);
    const [errorCount, setErrorCount] = useState(0);

    useEffect(() => {
        // Reset state when name or id changes
        setSrc(null);
        setErrorCount(0);
    }, [name, id, type]);

    useEffect(() => {
        if (src) return; // Already resolved a source

        // Strategy 1: Wisden Asset (if ID available) - PRIORITY
        if (id && errorCount === 0) {
            let url;
            if (type === 'player') url = `${WISDEN_PLAYER_IMG}${id}.png`;
            else if (type === 'team') url = `${WISDEN_TEAM_IMG}${id}.png`;
            else if (type === 'series' || type === 'tournament') url = `${WISDEN_SERIES_IMG}${id}.png`;

            if (url) {
                setSrc(url);
                return;
            }
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
        // Only run if we haven't failed Wiki already (errorCount <= 1 implies we might have failed Wisden, so try Wiki)
        if (errorCount === (id ? 1 : 0)) {
            fetchWiki(name, type);
        }

        // Strategy 4: Flag Fallback (for teams)
        if ((errorCount === 2 && id) || (errorCount === 1 && !id)) {
            if (type === 'team') {
                const flagUrl = getFlagUrl(name);
                if (flagUrl) {
                    setSrc(flagUrl);
                } else {
                    setSrc(TEAM_FALLBACK); // Final fallback for team
                }
            } else if (type === 'series' || type === 'tournament') {
                setSrc(SERIES_FALLBACK);
            } else {
                setSrc(PLAYER_FALLBACK); // Final fallback for player
            }
        }

    }, [name, id, type, errorCount, src]);

    const fetchWiki = async (name, type) => {
        if (!name) {
            setErrorCount(prev => prev + 1);
            return;
        }

        try {
            const cleanName = type === 'team' ? name.replace(/(-W|Women|Women's)/gi, '').trim() : name;
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
                setErrorCount(prev => prev + 1); // Wiki failed
            }
        } catch (e) {
            // console.warn('Wiki fetch warning', e);
            setErrorCount(prev => prev + 1); // Wiki failed
        }
    };

    const handleError = () => {
        setSrc(null); // Clear current src to trigger effect
        setErrorCount(prev => prev + 1); // Increment error level
    };

    // Calculate generic style
    const imgStyle = circle
        ? { ...style, borderRadius: '50%', objectFit: 'cover' }
        : { ...style, objectFit: 'contain' };

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
            loading="lazy"
        />
    );
};

export default WikiImage;
