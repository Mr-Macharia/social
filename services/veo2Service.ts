import { GoogleGenAI } from "@google/genai";

// Initialize the Google Gen AI client
const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || ""
});

/**
 * Generates a video using Veo 2 from a text prompt
 * @param prompt - The text prompt for video generation
 * @param config - Optional configuration for video generation
 * @returns The operation object containing the video generation result
 */
export async function generateVideoFromText(
  prompt: string,
  config?: {
    aspectRatio?: "16:9" | "9:16";
    personGeneration?: "dont_allow" | "allow_adult" | "allow_all";
    numberOfVideos?: number;
    durationSeconds?: number;
    enhancePrompt?: boolean;
    negativePrompt?: string;
  }
) {
  try {
    console.log("🎥 Starting Veo 2 video generation from text...");
    console.log("Prompt:", prompt);
    
    // Start video generation
    let operation = await ai.models.generateVideos({
      model: "veo-2.0-generate-001",
      prompt: prompt,
      config: {
        aspectRatio: config?.aspectRatio || "16:9",
        personGeneration: config?.personGeneration || "dont_allow",
        numberOfVideos: config?.numberOfVideos || 1,
        durationSeconds: Math.round(config?.durationSeconds || 7),
        enhancePrompt: config?.enhancePrompt !== false, // Default true
        ...(config?.negativePrompt ? { negativePrompt: config.negativePrompt } : {})
      },
    });

    console.log("⏳ Video generation started, operation ID:", operation.name);
    
    // Poll for completion
    while (!operation.done) {
      console.log("⏳ Waiting for video generation to complete...");
      await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds
      operation = await ai.operations.getVideosOperation({
        operation: operation,
      });
    }

    console.log("✅ Video generation completed!");
    
    // Return the completed operation
    return operation;
    
  } catch (error) {
    console.error("❌ Failed to generate video:", error);
    throw error;
  }
}

/**
 * Generates a video using Veo 2 from an image and prompt
 * @param imageBytes - Base64 encoded image bytes
 * @param prompt - The text prompt for video generation
 * @param mimeType - The MIME type of the image (e.g., "image/png")
 * @param config - Optional configuration for video generation
 * @returns The operation object containing the video generation result
 */
export async function generateVideoFromImage(
  imageBytes: string,
  prompt: string,
  mimeType: string = "image/png",
  config?: {
    aspectRatio?: "16:9" | "9:16";
    personGeneration?: "dont_allow" | "allow_adult";
    numberOfVideos?: number;
    durationSeconds?: number;
    enhancePrompt?: boolean;
    negativePrompt?: string;
  }
) {
  try {
    console.log("🎥 Starting Veo 2 video generation from image...");
    console.log("Prompt:", prompt);
    
    // Start video generation with image
    let operation = await ai.models.generateVideos({
      model: "veo-2.0-generate-001",
      prompt: prompt,
      image: {
        imageBytes: imageBytes,
        mimeType: mimeType,
      },
      config: {
        aspectRatio: config?.aspectRatio || "16:9",
        personGeneration: config?.personGeneration || "dont_allow", // Note: only dont_allow and allow_adult for image-to-video
        numberOfVideos: config?.numberOfVideos || 1,
        durationSeconds: Math.round(config?.durationSeconds || 7),
        enhancePrompt: config?.enhancePrompt !== false, // Default true
        ...(config?.negativePrompt ? { negativePrompt: config.negativePrompt } : {})
      },
    });

    console.log("⏳ Video generation started, operation ID:", operation.name);
    
    // Poll for completion
    while (!operation.done) {
      console.log("⏳ Waiting for video generation to complete...");
      await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds
      operation = await ai.operations.getVideosOperation({
        operation: operation,
      });
    }

    console.log("✅ Video generation completed!");
    
    // Return the completed operation
    return operation;
    
  } catch (error) {
    console.error("❌ Failed to generate video from image:", error);
    throw error;
  }
}

/**
 * Downloads a generated video blob for browser use
 * @param videoUrl - The video URL to download
 * @returns Blob containing the video data
 */
export async function downloadVideoAsBlob(videoUrl: string): Promise<Blob> {
  try {
    const response = await fetch(videoUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.status} ${response.statusText}`);
    }
    return await response.blob();
  } catch (error) {
    console.error('❌ Failed to download video:', error);
    throw error;
  }
}

/**
 * Gets the video URLs from a completed operation
 * @param operation - The completed operation from video generation
 * @returns Array of video URLs (with API key appended)
 */
export function getVideoUrls(operation: any): string[] {
  const urls: string[] = [];
  
  if (!operation.response?.generatedVideos) {
    return urls;
  }

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error("VITE_GEMINI_API_KEY environment variable not set");
    return urls;
  }

  for (const generatedVideo of operation.response.generatedVideos) {
    if (generatedVideo.video?.uri) {
      // Append API key to the URI
      urls.push(`${generatedVideo.video.uri}&key=${apiKey}`);
    }
  }
  
  return urls;
}

// Example usage function
export async function testVeo2Generation() {
  try {
    // Test text-to-video
    console.log("\n=== Testing Text-to-Video ===");
    const textOperation = await generateVideoFromText(
      "A cute calico kitten playing with a ball of yarn in a cozy living room, warm lighting",
      {
        aspectRatio: "16:9",
        personGeneration: "dont_allow",
        numberOfVideos: 1,
        durationSeconds: 7
      }
    );
    
    const videoUrls = getVideoUrls(textOperation);
    console.log("Generated video URLs:", videoUrls);
    
    // Optionally download the videos
    // const savedPaths = await downloadGeneratedVideos(textOperation);
    // console.log("Saved videos to:", savedPaths);
    
    return videoUrls;
    
  } catch (error) {
    console.error("Test failed:", error);
    throw error;
  }
}
