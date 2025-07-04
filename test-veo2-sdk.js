// Test script to check if Veo 2 API is available in current SDK
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🧪 Testing Veo 2 API availability in @google/genai SDK...\n');

try {
  // Initialize the client
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || ""
  });
  
  console.log('✅ GoogleGenAI client initialized');
  
  // Check if models object exists
  if (ai.models) {
    console.log('✅ ai.models exists');
    
    // Check if generateVideos method exists
    if (typeof ai.models.generateVideos === 'function') {
      console.log('✅ ai.models.generateVideos method exists');
    } else {
      console.log('❌ ai.models.generateVideos method NOT found');
    }
  } else {
    console.log('❌ ai.models NOT found');
  }
  
  // Check if operations object exists
  if (ai.operations) {
    console.log('✅ ai.operations exists');
    
    // Check if getVideosOperation method exists
    if (typeof ai.operations.getVideosOperation === 'function') {
      console.log('✅ ai.operations.getVideosOperation method exists');
    } else {
      console.log('❌ ai.operations.getVideosOperation method NOT found');
    }
  } else {
    console.log('❌ ai.operations NOT found');
  }
  
  // Try to call generateVideos with a simple prompt
  console.log('\n📹 Attempting to call generateVideos...');
  
  try {
    const result = await ai.models.generateVideos({
      model: "veo-2.0-generate-001",
      prompt: "A test video",
      config: {
        aspectRatio: "16:9",
        personGeneration: "dont_allow",
        numberOfVideos: 1,
        durationSeconds: 5
      }
    });
    
    console.log('✅ generateVideos call succeeded!');
    console.log('Operation name:', result.name);
    
  } catch (error) {
    console.log('❌ generateVideos call failed:');
    console.log('Error message:', error.message);
    
    // Check if it's a method not found error
    if (error.message.includes('is not a function')) {
      console.log('\n⚠️  The generateVideos method is not available in the current SDK version.');
      console.log('The Veo 2 API might require:');
      console.log('- A newer SDK version (when available)');
      console.log('- Special access or beta enrollment');
      console.log('- Direct REST API calls instead of SDK methods');
    }
  }
  
} catch (error) {
  console.error('❌ Test failed:', error);
}

console.log('\n🏁 Test complete!');
