import { useState, useEffect } from 'react';
import { CORS_PROXY } from '../utils/api';

const colorCache: Record<string, string> = {};

export function useImageColor(imageUrl: string | undefined, defaultColor: string = '#888') {
    const [color, setColor] = useState<string>(defaultColor);

    useEffect(() => {
        if (!imageUrl) return;
        if (colorCache[imageUrl]) {
            setColor(colorCache[imageUrl]);
            return;
        }

        const extractColor = async () => {
            try {
                // Skip proxy for data URIs or already proxied URLs
                const isDataUri = imageUrl.startsWith('data:');
                // Double encoding can cause issues, ensure we only proxy real URLs
                const proxyUrl = isDataUri ? imageUrl : `${CORS_PROXY}${encodeURIComponent(imageUrl)}`;

                const img = new Image();
                img.crossOrigin = "Anonymous";
                // Important for preventing some CDN blocks
                img.referrerPolicy = "no-referrer";
                img.src = proxyUrl;

                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return;

                    // Draw image to 1x1 canvas to let browser average the pixels
                    canvas.width = 1;
                    canvas.height = 1;
                    ctx.drawImage(img, 0, 0, 1, 1);

                    try {
                        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
                        const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;

                        colorCache[imageUrl] = hex;
                        setColor(hex);
                    } catch (e) {
                        console.warn('Cannot access image data (CORS)', e);
                    }
                };
            } catch (e) {
                // Fail silently, keep default
            }
        };

        extractColor();
    }, [imageUrl]);

    return color;
}
