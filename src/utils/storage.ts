export const safeSetItem = (key: string, value: string): void => {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        const error = e as Error & { code?: number };
        if (error.name === 'QuotaExceededError' || error.code === 22) {
            console.warn('LocalStorage Quota Exceeded. Clearing old cache...');
            try {
                localStorage.clear();
                localStorage.setItem(key, value);
            } catch (retryError) {
                console.error('LocalStorage completely full, proceeding without caching.', retryError);
            }
        } else {
            console.warn('LocalStorage error', e);
        }
    }
};
