import { GoogleGenAI } from "@google/genai";

if (!import.meta.env.VITE_GEMINI_API_KEY) {
    throw new Error("VITE_GEMINI_API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

// Base URL for REST API calls
const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

// Helper function to make REST API calls
const makeGeminiRequest = async (endpoint: string, body: any) => {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': import.meta.env.VITE_GEMINI_API_KEY!,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API request failed: ${response.status} - ${error}`);
  }

  return response.json();
};

/**
 * Generates a real image using the Gemini API
 * @param prompt - The image generation prompt
 * @param sceneNumber - The scene number (for debugging)
 * @returns Base64 encoded image data URL or null if failed
 */
export const generateRealImage = async (prompt: string, sceneNumber: number): Promise<string | null> => {
  try {
    console.log(`🎨 Generating image for scene ${sceneNumber}:`, prompt);
    
    // Using Gemini 2.0 Flash Preview for image generation
    const endpoint = `${GEMINI_API_BASE_URL}/models/gemini-2.0-flash-preview-image-generation:generateContent`;
    
    const response = await makeGeminiRequest(endpoint, {
      contents: [{
        parts: [
          {
            text: prompt
          }
        ]
      }],
      generationConfig: {
        responseModalities: ["IMAGE", "TEXT"]  // Fixed order: IMAGE must come before TEXT
      }
    });
    
    // Extract the image data from the response
    if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData && part.inlineData.mimeType && part.inlineData.data) {
            // Return as data URL
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
        }
      }
    }
    
    console.warn(`⚠️ No image data found in response for scene ${sceneNumber}`);
    return null;
    
  } catch (error) {
    console.error(`❌ Failed to generate image for scene ${sceneNumber}:`, error);
    return null;
  }
};

/**
 * Generates a video clip using the Veo 2 API (text-to-video)
 * @param videoPrompt - The video generation prompt
 * @param duration - Duration in seconds (5-8)
 * @returns Video operation name for polling, or null if failed
 */
export const generateVideoFromPrompt = async (
  videoPrompt: string, 
  duration: number = 7
): Promise<string | null> => {
  try {
    console.log(`🎥 Generating video clip:`, videoPrompt);
    
    // Using Veo 2.0 for video generation - correct endpoint structure
    const endpoint = `${GEMINI_API_BASE_URL}/models/veo-2.0-generate-001:generateVideos`;
    
    const response = await makeGeminiRequest(endpoint, {
      prompt: videoPrompt,
      config: {
        aspectRatio: "9:16",  // Vertical for mobile
        personGeneration: "dont_allow",  // For safety
        numberOfVideos: 1,
        durationSeconds: Math.min(Math.max(duration, 5), 8)  // Clamp between 5-8
      }
    });
    
    // The response contains an operation name for long-running operation
    if (response.name) {
      console.log(`📋 Video generation started, operation: ${response.name}`);
      return response.name;
    }
    
    console.warn(`⚠️ No operation name in response`);
    return null;
    
  } catch (error) {
    console.error(`❌ Failed to generate video:`, error);
    console.log('ℹ️ Veo 2 is not available in the public API. It requires:');
    console.log('  - Special access/allowlisting from Google');
    console.log('  - A Google Cloud project with billing enabled');
    console.log('  - Currently in limited preview');
    return null;
  }
};

/**
 * Generates a video clip from an image using the Veo 2 API (image-to-video)
 * @param imageUrl - The source image URL or base64 data
 * @param videoPrompt - The video generation prompt describing motion
 * @param duration - Duration in seconds (5-8)
 * @returns Video operation name for polling, or null if failed
 */
export const generateVideoFromImage = async (
  imageUrl: string, 
  videoPrompt: string, 
  duration: number = 7
): Promise<string | null> => {
  try {
    console.log(`🎥 Generating video from image:`, videoPrompt);
    
    // Using Veo 2.0 for image-to-video generation
    const endpoint = `${GEMINI_API_BASE_URL}/models/veo-2.0-generate-001:generateVideos`;
    
    // Extract base64 data and mime type if it's a data URL
    let imageBytes: string;
    let mimeType: string = 'image/png';
    
    if (imageUrl.startsWith('data:')) {
      const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1];
        imageBytes = matches[2];
      } else {
        throw new Error('Invalid data URL format');
      }
    } else {
      // For external URLs, we'd need to fetch and convert to base64
      console.warn('⚠️ External URLs need to be converted to base64. Using text-to-video instead.');
      return generateVideoFromPrompt(videoPrompt, duration);
    }
    
    const response = await makeGeminiRequest(endpoint, {
      prompt: videoPrompt,
      image: {
        imageBytes: imageBytes,
        mimeType: mimeType
      },
      config: {
        aspectRatio: "9:16",  // Vertical for mobile
        numberOfVideos: 1,
        durationSeconds: Math.min(Math.max(duration, 5), 8)  // Clamp between 5-8
      }
    });
    
    // The response contains an operation name for long-running operation
    if (response.name) {
      console.log(`📋 Video generation started, operation: ${response.name}`);
      return response.name;
    }
    
    console.warn(`⚠️ No operation name in response`);
    return null;
    
  } catch (error) {
    console.error(`❌ Failed to generate video from image:`, error);
    return null;
  }
};

/**
 * Polls for video generation completion
 * @param operationName - The operation name from generateVideoFromImage
 * @returns Video URL when complete, or null if failed
 */
export const pollVideoGeneration = async (operationName: string): Promise<string | null> => {
  try {
    const maxAttempts = 60; // 5 minutes max (5 second intervals)
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const response = await fetch(`${GEMINI_API_BASE_URL}/${operationName}`, {
        headers: {
          'x-goog-api-key': import.meta.env.VITE_GEMINI_API_KEY!,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to check operation status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.done) {
        if (data.error) {
          throw new Error(`Video generation failed: ${data.error.message}`);
        }
        
        // Extract video URL from response
        if (data.response?.generatedVideos?.[0]?.video) {
          const videoData = data.response.generatedVideos[0].video;
          // The video might be a URL or base64 data
          return videoData;
        }
        
        throw new Error('No video data in completed response');
      }
      
      // Wait 5 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
    }
    
    throw new Error('Video generation timed out');
    
  } catch (error) {
    console.error(`❌ Failed to poll video generation:`, error);
    return null;
  }
};

/**
 * Combines multiple video clips into a single video
 * @param videoClips - Array of video URLs or base64 data
 * @param audioUrl - Optional audio track URL
 * @returns Combined video URL or base64 data
 */
export const combineVideoClips = async (
  videoClips: string[], 
  audioUrl?: string
): Promise<string | null> => {
  try {
    console.log(`🎬 Combining ${videoClips.length} video clips`);
    
    // TODO: This might need to be done client-side with a library like FFmpeg.js
    // or through a separate video processing API
    
    throw new Error("Video combining not yet implemented");
    
  } catch (error) {
    console.error(`❌ Failed to combine videos:`, error);
    return null;
  }
};

/**
 * Complete media generation pipeline
 * Generates images, then videos, then combines them
 */
export const generateCompleteVideo = async (
  scenes: Array<{
    imagePrompt: string;
    videoPrompt: string;
  }>,
  narrationAudio?: string
): Promise<{
  images: (string | null)[];
  videos: (string | null)[];
  finalVideo: string | null;
}> => {
  console.log(`🚀 Starting complete video generation for ${scenes.length} scenes`);
  
  // Step 1: Generate all images
  const images = await Promise.all(
    scenes.map((scene, index) => generateRealImage(scene.imagePrompt, index + 1))
  );
  
  console.log(`✅ Generated ${images.filter(img => img !== null).length}/${scenes.length} images`);
  
  // Step 2: Generate videos from successful images
  const videos = await Promise.all(
    scenes.map(async (scene, index) => {
      const image = images[index];
      if (!image) return null;
      
      return generateVideoFromImage(image, scene.videoPrompt);
    })
  );
  
  console.log(`✅ Generated ${videos.filter(vid => vid !== null).length}/${scenes.length} videos`);
  
  // Step 3: Combine videos into final output
  const validVideos = videos.filter(vid => vid !== null) as string[];
  const finalVideo = validVideos.length > 0 
    ? await combineVideoClips(validVideos, narrationAudio)
    : null;
  
  return {
    images,
    videos,
    finalVideo
  };
};
