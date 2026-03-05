/**
 * Test Roboflow with Real Crop Disease Image
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const ROBOFLOW_API_KEY = process.env.ROBOFLOW_API_KEY;
const ROBOFLOW_MODEL_ID = process.env.ROBOFLOW_MODEL_ID;

console.log('\n🧪 Testing Roboflow with Real Image\n');
console.log('='.repeat(50));

async function downloadSampleImage() {
  try {
    console.log('\n📥 Downloading sample tomato disease image...');
    
    // Using a public tomato late blight image
    const imageUrl = 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=640';
    
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 10000
    });
    
    const imagePath = path.join(__dirname, 'test-image.jpg');
    fs.writeFileSync(imagePath, response.data);
    
    console.log('✅ Image downloaded:', imagePath);
    return imagePath;
  } catch (error) {
    console.error('❌ Failed to download image:', error.message);
    return null;
  }
}

async function testRoboflowDetection(imagePath) {
  try {
    console.log('\n🔍 Testing Roboflow detection...');
    console.log('Model ID:', ROBOFLOW_MODEL_ID);
    console.log('API Key:', ROBOFLOW_API_KEY ? '✅ Configured' : '❌ Missing');
    
    // Read image and convert to base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    
    console.log('Image size:', imageBuffer.length, 'bytes');
    console.log('Base64 length:', base64Image.length, 'characters');
    
    // Make request to Roboflow
    const endpoint = `https://detect.roboflow.com/${ROBOFLOW_MODEL_ID}`;
    
    console.log('\n📡 Sending request to:', endpoint);
    
    const response = await axios({
      method: 'POST',
      url: endpoint,
      params: {
        api_key: ROBOFLOW_API_KEY,
        confidence: 40,
        overlap: 30
      },
      data: base64Image,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 30000
    });
    
    console.log('\n✅ Roboflow Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.predictions && response.data.predictions.length > 0) {
      console.log('\n🎯 Detections Found:');
      response.data.predictions.forEach((pred, i) => {
        console.log(`\n   ${i + 1}. ${pred.class}`);
        console.log(`      Confidence: ${Math.round(pred.confidence * 100)}%`);
        console.log(`      Location: (${pred.x}, ${pred.y})`);
        console.log(`      Size: ${pred.width}x${pred.height}`);
      });
    } else {
      console.log('\n⚠️ No predictions returned');
      console.log('This could mean:');
      console.log('   1. The model needs to be trained first');
      console.log('   2. The image doesn\'t contain detectable diseases');
      console.log('   3. Confidence threshold is too high');
    }
    
    return response.data;
    
  } catch (error) {
    console.error('\n❌ Roboflow detection failed:');
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      console.log('\n💡 Tip: Model not found. Please:');
      console.log('   1. Go to https://app.roboflow.com');
      console.log('   2. Train your model with some images');
      console.log('   3. Deploy the model');
      console.log('   4. Use the correct model ID from the deploy page');
    }
    
    if (error.response?.status === 400) {
      console.log('\n💡 Tip: Bad request. Check:');
      console.log('   1. API key is correct');
      console.log('   2. Model ID format is correct (workspace/model/version)');
      console.log('   3. Image is valid');
    }
    
    return null;
  }
}

async function testWithPublicModel() {
  try {
    console.log('\n\n🌍 Testing with Public Roboflow Universe Model...');
    console.log('='.repeat(50));
    
    // Use a public plant disease model from Roboflow Universe
    const publicModelId = 'plant-disease-detection-iefbi/1';
    
    const imagePath = path.join(__dirname, 'test-image.jpg');
    if (!fs.existsSync(imagePath)) {
      console.log('❌ Test image not found');
      return;
    }
    
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    
    const endpoint = `https://detect.roboflow.com/${publicModelId}`;
    
    console.log('📡 Testing public model:', publicModelId);
    
    const response = await axios({
      method: 'POST',
      url: endpoint,
      params: {
        api_key: ROBOFLOW_API_KEY,
        confidence: 30
      },
      data: base64Image,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 30000
    });
    
    console.log('\n✅ Public Model Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.predictions && response.data.predictions.length > 0) {
      console.log('\n🎯 Public Model Detections:');
      response.data.predictions.forEach((pred, i) => {
        console.log(`   ${i + 1}. ${pred.class} - ${Math.round(pred.confidence * 100)}%`);
      });
    }
    
  } catch (error) {
    console.error('\n❌ Public model test failed:', error.response?.data || error.message);
  }
}

async function main() {
  console.log('\n🚀 Starting Roboflow Integration Test\n');
  
  // Step 1: Download test image
  const imagePath = await downloadSampleImage();
  
  if (!imagePath) {
    console.log('\n❌ Cannot proceed without test image');
    return;
  }
  
  // Step 2: Test with your model
  await testRoboflowDetection(imagePath);
  
  // Step 3: Test with public model (to verify API key works)
  await testWithPublicModel();
  
  console.log('\n\n='.repeat(50));
  console.log('✨ Test completed!\n');
  console.log('📝 Next Steps:');
  console.log('   1. If your model returned "No predictions", train it at:');
  console.log('      https://app.roboflow.com');
  console.log('   2. Upload 20-30 images of diseased crops');
  console.log('   3. Label them (draw boxes or classify)');
  console.log('   4. Generate dataset and train');
  console.log('   5. Deploy the model');
  console.log('   6. Update ROBOFLOW_MODEL_ID in .env\n');
}

main().catch(console.error);
