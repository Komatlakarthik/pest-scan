const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Major cities in Andhra Pradesh
const AP_CITIES = [
  { name: 'Visakhapatnam', lat: 17.6868, lon: 83.2185 },
  { name: 'Vijayawada', lat: 16.5062, lon: 80.6480 },
  { name: 'Guntur', lat: 16.3067, lon: 80.4365 },
  { name: 'Tirupati', lat: 13.6288, lon: 79.4192 },
  { name: 'Kakinada', lat: 16.9891, lon: 82.2475 }
];

/**
 * Fetch current weather for a specific location
 */
export const getCurrentWeather = async (lat, lon) => {
  try {
    const response = await fetch(
      `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
    );
    if (!response.ok) throw new Error('Weather fetch failed');
    return await response.json();
  } catch (error) {
    console.error('Error fetching current weather:', error);
    throw error;
  }
};

/**
 * Fetch 5-day weather forecast
 */
export const getWeatherForecast = async (lat, lon) => {
  try {
    const response = await fetch(
      `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
    );
    if (!response.ok) throw new Error('Forecast fetch failed');
    return await response.json();
  } catch (error) {
    console.error('Error fetching forecast:', error);
    throw error;
  }
};

/**
 * Get weather for Andhra Pradesh (using Vijayawada as reference)
 */
export const getAPWeather = async () => {
  const vijayawada = AP_CITIES.find(city => city.name === 'Vijayawada');
  return await getCurrentWeather(vijayawada.lat, vijayawada.lon);
};

/**
 * Get weather for all major AP cities
 */
export const getAllAPCitiesWeather = async () => {
  try {
    const weatherPromises = AP_CITIES.map(city => 
      getCurrentWeather(city.lat, city.lon)
        .then(data => ({ ...data, cityName: city.name }))
        .catch(err => ({ error: true, cityName: city.name }))
    );
    return await Promise.all(weatherPromises);
  } catch (error) {
    console.error('Error fetching all cities weather:', error);
    throw error;
  }
};

/**
 * Get weather icon URL
 */
export const getWeatherIconUrl = (iconCode) => {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
};

/**
 * Format temperature
 */
export const formatTemp = (temp) => {
  return `${Math.round(temp)}°C`;
};

/**
 * Get weather advice for farmers
 */
export const getWeatherAdvice = (weather) => {
  if (!weather || weather.error) return 'Unable to fetch weather data';
  
  const temp = weather.main?.temp;
  const humidity = weather.main?.humidity;
  const rain = weather.weather?.[0]?.main === 'Rain';
  const description = weather.weather?.[0]?.description || '';

  if (rain) {
    return '🌧️ Rain expected. Postpone spraying operations.';
  } else if (temp > 35) {
    return '🌡️ High temperature. Ensure adequate irrigation.';
  } else if (temp < 15) {
    return '❄️ Cool weather. Monitor for frost-sensitive crops.';
  } else if (humidity > 80) {
    return '💧 High humidity. Watch for fungal diseases.';
  } else if (humidity < 30) {
    return '🏜️ Low humidity. Increase watering frequency.';
  } else {
    return '✅ Good conditions for farming activities.';
  }
};

export default {
  getCurrentWeather,
  getWeatherForecast,
  getAPWeather,
  getAllAPCitiesWeather,
  getWeatherIconUrl,
  formatTemp,
  getWeatherAdvice
};
