/**
 * Test Script for AI APIs
 * Run: node backend/src/scripts/testAI.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const aiService = require('../services/aiService');

console.log('\n🧪 Testing AI Service APIs\n');
console.log('='.repeat(50));

// Test 1: Check API Keys
console.log('\n1️⃣  Checking API Keys:');
console.log('   Gemini:', process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ Missing');
console.log('   Roboflow:', process.env.ROBOFLOW_API_KEY ? '✅ Configured' : '❌ Missing');
console.log('   Google Vision:', process.env.GOOGLE_VISION_API_KEY ? '✅ Configured' : '❌ Missing');
console.log('   Groq:', process.env.GROQ_API_KEY ? '✅ Configured' : '❌ Missing');
console.log('   Hugging Face:', process.env.HF_API_KEY ? '✅ Configured' : '❌ Missing');

// Test 2: Disease Detection (if sample image exists)
async function testDiseaseDetection() {
  console.log('\n2️⃣  Testing Disease Detection:');
  
  // Create a small test image buffer (1x1 pixel PNG)
  const testImageBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  
  try {
    console.log('   Sending test image...');
    const result = await aiService.detectDisease(testImageBuffer, 'Tomato');
    console.log('   ✅ Detection successful!');
    console.log('   Disease:', result.disease);
    console.log('   Confidence:', result.confidence + '%');
    console.log('   Severity:', result.severity);
    console.log('   Source:', result.source);
    console.log('   Recommendations:', result.recommendations.slice(0, 2).join(', '));
  } catch (error) {
    console.log('   ❌ Detection failed:', error.message);
  }
}

// Test 3: Chat Response (Gemini/Groq)
async function testChatResponse() {
  console.log('\n3️⃣  Testing Conversational AI (Gemini/Groq):');
  
  try {
    console.log('   Asking: "What causes tomato late blight?"');
    const response = await aiService.getChatResponse(
      'What causes tomato late blight? Give a brief answer in 2-3 sentences.'
    );
    console.log('   ✅ Response received!');
    console.log('   Answer:', response.substring(0, 200) + '...');
  } catch (error) {
    console.log('   ❌ Chat failed:', error.message);
  }
}

// Test 4: Treatment Recommendations
async function testTreatmentRecommendations() {
  console.log('\n4️⃣  Testing Treatment Recommendations:');
  
  try {
    console.log('   Getting treatment for Late Blight on Tomato...');
    const treatment = await aiService.getTreatmentRecommendations(
      'Late Blight',
      'Tomato',
      'High'
    );
    console.log('   ✅ Treatment recommendations received!');
    console.log('   Immediate Actions:', treatment.immediateActions?.[0] || 'N/A');
    console.log('   Organic Treatment:', treatment.organicTreatment?.[0] || 'N/A');
    console.log('   Expected Recovery:', treatment.expectedRecovery || 'N/A');
  } catch (error) {
    console.log('   ❌ Treatment recommendations failed:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  try {
    await testDiseaseDetection();
    await testChatResponse();
    await testTreatmentRecommendations();
    
    console.log('\n' + '='.repeat(50));
    console.log('\n✨ All tests completed!\n');
    console.log('💡 Tips:');
    console.log('   - If any API failed, check your API keys in backend/.env');
    console.log('   - For image detection, Roboflow requires a valid model ID');
    console.log('   - Test with actual crop images for better results\n');
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
  }
}

// Execute tests
runAllTests();
