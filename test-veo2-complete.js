// Complete test for Veo 2 video generation
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
import fs from 'fs';
import https from 'https';

// Load environment variables
dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || ""
});

async function downloadVideo(url, filename) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filename);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(filename);
      });
    }).on('error', (err) => {
      fs.unlink(filename, () => {}); // Delete the file on error
      reject(err);
    });
  });
}

async function generateAndDownloadVideo() {
  console.log('🎥 Starting Veo 2 video generation test...\n');
  
  try {
    // Step 1: Start video generation
    console.log('📝 Prompt: "A serene ocean wave gently rolling onto a sandy beach at sunset, golden hour lighting"');
    console.log('⏳ Starting video generation...');
    
    let operation = await ai.models.generateVideos({
      model: "veo-2.0-generate-001",
      prompt: "A serene ocean wave gently rolling onto a sandy beach at sunset, golden hour lighting",
      config: {
        aspectRatio: "16:9",
        personGeneration: "dont_allow",
        numberOfVideos: 1,
        durationSeconds: 7,
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
      console.log(`⏳ Polling attempt ${pollCount}... (${Math.floor((Date.now() - startTime) / 1000)}s elapsed)`);
      
      await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds
      
      operation = await ai.operations.getVideosOperation({
        operation: operation,
      });
      
      if (operation.done) {
        console.log('\n✅ Video generation completed!');
      }
    }
    
    const totalTime = Math.floor((Date.now() - startTime) / 1000);
    console.log(`⏱️  Total generation time: ${totalTime} seconds\n`);
    
    // Step 3: Check results
    if (operation.error) {
      console.error('❌ Video generation failed with error:');
      console.error(operation.error);
      return;
    }
    
    if (operation.response?.generatedVideos?.length > 0) {
      console.log(`📹 Generated ${operation.response.generatedVideos.length} video(s):`);
      
      for (let i = 0; i < operation.response.generatedVideos.length; i++) {
        const video = operation.response.generatedVideos[i];
        
        if (video.video?.uri) {
          const videoUrl = `${video.video.uri}&key=${process.env.GEMINI_API_KEY}`;
          console.log(`\n🎬 Video ${i + 1}:`);
          console.log(`   URI: ${video.video.uri}`);
          
          // Try to download the video
          try {
            const filename = `generated_video_${i + 1}.mp4`;
            console.log(`   💾 Downloading to: ${filename}...`);
            await downloadVideo(videoUrl, filename);
            console.log(`   ✅ Downloaded successfully!`);
          } catch (downloadError) {
            console.log(`   ⚠️  Failed to download: ${downloadError.message}`);
          }
        }
      }
    } else {
      console.log('⚠️  No videos were generated in the response.');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('Error details:', error.message);
    
    if (error.message.includes('not enabled')) {
      console.log('\n💡 Possible solutions:');
      console.log('1. Make sure you have billing enabled on your Google Cloud project');
      console.log('2. Veo 2 is a paid feature and requires a paid Google Cloud account');
      console.log('3. You may need to enable the Generative Language API in Google Cloud Console');
    }
  }
}

// Run the test
generateAndDownloadVideo().then(() => {
  console.log('\n🏁 Test complete!');
}).catch((error) => {
  console.error('Unexpected error:', error);
});
