// Weather Icons using Basmilius Meteocons
// https://github.com/basmilius/weather-icons
import React from 'react';

interface WeatherIconProps {
    icon: string;
    size?: number;
}

// Map our icon names to Basmilius icon names
const iconMap: Record<string, string> = {
    'sun': 'clear-day',
    'cloud-sun': 'partly-cloudy-day',
    'cloud': 'cloudy',
    'rain': 'rain',
    'drizzle': 'drizzle',
    'storm': 'thunderstorms-rain',
    'fog': 'fog',
};

// Basmilius official CDN
const BASE_URL = 'https://bmcdn.nl/assets/weather-icons/v3.0/fill/svg';

export const WeatherIcon: React.FC<WeatherIconProps> = ({ icon, size = 28 }) => {
    const iconName = iconMap[icon] || 'cloudy';
    const url = `${BASE_URL}/${iconName}.svg`;

    return (
        <img
            src={url}
            alt={iconName}
            width={size}
            height={size}
            style={{
                display: 'block',
                objectFit: 'contain'
            }}
        />
    );
};

// Raindrop icon for precipitation chance 
export const RaindropIcon: React.FC<{ size?: number; color?: string }> = ({ size = 12, color = '#60a5fa' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M12 2C12 2 6 10 6 14a6 6 0 0 0 12 0c0-4-6-12-6-12z" fill={color} />
    </svg>
);

// Get weather icon component by name
export const getWeatherIcon = (iconName: string, size = 28): React.ReactNode => {
    return <WeatherIcon icon={iconName} size={size} />;
};
