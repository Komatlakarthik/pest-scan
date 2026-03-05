const express = require('express');
const router = express.Router();
const textToSpeech = require('@google-cloud/text-to-speech');
const logger = require('../utils/logger');

// Initialize Google Text-to-Speech client
const ttsClient = new textToSpeech.TextToSpeechClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

/**
 * POST /api/tts/speak
 * Convert Telugu text to natural speech
 */
router.post('/speak', async (req, res) => {
  try {
    const { text, language = 'te-IN' } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }

    logger.info('🔊 TTS request:', { 
      textLength: text.length, 
      language
    });

    // Configure the request for Google TTS
    const request = {
      input: { text },
      voice: {
        languageCode: language,
        // Use WaveNet for more natural voice (premium quality)
        name: language === 'te-IN' ? 'te-IN-Standard-A' : 'te-IN-Standard-B',
        ssmlGender: 'FEMALE' // or 'MALE', 'NEUTRAL'
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 0.9, // Slightly slower for clarity
        pitch: 0.0,
        volumeGainDb: 0.0
      }
    };

    // Perform the text-to-speech request
    const [response] = await ttsClient.synthesizeSpeech(request);

    // Convert audio content to base64
    const audioBase64 = response.audioContent.toString('base64');

    logger.info('✅ TTS generated successfully');

    res.json({
      success: true,
      audio: audioBase64,
      mimeType: 'audio/mpeg'
    });

  } catch (error) {
    logger.error('❌ TTS error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate speech',
      error: error.message
    });
  }
});

/**
 * GET /api/tts/voices
 * Get available Telugu voices
 */
router.get('/voices', async (req, res) => {
  try {
    const [result] = await ttsClient.listVoices({ languageCode: 'te-IN' });
    const voices = result.voices;

    logger.info('📢 Available Telugu voices:', voices.length);

    res.json({
      success: true,
      voices: voices.map(voice => ({
        name: voice.name,
        gender: voice.ssmlGender,
        languageCodes: voice.languageCodes,
        naturalSampleRateHertz: voice.naturalSampleRateHertz
      }))
    });

  } catch (error) {
    logger.error('❌ Error fetching voices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch voices',
      error: error.message
    });
  }
});

module.exports = router;
