export const safeSetItem = (key, value) => {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        if (e.name === 'QuotaExceededError' || e.code === 22) {
            console.warn('LocalStorage Quota Exceeded. Clearing old cache...');
            try {
                // Simple strategy: Clear everything and try one last time
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
