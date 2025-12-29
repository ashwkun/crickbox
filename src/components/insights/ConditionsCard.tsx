import React from 'react';
import { WeatherIcon } from '../icons/WeatherIcons';

interface ConditionsCardProps {
    venueName?: string;
    weather?: {
        Weather?: string;
        Description?: string;
        Temperature?: string;
        Humidity?: string;
        Wind_Speed?: string;
    };
    pitchDetail?: {
        Pitch_Suited_For?: string;
        Pitch_Surface?: string;
    };
    officials?: {
        Umpire1_Name?: string;
        Umpire2_Name?: string;
        Umpire3_Name?: string;
        Referee?: string;
    };
}

// Helper to map API weather to icon key
const getWeatherKey = (weatherName: string | undefined): string => {
    if (!weatherName) return 'cloud';
    const lower = weatherName.toLowerCase();
    if (lower.includes('clear') || lower.includes('sun')) return 'clear';
    if (lower.includes('partly') || lower.includes('cloud')) return 'partly-cloudy';
    if (lower.includes('overcast')) return 'overcast';
    if (lower.includes('rain') || lower.includes('shower')) return 'rain';
    if (lower.includes('drizzle')) return 'drizzle';
    if (lower.includes('storm') || lower.includes('thunder')) return 'storm';
    if (lower.includes('fog')) return 'fog';
    if (lower.includes('mist')) return 'mist';
    if (lower.includes('haze')) return 'haze';
    return 'cloud';
};

// Helper to strip country codes from names
const cleanName = (name: string): string => {
    return name.replace(/\s*\([^)]*\)/g, '').trim();
};

// Helper to get pitch color based on type
const getPitchColor = (pitchType: string): { color: string; bg: string; border: string } => {
    const lower = pitchType.toLowerCase();
    if (lower.includes('batting') || lower.includes('bat')) {
        return { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)', border: 'rgba(34, 197, 94, 0.2)' }; // Green
    }
    if (lower.includes('bowling') || lower.includes('bowl') || lower.includes('seam') || lower.includes('pace')) {
        return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.2)' }; // Red
    }
    if (lower.includes('spin') || lower.includes('turning')) {
        return { color: '#a855f7', bg: 'rgba(168, 85, 247, 0.1)', border: 'rgba(168, 85, 247, 0.2)' }; // Purple
    }
    // Balanced / Default - amber
    return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)' };
};

const ConditionsCard: React.FC<ConditionsCardProps> = ({ venueName, weather, pitchDetail, officials }) => {
    if (!weather && !pitchDetail && !officials && !venueName) return null;

    const hasWeatherOrPitch = weather || pitchDetail || venueName;

    return (
        <div style={{
            background: 'var(--bg-card)',
            borderRadius: 16,
            padding: 20,
            border: '1px solid var(--border-color)',
        }}>
            {/* Header with Venue */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12
            }}>
                <div style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: 1
                }}>
                    Current Conditions
                </div>
                {venueName && (
                    <div style={{
                        fontSize: 11,
                        color: 'rgba(255,255,255,0.5)',
                        maxWidth: '60%',
                        textAlign: 'right',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}>
                        {venueName}
                    </div>
                )}
            </div>

            {/* Weather Row */}
            {weather && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    marginBottom: pitchDetail ? 12 : 0,
                    padding: 12,
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 12
                }}>
                    <WeatherIcon icon={getWeatherKey(weather.Weather)} size={40} />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>
                            {weather.Weather}
                        </div>
                        {weather.Description && (
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                                {weather.Description}
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                        {weather.Temperature && (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>
                                    {weather.Temperature.replace('C', '°')}
                                </div>
                            </div>
                        )}
                        {weather.Humidity && (
                            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                                <div style={{ fontSize: 10, marginBottom: 2, opacity: 0.7 }}>Humidity</div>
                                <div style={{ fontSize: 12, fontWeight: 600 }}>{weather.Humidity}</div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Pitch Row */}
            {(pitchDetail?.Pitch_Suited_For || pitchDetail?.Pitch_Surface) && (
                <div style={{ display: 'flex', gap: 12 }}>
                    {pitchDetail?.Pitch_Suited_For && (() => {
                        const pitchColors = getPitchColor(pitchDetail.Pitch_Suited_For);
                        return (
                            <div style={{ flex: 1, padding: 12, background: pitchColors.bg, borderRadius: 10, border: `1px solid ${pitchColors.border}` }}>
                                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 4 }}>Pitch</div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: pitchColors.color }}>{pitchDetail.Pitch_Suited_For}</div>
                            </div>
                        );
                    })()}
                    {pitchDetail?.Pitch_Surface && (
                        <div style={{ flex: 1, padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 4 }}>Surface</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{pitchDetail.Pitch_Surface}</div>
                        </div>
                    )}
                </div>
            )}

            {/* Officials Section */}
            {officials && (officials.Umpire1_Name || officials.Referee) && (
                <div style={{
                    marginTop: hasWeatherOrPitch ? 16 : 0,
                    paddingTop: hasWeatherOrPitch ? 12 : 0,
                    borderTop: hasWeatherOrPitch ? '1px solid rgba(255,255,255,0.05)' : 'none',
                }}>
                    <div style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: 'rgba(255,255,255,0.3)',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        marginBottom: 8,
                        textAlign: 'center'
                    }}>
                        Officials
                    </div>
                    <div style={{
                        display: 'flex',
                        gap: 16,
                        fontSize: 11,
                        color: 'rgba(255,255,255,0.5)',
                        flexWrap: 'wrap',
                        justifyContent: 'center'
                    }}>
                        {officials.Umpire1_Name && (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>Umpire</div>
                                <div>{cleanName(officials.Umpire1_Name)}</div>
                            </div>
                        )}
                        {officials.Umpire2_Name && (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>Umpire</div>
                                <div>{cleanName(officials.Umpire2_Name)}</div>
                            </div>
                        )}
                        {officials.Referee && (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>Referee</div>
                                <div>{cleanName(officials.Referee)}</div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConditionsCard;
