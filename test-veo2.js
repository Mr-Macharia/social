// Test script for Veo 2 API
// Run with: node test-veo2.js

import { GoogleGenAI } from '@google/genai';
import { writeFile } from 'fs/promises';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testVeo2API() {
  console.log('🔍 Testing Veo 2 API Access...\n');
  
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in environment variables');
    return;
  }
  
  console.log('✅ API Key found:', apiKey.substring(0, 10) + '...');
  
  try {
    // Initialize the client
    const ai = new GoogleGenAI({
      apiKey: apiKey,
    });
    
    console.log('\n📡 Attempting to generate video with Veo 2...');
    
    // Try to generate a simple video
    const operation = await ai.models.generateVideos({
      model: 'veo-2.0-generate-001',
      prompt: 'A serene ocean wave gently rolling onto a sandy beach at sunset',
      config: {
        numberOfVideos: 1,
        aspectRatio: '16:9',
        personGeneration: 'dont_allow',
        durationSeconds: 5,
      },
    });
    
    console.log('✅ Initial request successful!');
    console.log('Operation name:', operation.name);
    console.log('Operation details:', JSON.stringify(operation, null, 2));
    
    // Poll for completion
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes max
    
    while (!operation.done && attempts < maxAttempts) {
      console.log(`\n⏳ Waiting for video generation... (attempt ${attempts + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      
      try {
        const updatedOp = await ai.operations.getVideosOperation({
          operation: operation,
        });
        
        if (updatedOp.done) {
          console.log('\n✅ Video generation complete!');
          console.log('Response:', JSON.stringify(updatedOp.response, null, 2));
          
          if (updatedOp.response?.generatedVideos?.length > 0) {
            const video = updatedOp.response.generatedVideos[0];
            console.log('\n🎥 Video generated successfully!');
            console.log('Video URI:', video.video?.uri);
            
            // Try to download the video
            if (video.video?.uri) {
              console.log('\n📥 Attempting to download video...');
              const videoUrl = `${video.video.uri}&key=${apiKey}`;
              const response = await fetch(videoUrl);
              
              if (response.ok) {
                const buffer = await response.arrayBuffer();
                await writeFile('test-video.mp4', Buffer.from(buffer));
                console.log('✅ Video saved as test-video.mp4');
              } else {
                console.log('❌ Failed to download video:', response.status, response.statusText);
              }
            }
          }
          
          operation.done = true;
        }
      } catch (pollError) {
        console.error('❌ Error while polling:', pollError.message);
      }
      
      attempts++;
    }
    
    if (!operation.done) {
      console.log('\n⏱️ Video generation timed out after 5 minutes');
    }
    
  } catch (error) {
    console.error('\n❌ Error occurred:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    // Check if it's an API access issue
    if (error.message.includes('403') || error.message.includes('forbidden')) {
      console.log('\n⚠️ This might be an API access issue. Veo 2 requires:');
      console.log('  1. A paid Google Cloud account');
      console.log('  2. Veo 2 API access enabled');
      console.log('  3. Proper billing setup');
      console.log('  4. Your account/project may need to be allowlisted for Veo 2 access');
    }
    
    if (error.message.includes('404') || error.message.includes('not found')) {
      console.log('\n⚠️ The Veo 2 API endpoint might not be available yet.');
      console.log('  Check if the model name is correct: veo-2.0-generate-001');
    }
  }
}

// Test basic API connectivity first
async function testBasicAPI() {
  console.log('\n🔍 Testing basic Gemini API connectivity...\n');
  
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Basic API connectivity successful!');
      console.log('\nAvailable models:');
      
      const models = data.models || [];
      models.forEach(model => {
        console.log(`  - ${model.name}`);
        if (model.name.includes('veo')) {
          console.log(`    ✨ Veo model found!`);
        }
      });
      
      // Check specifically for Veo models
      const veoModels = models.filter(m => m.name.includes('veo'));
      if (veoModels.length === 0) {
        console.log('\n⚠️ No Veo models found in your available models list.');
        console.log('This might indicate that Veo 2 access is not enabled for your API key.');
      }
    } else {
      console.error('❌ API request failed:', response.status, response.statusText);
      console.error('Response:', await response.text());
    }
  } catch (error) {
    console.error('❌ Failed to connect to API:', error.message);
  }
}

// Run tests
async function runAllTests() {
  await testBasicAPI();
  console.log('\n' + '='.repeat(60) + '\n');
  await testVeo2API();
}

runAllTests();
