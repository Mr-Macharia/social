import { GoogleGenAI } from "@google/genai";
import type { ViralVideoScript } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getPromptTemplate = (topic: string): string => `
You are a viral short video scriptwriter for social media platforms like TikTok, Instagram Reels, and YouTube Shorts.
Your task is to generate a complete video asset plan based on the user's topic.

The output MUST be a valid JSON object. Do not include any text outside of the JSON object.

The JSON object must follow this structure:
{
  "title": "A short engaging title or hook (max 10 words).",
  "hook": "An incredibly strong opening sentence to grab attention immediately.",
  "narrationScript": "A full script for narration, between 150-200 words. It should be engaging, use storytelling or surprising facts, and have a strong conclusion or a question to prompt comments.",
  "sceneBreakdown": [
    {
      "scene": 1,
      "description": "A description of the visual for this scene.",
      "imagePrompt": "A detailed DALL-E or Imagen prompt to generate a photorealistic image for this scene."
    }
  ],
  "captions": [
    {
      "startTime": 0,
      "endTime": 5,
      "text": "The first caption segment."
    }
  ]
}

Guidelines:
1.  **Script:** 150-200 words, conversational language, high-energy.
2.  **Scenes:** Create 4 to 6 distinct visual scenes. The image prompts should be vivid and suitable for an AI image generator. Ensure prompts are safe and unlikely to be blocked.
3.  **Captions:** Break down the narration script into short, timed caption segments. The total duration should be between 30 and 60 seconds.

Topic: "${topic}"

Generate the JSON response now.
`;

export const generateViralVideoScript = async (topic: string): Promise<ViralVideoScript> => {
  const prompt = getPromptTemplate(topic);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-04-17",
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
    const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: prompt,
        config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
    });

    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    if (!base64ImageBytes) {
        throw new Error("API did not return image bytes.");
    }
    return `data:image/jpeg;base64,${base64ImageBytes}`;
  } catch (error) {
      console.error(`Failed to generate image for prompt "${prompt}":`, error);
      throw new Error(`Image generation failed. The AI may have refused the prompt.`);
  }
};