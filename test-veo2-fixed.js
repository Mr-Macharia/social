// Improved test for Veo 2 video generation with proper download handling
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
import fs from 'fs';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || ""
});

async function downloadVideoWithFetch(url, filename) {
  try {
    console.log(`   🌐 Fetching from: ${url.substring(0, 80)}...`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(filename, Buffer.from(buffer));
    
    const stats = fs.statSync(filename);
    console.log(`   📊 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    
    return filename;
  } catch (error) {
    throw new Error(`Download failed: ${error.message}`);
  }
}

async function generateAndDownloadVideo() {
  console.log('🎥 Starting Veo 2 video generation test...\n');
  
  try {
    // Step 1: Start video generation with a simple prompt
    const prompt = "A peaceful mountain landscape with clouds moving across the sky, time-lapse style";
    console.log(`📝 Prompt: "${prompt}"`);
    console.log('⏳ Starting video generation...');
    
    let operation = await ai.models.generateVideos({
      model: "veo-2.0-generate-001",
      prompt: prompt,
      config: {
        aspectRatio: "16:9",
        personGeneration: "dont_allow",
        numberOfVideos: 1,
        durationSeconds: 5,  // Shorter duration for testing
        enhancePrompt: true
      }
    });
    
    console.log(`✅ Video generation started!`);
    console.log(`📋 Operation ID: ${operation.name}\n`);
    
    // Step 2: Poll for completion
    let pollCount = 0;
    const startTime = Date.now();
    
    while (!operation.done) {
      pollCount++;
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      console.log(`⏳ Polling attempt ${pollCount}... (${elapsed}s elapsed)`);
      
      await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds
      
      operation = await ai.operations.getVideosOperation({
        operation: operation,
      });
      
      if (operation.done) {
        console.log('\n✅ Video generation completed!');
      }
      
      // Timeout after 5 minutes
      if (elapsed > 300) {
        throw new Error('Video generation timed out after 5 minutes');
      }
    }
    
    const totalTime = Math.floor((Date.now() - startTime) / 1000);
    console.log(`⏱️  Total generation time: ${totalTime} seconds\n`);
    
    // Step 3: Check results
    if (operation.error) {
      console.error('❌ Video generation failed with error:');
      console.error(JSON.stringify(operation.error, null, 2));
      return;
    }
    
    // Debug: Log the full response structure
    console.log('📋 Operation response structure:');
    console.log(JSON.stringify(operation, null, 2).substring(0, 500) + '...\n');
    
    if (operation.response?.generatedVideos?.length > 0) {
      console.log(`📹 Generated ${operation.response.generatedVideos.length} video(s):`);
      
      for (let i = 0; i < operation.response.generatedVideos.length; i++) {
        const video = operation.response.generatedVideos[i];
        
        console.log(`\n🎬 Video ${i + 1}:`);
        
        if (video.video?.uri) {
          console.log(`   URI: ${video.video.uri}`);
          
          // Construct the download URL with API key
          const videoUrl = `${video.video.uri}&key=${process.env.GEMINI_API_KEY}`;
          
          // Try to download the video
          try {
            const filename = `veo2_video_${Date.now()}.mp4`;
            console.log(`   💾 Downloading to: ${filename}...`);
            
            await downloadVideoWithFetch(videoUrl, filename);
            console.log(`   ✅ Downloaded successfully!`);
            
            // Verify it's a valid video file
            const fileContent = fs.readFileSync(filename, { encoding: 'utf8', flag: 'r' }).substring(0, 10);
            if (fileContent.includes('error') || fileContent.includes('{')) {
              console.log(`   ⚠️  Downloaded file appears to be an error response, not a video`);
              console.log(`   Content preview: ${fs.readFileSync(filename, 'utf8').substring(0, 200)}`);
            }
            
          } catch (downloadError) {
            console.log(`   ❌ Failed to download: ${downloadError.message}`);
          }
        } else {
          console.log('   ⚠️  No video URI found in response');
        }
      }
    } else {
      console.log('⚠️  No videos were generated in the response.');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('Error details:', error.message);
    
    if (error.message.includes('not enabled') || error.message.includes('billing')) {
      console.log('\n💡 Possible solutions:');
      console.log('1. Make sure you have billing enabled on your Google Cloud project');
      console.log('2. Veo 2 is a paid feature and requires a paid Google Cloud account');
      console.log('3. You may need to enable the Generative Language API in Google Cloud Console');
      console.log('4. Your API key may not have access to Veo 2 (it requires special access)');
    }
  }
}

// Run the test
generateAndDownloadVideo().then(() => {
  console.log('\n🏁 Test complete!');
}).catch((error) => {
  console.error('Unexpected error:', error);
});
