const cron = require('node-cron');
const axios = require('axios');
const { Alert, Field } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

/**
 * Weather-based pest alert cron job
 * Runs every 6 hours to check weather conditions and create alerts
 */
function startCronJobs() {
  // Run every 6 hours: at 00:00, 06:00, 12:00, and 18:00
  cron.schedule('0 */6 * * *', async () => {
    logger.info('Running weather-based pest alert cron job');
    
    try {
      // Get all unique field locations
      const fields = await Field.findAll({
        attributes: ['latitude', 'longitude'],
        where: {
          latitude: { [Op.not]: null },
          longitude: { [Op.not]: null }
        },
        group: ['latitude', 'longitude']
      });

      if (!process.env.WEATHER_API_KEY) {
        logger.warn('Weather API key not configured. Skipping weather alerts.');
        return;
      }

      for (const field of fields) {
        try {
          // Get weather for this location
          const weatherUrl = `https://api.weatherapi.com/v1/current.json?key=${process.env.WEATHER_API_KEY}&q=${field.latitude},${field.longitude}`;
          const weatherResponse = await axios.get(weatherUrl, { timeout: 10000 });
          const weather = weatherResponse.data.current;

          // Check for high-risk conditions
          const isHighHumidity = weather.humidity > 80;
          const isOptimalTemp = weather.temp_c >= 25 && weather.temp_c <= 32;
          const hasRain = weather.precip_mm > 5;

          if (isHighHumidity && isOptimalTemp) {
            // Create alert
            await Alert.create({
              pestName: 'Fungal Disease Outbreak',
              riskLevel: 'high',
              message: `High humidity (${weather.humidity}%) and optimal temperature (${weather.temp_c}°C) detected. Increased risk of fungal diseases like late blight.`,
              latitude: field.latitude,
              longitude: field.longitude,
              active: true
            });

            logger.info(`Created high-risk alert for location ${field.latitude},${field.longitude}`);
          } else if (hasRain && isOptimalTemp) {
            await Alert.create({
              pestName: 'Pest Activity Alert',
              riskLevel: 'moderate',
              message: `Recent rainfall (${weather.precip_mm}mm) with favorable temperature. Monitor crops for increased pest activity.`,
              latitude: field.latitude,
              longitude: field.longitude,
              active: true
            });

            logger.info(`Created moderate-risk alert for location ${field.latitude},${field.longitude}`);
          }
        } catch (error) {
          logger.error(`Error processing weather for field ${field.id}:`, error.message);
        }
      }

      logger.info('Weather alert cron job completed successfully');
    } catch (error) {
      logger.error('Weather cron job error:', error);
    }
  });

  logger.info('Weather cron job scheduled (every 6 hours)');
}

module.exports = { startCronJobs };
