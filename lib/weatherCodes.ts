export type WeatherEffect = 'clear' | 'cloud' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'thunder';

export interface WeatherCondition {
  label: string;
  emoji: string;
  effect: WeatherEffect;
}

export function getWeatherCondition(code: number, isDay: boolean): WeatherCondition {
  if (code === 0)
    return { label: 'Clear sky', emoji: isDay ? '☀️' : '🌙', effect: 'clear' };
  if (code === 1)
    return { label: 'Mainly clear', emoji: isDay ? '🌤️' : '🌙', effect: 'clear' };
  if (code === 2)
    return { label: 'Partly cloudy', emoji: '⛅', effect: 'cloud' };
  if (code === 3)
    return { label: 'Overcast', emoji: '☁️', effect: 'cloud' };
  if (code === 45 || code === 48)
    return { label: 'Foggy', emoji: '🌫️', effect: 'fog' };
  if (code >= 51 && code <= 55)
    return { label: 'Drizzle', emoji: '🌦️', effect: 'drizzle' };
  if (code >= 56 && code <= 57)
    return { label: 'Freezing drizzle', emoji: '🌧️', effect: 'drizzle' };
  if (code >= 61 && code <= 65)
    return { label: 'Rain', emoji: '🌧️', effect: 'rain' };
  if (code >= 66 && code <= 67)
    return { label: 'Freezing rain', emoji: '🌧️', effect: 'rain' };
  if (code >= 71 && code <= 77)
    return { label: 'Snow', emoji: '❄️', effect: 'snow' };
  if (code >= 80 && code <= 82)
    return { label: 'Rain showers', emoji: '🌧️', effect: 'rain' };
  if (code >= 85 && code <= 86)
    return { label: 'Snow showers', emoji: '🌨️', effect: 'snow' };
  if (code === 95)
    return { label: 'Thunderstorm', emoji: '⛈️', effect: 'thunder' };
  if (code >= 96)
    return { label: 'Thunderstorm + hail', emoji: '⛈️', effect: 'thunder' };
  return { label: 'Cloudy', emoji: '☁️', effect: 'cloud' };
}

export function getWindDirection(degrees: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(degrees / 45) % 8];
}
