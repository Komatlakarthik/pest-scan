/**
 * Test Gemini Vision API for Crop Disease Detection
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

console.log('\n🧪 Testing Gemini Vision API for Disease Detection\n');
console.log('='.repeat(50));

async function testGeminiVision() {
  try {
    // Read the test image
    const imagePath = path.join(__dirname, 'test-image.jpg');
    
    if (!fs.existsSync(imagePath)) {
      console.log('❌ Test image not found. Run testRoboflowWithImage.js first.');
      return;
    }

    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    
    console.log('\n📸 Image loaded:', imagePath);
    console.log('Image size:', imageBuffer.length, 'bytes');
    console.log('API Key:', GEMINI_API_KEY ? '✅ Configured' : '❌ Missing');
    
    console.log('\n🔍 Sending request to Gemini Vision...');
    
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [
            {
              text: `You are an expert agricultural AI assistant specializing in crop disease detection. 

Analyze this crop/plant image and identify:
1. Disease name (if any) - be specific (e.g., "Tomato Late Blight", "Powdery Mildew")
2. Crop type (e.g., Tomato, Potato, Wheat, Rice)
3. Confidence level (0-100%)
4. Severity (High/Medium/Low)
5. Visible symptoms
6. Brief treatment recommendation

IMPORTANT: Respond ONLY with valid JSON in this exact format (no markdown, no extra text):
{
  "disease": "Disease Name or Healthy",
  "crop": "Crop Type",
  "confidence": 85,
  "severity": "High",
  "symptoms": ["symptom1", "symptom2"],
  "treatment": "brief recommendation"
}

If the image is not a plant or is unclear, respond with:
{
  "disease": "Unable to detect",
  "crop": "Unknown",
  "confidence": 0,
  "severity": "Low",
  "symptoms": ["Image unclear or not a plant"],
  "treatment": "Please upload a clear image of the affected plant"
}`
            },
            {
              inline_data: {
                mime_type: 'image/jpeg',
                data: base64Image
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 500
        }
      },
      { timeout: 20000 }
    );

    console.log('\n✅ Gemini Vision Response Received!\n');
    
    console.log('Full Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    const content = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) {
      console.log('\n❌ No response content from Gemini');
      console.log('Response structure:', JSON.stringify(response.data, null, 2));
      return;
    }

    console.log('Raw Response:');
    console.log(content);
    
    // Clean JSON response
    let jsonText = content.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const result = JSON.parse(jsonText);
    
    console.log('\n🎯 Parsed Detection Result:');
    console.log('─'.repeat(50));
    console.log('Disease:    ', result.disease);
    console.log('Crop:       ', result.crop);
    console.log('Confidence: ', result.confidence + '%');
    console.log('Severity:   ', result.severity);
    console.log('Symptoms:   ', result.symptoms?.join(', ') || 'N/A');
    console.log('Treatment:  ', result.treatment);
    console.log('─'.repeat(50));
    
    return result;
    
  } catch (error) {
    console.error('\n❌ Gemini Vision test failed:');
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data?.error || error.message);
    
    if (error.response?.status === 400) {
      console.log('\n💡 Possible issues:');
      console.log('   1. API key might be for Gemini API, not Gemini Vision');
      console.log('   2. Image format might be incorrect');
      console.log('   3. Request structure might need adjustment');
    }
    
    if (error.response?.status === 404) {
      console.log('\n💡 Tip: Model endpoint might have changed.');
      console.log('   Try: gemini-pro-vision or gemini-1.5-pro');
    }
  }
}

async function compareWithRoboflow() {
  try {
    console.log('\n\n🔄 Comparing with Roboflow Detection...');
    console.log('='.repeat(50));
    
    const imagePath = path.join(__dirname, 'test-image.jpg');
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    
    const response = await axios({
      method: 'POST',
      url: 'https://detect.roboflow.com/plant-disease-detection-iefbi/1',
      params: {
        api_key: process.env.ROBOFLOW_API_KEY,
        confidence: 40
      },
      data: base64Image,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 15000
    });
    
    const predictions = response.data.predictions;
    
    if (typeof predictions === 'object' && !Array.isArray(predictions)) {
      const classes = Object.entries(predictions)
        .map(([name, data]) => ({
          disease: name,
          confidence: Math.round(data.confidence * 100)
        }))
        .sort((a, b) => b.confidence - a.confidence);
      
      console.log('\n📊 Roboflow Top 3 Predictions:');
      classes.slice(0, 3).forEach((pred, i) => {
        console.log(`   ${i + 1}. ${pred.disease}: ${pred.confidence}%`);
      });
    }
    
  } catch (error) {
    console.error('Roboflow comparison failed:', error.message);
  }
}

async function main() {
  console.log('\n🚀 Starting Gemini Vision Integration Test\n');
  
  await testGeminiVision();
  await compareWithRoboflow();
  
  console.log('\n\n='.repeat(50));
  console.log('✨ Test completed!');
  console.log('\n📝 Summary:');
  console.log('   Gemini Vision: Advanced AI with agricultural context');
  console.log('   Roboflow: Specialized disease detection (1000+ images)');
  console.log('   Both are now integrated for maximum accuracy!\n');
}

main().catch(console.error);
