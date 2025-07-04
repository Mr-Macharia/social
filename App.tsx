import React, { useState, useCallback } from 'react';
import { ViralVideoScript, Scene } from './types';
import { generateViralVideoScript, generateImage } from './services/geminiService';
import TopicInputForm from './components/TopicInputForm';
import VideoPreview from './components/VideoPreview';
import GeneratedContent from './components/GeneratedContent';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { AlertTriangleIcon } from './components/icons/AlertTriangleIcon';
import { FilmIcon } from './components/icons/FilmIcon';

const App: React.FC = () => {
  const [topic, setTopic] = useState<string>('The surprising intelligence of octopuses');
  const [platform, setPlatform] = useState<string>('TikTok');
  const [duration, setDuration] = useState<string>('30s');
  const [style, setStyle] = useState<string>('Educational');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generationStatus, setGenerationStatus] = useState<'script' | 'images' | 'videos' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [videoScript, setVideoScript] = useState<ViralVideoScript | null>(null);
  const [sceneImages, setSceneImages] = useState<(string | null)[]>([]);
  const [sceneVideos, setSceneVideos] = useState<(string | null)[]>([]);

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) {
      setError('Please enter a topic.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setVideoScript(null);
    setSceneImages([]);
    
    try {
      setGenerationStatus('script');
      // In a future version, platform, duration, and style would be passed to the service
      const script = await generateViralVideoScript(topic);
      setVideoScript(script);

      setGenerationStatus('images');
      const imagePrompts = script.sceneBreakdown.map(s => s.imagePrompt);
      
      const results = await Promise.allSettled(imagePrompts.map(prompt => generateImage(prompt)));
      
      const generatedImages = results.map(result => 
        result.status === 'fulfilled' ? result.value : null
      );
      setSceneImages(generatedImages);

      // Generate videos from images if Veo 2 is available
      setGenerationStatus('videos');
      const videoPromises = script.sceneBreakdown.map(async (scene, index) => {
        const image = generatedImages[index];
        if (!image || image.includes('svg')) {
          // Skip placeholder SVG images
          return null;
        }
        try {
          // Use the generateVideoClip function from geminiService
          const { generateVideoClip } = await import('./services/geminiService');
          return await generateVideoClip(image, scene.videoPrompt, 7.5);
        } catch (error) {
          console.error(`Failed to generate video for scene ${index + 1}:`, error);
          return null;
        }
      });
      
      const videoResults = await Promise.allSettled(videoPromises);
      const generatedVideos = videoResults.map(result => 
        result.status === 'fulfilled' ? result.value : null
      );
      setSceneVideos(generatedVideos);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
      setGenerationStatus(null);
    }
  }, [topic, platform, duration, style]);

  const isGeneratingImages = generationStatus === 'images';

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <main className="container mx-auto px-4 py-8">
        <header className="text-center mb-10">
          <div className="inline-flex items-center justify-center gap-3">
             <SparklesIcon className="w-8 h-8 text-blue-400" />
             <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-400 to-teal-300 text-transparent bg-clip-text">
              AI Short Video Generator
            </h1>
          </div>
          <p className="mt-3 text-lg text-gray-400 max-w-2xl mx-auto">
            Turn your ideas into engaging, share-worthy videos in seconds.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 xl:col-span-3">
            <TopicInputForm
              topic={topic}
              setTopic={setTopic}
              platform={platform}
              setPlatform={setPlatform}
              duration={duration}
              setDuration={setDuration}
              style={style}
              setStyle={setStyle}
              onGenerate={handleGenerate}
              isLoading={isLoading}
            />
          </div>

          <div className="lg:col-span-8 xl:col-span-9">
            <div className="bg-gray-800/50 rounded-2xl p-4 min-h-[700px]">
              {isLoading && (
                <div className="flex flex-col items-center justify-center h-full min-h-[600px] rounded-2xl">
                  <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-600 h-12 w-12 mb-4 animate-spin border-t-blue-400"></div>
                  <p className="text-gray-300 text-lg">
                    {generationStatus === 'script' ? 'Generating viral script...' : 
                     generationStatus === 'images' ? 'Crafting visuals for each scene...' :
                     generationStatus === 'videos' ? 'Creating video clips (if available)...' :
                     'Processing...'}
                  </p>
                  <p className="text-gray-400 text-sm">This can take a moment, the AI is thinking.</p>
                </div>
              )}
              
              {error && !isLoading && (
                 <div className="flex flex-col items-center justify-center h-full min-h-[600px] bg-red-900/20 border border-red-500/50 rounded-2xl p-6">
                  <AlertTriangleIcon className="w-12 h-12 text-red-400 mb-4"/>
                  <h3 className="text-xl font-semibold text-red-300">Generation Failed</h3>
                  <p className="text-red-400 mt-2 text-center">{error}</p>
                </div>
              )}

              {!isLoading && !videoScript && !error && (
                <div className="flex flex-col items-center justify-center h-full min-h-[600px] rounded-2xl p-6 text-center">
                  <FilmIcon className="w-20 h-20 text-gray-600 mb-6"/>
                  <h3 className="text-2xl font-bold text-gray-300">Your Generated Video Will Appear Here</h3>
                  <p className="text-gray-400 mt-2">Fill out the controls and click "Generate" to start.</p>
                </div>
              )}

              {videoScript && (
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 animate-fade-in">
                  <div className="xl:col-span-2">
                      <VideoPreview 
                        videoScript={videoScript} 
                        sceneImages={sceneImages} 
                        sceneVideos={sceneVideos}
                        isGeneratingImages={isGeneratingImages} 
                      />
                  </div>
                  <div className="xl:col-span-3">
                      <GeneratedContent videoScript={videoScript} sceneImages={sceneImages} isGeneratingImages={isGeneratingImages} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <footer className="text-center mt-12 text-gray-500 text-sm">
          <p>Powered by Gemini, Imagen, and React. Audio uses browser's Speech Synthesis.</p>
          <p>Video file download is a conceptual feature.</p>
        </footer>
      </main>
    </div>
  );
};

export default App;
