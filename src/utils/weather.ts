// Weather utility using Open-Meteo API (free, no key required)

export interface WeatherData {
    date: string;
    tempMax: number;
    tempMin: number;
    rainProbability: number;
    weatherCode: number;
}

// WMO Weather Codes to icon/description
const weatherCodeMap: Record<number, { icon: string; desc: string }> = {
    0: { icon: 'sun', desc: 'Clear sky' },
    1: { icon: 'sun', desc: 'Mainly clear' },
    2: { icon: 'cloud-sun', desc: 'Partly cloudy' },
    3: { icon: 'cloud', desc: 'Overcast' },
    45: { icon: 'fog', desc: 'Fog' },
    48: { icon: 'fog', desc: 'Fog' },
    51: { icon: 'drizzle', desc: 'Light drizzle' },
    53: { icon: 'drizzle', desc: 'Drizzle' },
    55: { icon: 'drizzle', desc: 'Dense drizzle' },
    61: { icon: 'rain', desc: 'Light rain' },
    63: { icon: 'rain', desc: 'Rain' },
    65: { icon: 'rain', desc: 'Heavy rain' },
    80: { icon: 'rain', desc: 'Rain showers' },
    81: { icon: 'rain', desc: 'Rain showers' },
    82: { icon: 'rain', desc: 'Heavy showers' },
    95: { icon: 'storm', desc: 'Thunderstorm' },
    96: { icon: 'storm', desc: 'Thunderstorm with hail' },
    99: { icon: 'storm', desc: 'Severe thunderstorm' },
};

export const getWeatherInfo = (code: number) => {
    return weatherCodeMap[code] || { icon: 'cloud', desc: 'Cloudy' };
};

export async function fetchWeather(lat: number, lon: number, days: number = 7): Promise<WeatherData[]> {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&timezone=auto&forecast_days=${days}`;
        const res = await fetch(url);
        const data = await res.json();

        const daily = data.daily;
        if (!daily) return [];

        return daily.time.map((date: string, i: number) => ({
            date,
            tempMax: Math.round(daily.temperature_2m_max[i]),
            tempMin: Math.round(daily.temperature_2m_min[i]),
            rainProbability: daily.precipitation_probability_max[i] || 0,
            weatherCode: daily.weathercode[i] || 0
        }));
    } catch (error) {
        console.error('Failed to fetch weather:', error);
        return [];
    }
}
