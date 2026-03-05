/**
 * List Available Gemini Models
 */

const axios = require('axios');
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function listModels() {
  try {
    console.log('\n📋 Listing Available Gemini Models...\n');
    
    const response = await axios.get(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`
    );
    
    const models = response.data.models || [];
    
    console.log(`Found ${models.length} models:\n`);
    
    models.forEach((model, i) => {
      console.log(`${i + 1}. ${model.name}`);
      console.log(`   Display Name: ${model.displayName}`);
      console.log(`   Description: ${model.description?.substring(0, 80)}...`);
      console.log(`   Supported Methods: ${model.supportedGenerationMethods?.join(', ')}`);
      console.log('');
    });
    
    // Find vision-capable models
    const visionModels = models.filter(m => 
      m.supportedGenerationMethods?.includes('generateContent') &&
      (m.name.includes('vision') || m.description?.toLowerCase().includes('vision') || m.description?.toLowerCase().includes('image'))
    );
    
    console.log('\n🎯 Vision-Capable Models for Images:');
    visionModels.forEach(m => {
      console.log(`   ✅ ${m.name}`);
      console.log(`      ${m.displayName}`);
    });
    
  } catch (error) {
    console.error('Error listing models:', error.response?.data || error.message);
  }
}

listModels();
