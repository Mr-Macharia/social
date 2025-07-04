import { GoogleGenAI } from "@google/genai";
import type { ViralVideoScript } from '../types';
import { generateRealImage } from './mediaGenerationService';
import { generateVideoFromImage as generateVeo2Video, getVideoUrls } from './veo2Service';

if (!import.meta.env.VITE_GEMINI_API_KEY) {
    throw new Error("VITE_GEMINI_API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

const getPromptTemplate = (topic: string): string => `
You are a viral short video scriptwriter for social media platforms like TikTok, Instagram Reels, and YouTube Shorts.
Your task is to generate a complete video asset plan based on the user's topic.

The output MUST be a valid JSON object. Do not include any text outside of the JSON object.

The JSON object must follow this structure:
{
  "title": "A short engaging title or hook (max 10 words).",
  "hook": "An incredibly strong opening sentence to grab attention immediately.",
  "narrationScript": "A full script for narration, between 120-150 words. Write it to be spoken naturally in exactly 30 seconds when read at normal pace (about 150 words per minute).",
  "sceneBreakdown": [
    {
      "scene": 1,
      "description": "A description of the visual for this scene.",
      "imagePrompt": "A detailed Imagen 4 prompt for a photorealistic, high-quality image. Focus on clear subjects, good lighting, and cinematic composition.",
      "videoPrompt": "A detailed Veo 2 prompt to create a short video clip from this image. Describe the motion, camera movement, and visual effects."
    }
  ],
  "captions": [
    {
      "startTime": 0,
      "endTime": 2,
      "text": "Caption summary (max 7 words)",
      "narrationText": "The exact words from narrationScript spoken during this time (approx. 8-10 words)"
    }
  ]
}

Guidelines:
1.  **Script:** 120-150 words total, designed to be read in exactly 30 seconds at natural speaking pace.
2.  **Scenes:** Create exactly 4 scenes, each lasting 7.5 seconds. Image prompts must be safe and detailed.
3.  **Captions:** This is critical. Break the narrationScript into 15 short segments for dynamic, word-by-word display:
    - Each segment should last exactly 2 seconds (0-2s, 2-4s, 4-6s, etc., up to 30s).
    - The \`narrationText\` field for each segment MUST contain the exact words from the narrationScript spoken during that 2-second interval (usually 8-10 words).
    - The \`text\` field must be a very short summary of the narration, MAX 7 WORDS.
4.  **Timing:** Total duration must be exactly 30 seconds.
5.  **Video Prompts:** Each scene needs motion - camera pans, zooms, object movement, etc.

Topic: "${topic}"

Generate the JSON response now.
`;

export const generateViralVideoScript = async (topic: string): Promise<ViralVideoScript> => {
  const prompt = getPromptTemplate(topic);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.8,
        topP: 0.9,
      },
    });

    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }
    
    const parsedData = JSON.parse(jsonStr) as ViralVideoScript;

    if (!parsedData.title || !parsedData.sceneBreakdown || !parsedData.captions || parsedData.sceneBreakdown.length === 0) {
        throw new Error("AI response is missing required fields or has no scenes.");
    }

    return parsedData;

  } catch (error) {
    console.error("Error calling or parsing Gemini API response:", error);
    if (error instanceof SyntaxError) {
        throw new Error("Failed to parse the script from the AI. The response was not valid JSON.");
    }
    throw new Error("Failed to generate video script. Please try again.");
  }
};

export const generateImage = async (prompt: string): Promise<string> => {
  try {
    // Use the real image generation from mediaGenerationService
    const result = await generateRealImage(prompt, 0);
    if (result) {
      return result;
    }
    
    // Fallback to placeholder if real generation fails
    throw new Error("Image generation failed, using placeholder");
    
  } catch (error) {
      console.error(`Failed to generate image for prompt "${prompt}":`, error);
      
      // Create attractive placeholders with glassmorphism style
      const subject = prompt.split(',')[0].trim().toLowerCase();
      
      // Create topic-specific colored backgrounds
      let gradient1 = '#667eea', gradient2 = '#764ba2', emoji = '🎬';
      
      if (subject.includes('ocean') || subject.includes('water') || subject.includes('octopus')) {
        gradient1 = '#4facfe'; gradient2 = '#00f2fe'; emoji = '🌊';
      } else if (subject.includes('space') || subject.includes('star') || subject.includes('planet')) {
        gradient1 = '#667eea'; gradient2 = '#2d1b69'; emoji = '🚀';
      } else if (subject.includes('nature') || subject.includes('tree') || subject.includes('forest')) {
        gradient1 = '#11998e'; gradient2 = '#38ef7d'; emoji = '🌳';
      } else if (subject.includes('tech') || subject.includes('digital') || subject.includes('computer')) {
        gradient1 = '#667eea'; gradient2 = '#764ba2'; emoji = '💻';
      } else if (subject.includes('madonna') || subject.includes('music') || subject.includes('artist')) {
        gradient1 = '#f093fb'; gradient2 = '#f5576c'; emoji = '🎤';
      }
      
      // Simplified SVG that works across all browsers
      const placeholderSvg = `<svg width="320" height="568" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${gradient1};stop-opacity:1" /><stop offset="100%" style="stop-color:${gradient2};stop-opacity:1" /></linearGradient></defs><rect width="100%" height="100%" fill="url(#bg)"/><rect x="30" y="200" width="260" height="168" fill="rgba(255,255,255,0.1)" rx="20" stroke="rgba(255,255,255,0.2)" stroke-width="1"/><text x="160" y="250" font-family="Arial, sans-serif" font-size="32" fill="white" text-anchor="middle">${emoji}</text><text x="160" y="280" font-family="Arial, sans-serif" font-size="16" fill="white" text-anchor="middle" font-weight="600">${(subject || 'Content').charAt(0).toUpperCase() + (subject || 'Content').slice(1)}</text><text x="160" y="300" font-family="Arial, sans-serif" font-size="12" fill="rgba(255,255,255,0.8)" text-anchor="middle">Image Placeholder</text><text x="160" y="320" font-family="Arial, sans-serif" font-size="10" fill="rgba(255,255,255,0.6)" text-anchor="middle">AI Video Creator</text></svg>`;
      
      // Use URL encoding instead of base64 for better browser compatibility
      const encodedSvg = encodeURIComponent(placeholderSvg);
      console.log(`🎨 Generated themed placeholder for: ${subject}`);
      return `data:image/svg+xml,${encodedSvg}`;
  }
};

// Function to generate video clips using Veo 2
export const generateVideoClip = async (imageUrl: string, videoPrompt: string, duration: number = 7): Promise<string | null> => {
  try {
    console.log('🎥 Generating video clip with Veo 2:', videoPrompt);
    
    // Extract base64 data from data URL if needed
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
      console.warn('⚠️ External URLs need to be converted to base64');
      return null;
    }
    
    // Generate video using Veo 2
    const operation = await generateVeo2Video(
      imageBytes,
      videoPrompt,
      mimeType,
      {
        aspectRatio: "9:16", // Vertical for mobile
        personGeneration: "dont_allow",
        numberOfVideos: 1,
        durationSeconds: Math.round(duration),
        enhancePrompt: true
      }
    );
    
    // Get the video URLs
    const videoUrls = getVideoUrls(operation);
    
    if (videoUrls.length > 0) {
      console.log('✅ Video generated successfully:', videoUrls[0]);
      return videoUrls[0];
    } else {
      console.warn('⚠️ No video URLs returned');
      return null;
    }
    
  } catch (error) {
    console.error('❌ Video generation failed:', error);
    // Return null instead of throwing to allow graceful degradation
    return null;
  }
};
