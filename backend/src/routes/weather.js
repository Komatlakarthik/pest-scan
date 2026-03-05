const express = require('express');
const router = express.Router();
const axios = require('axios');
const { authenticate } = require('../middleware/auth');
const { Alert, Report } = require('../models');
const { Op } = require('sequelize');

/**
 * GET /api/weather/:lat/:lon
 * Get weather data and pest outbreak risk for location
 */
router.get('/:lat/:lon', authenticate, async (req, res) => {
  const { lat, lon } = req.params;

  if (!lat || !lon) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Latitude and longitude are required'
    });
  }

  try {
    // Get weather data
    const weatherUrl = `https://api.weatherapi.com/v1/forecast.json?key=${process.env.WEATHER_API_KEY}&q=${lat},${lon}&days=7&aqi=no&alerts=no`;
    
    const weatherResponse = await axios.get(weatherUrl, {
      timeout: 10000
    });

    const weatherData = weatherResponse.data;

    // Calculate pest risk based on weather conditions
    const current = weatherData.current;
    const pestRisk = calculatePestRisk(current, lat, lon);

    // Get active alerts for the region
    const alerts = await Alert.findAll({
      where: {
        latitude: {
          [Op.between]: [parseFloat(lat) - 0.5, parseFloat(lat) + 0.5]
        },
        longitude: {
          [Op.between]: [parseFloat(lon) - 0.5, parseFloat(lon) + 0.5]
        },
        active: true
      },
      limit: 10,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      location: {
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        region: weatherData.location.region,
        country: weatherData.location.country
      },
      current: {
        temp: current.temp_c,
        humidity: current.humidity,
        conditions: current.condition.text,
        windSpeed: current.wind_kph,
        precipitation: current.precip_mm
      },
      forecast: weatherData.forecast.forecastday.map(day => ({
        date: day.date,
        maxTemp: day.day.maxtemp_c,
        minTemp: day.day.mintemp_c,
        avgHumidity: day.day.avghumidity,
        rainfall: day.day.totalprecip_mm,
        conditions: day.day.condition.text
      })),
      pestRisk: {
        level: pestRisk.level,
        score: pestRisk.score,
        factors: pestRisk.factors,
        recommendations: pestRisk.recommendations
      },
      alerts: alerts.map(alert => ({
        id: alert.id,
        pest: alert.pestName,
        risk: alert.riskLevel,
        message: alert.message,
        createdAt: alert.createdAt
      }))
    });

  } catch (error) {
    console.error('Weather API error:', error.message);

    // Return fallback data if API fails
    return res.json({
      location: { lat: parseFloat(lat), lon: parseFloat(lon) },
      current: {
        temp: null,
        humidity: null,
        conditions: 'Data unavailable',
        windSpeed: null
      },
      forecast: [],
      pestRisk: {
        level: 'unknown',
        score: 0,
        factors: {},
        recommendations: ['Weather data unavailable. Please check back later.']
      },
      alerts: []
    });
  }
});

/**
 * Calculate pest outbreak risk based on weather and historical data
 */
async function calculatePestRisk(weather, lat, lon) {
  let score = 0;
  const factors = {};
  const recommendations = [];

  // Humidity factor (higher humidity = higher risk)
  if (weather.humidity > 80) {
    score += 30;
    factors.humidity = 'very high';
    recommendations.push('High humidity detected. Monitor crops closely for fungal diseases.');
  } else if (weather.humidity > 65) {
    score += 20;
    factors.humidity = 'high';
  } else if (weather.humidity > 50) {
    score += 10;
    factors.humidity = 'moderate';
  } else {
    factors.humidity = 'low';
  }

  // Temperature factor (25-32°C is optimal for many pests)
  if (weather.temp_c >= 25 && weather.temp_c <= 32) {
    score += 25;
    factors.temperature = 'optimal';
    recommendations.push('Temperature in optimal range for pest activity.');
  } else if (weather.temp_c > 32 || weather.temp_c < 20) {
    score += 5;
    factors.temperature = 'suboptimal';
  } else {
    factors.temperature = 'moderate';
  }

  // Recent reports in area
  const recentReports = await Report.count({
    where: {
      createdAt: {
        [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      },
      severity: {
        [Op.in]: ['moderate', 'high']
      }
    }
  });

  if (recentReports > 10) {
    score += 30;
    factors.recentOutbreaks = 'multiple';
    recommendations.push(`${recentReports} disease reports in your area in the last week.`);
  } else if (recentReports > 5) {
    score += 15;
    factors.recentOutbreaks = 'some';
  } else {
    factors.recentOutbreaks = 'few';
  }

  // Precipitation (recent rain increases fungal risk)
  if (weather.precip_mm > 10) {
    score += 15;
    factors.precipitation = 'heavy';
    recommendations.push('Recent rainfall may increase fungal disease risk.');
  } else if (weather.precip_mm > 0) {
    score += 5;
    factors.precipitation = 'light';
  }

  // Determine risk level
  let level;
  if (score >= 70) {
    level = 'critical';
    recommendations.push('CRITICAL: Take immediate preventive action.');
  } else if (score >= 50) {
    level = 'high';
    recommendations.push('HIGH RISK: Apply preventive treatments.');
  } else if (score >= 30) {
    level = 'moderate';
    recommendations.push('Moderate risk. Monitor crops regularly.');
  } else {
    level = 'low';
    recommendations.push('Low risk. Continue normal monitoring.');
  }

  return {
    level,
    score,
    factors,
    recommendations
  };
}

module.exports = router;
