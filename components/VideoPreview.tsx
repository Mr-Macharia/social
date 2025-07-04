import React, { useState, useEffect, useRef } from 'react';
import { ViralVideoScript } from '../types';
import { DownloadIcon } from './icons/DownloadIcon';
import { PlayIcon } from './icons/PlayIcon';
import { PauseIcon } from './icons/PauseIcon';
import { CameraIcon } from './icons/CameraIcon';

interface VideoPreviewProps {
  videoScript: ViralVideoScript;
  sceneImages: (string | null)[];
  sceneVideos?: (string | null)[];
  isGeneratingImages: boolean;
}

const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => (
  <div className="w-full bg-white/20 h-1.5 rounded-full absolute bottom-0 left-0">
    <div
      className="bg-white h-full rounded-full"
      style={{ width: `${progress * 100}%`, transition: progress > 0.01 ? 'width 0.1s linear' : 'none' }}
    />
  </div>
);


const VideoPreview: React.FC<VideoPreviewProps> = ({ videoScript, sceneImages, sceneVideos = [], isGeneratingImages }) => {
  const { narrationScript, sceneBreakdown, captions } = videoScript;
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [showControls, setShowControls] = useState(true);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const totalDuration = captions.length > 0 ? captions[captions.length - 1].endTime : 30;
  const scenesReady = !isGeneratingImages && sceneImages.length > 0;

  useEffect(() => {
    const getAndSetVoice = () => {
      const voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        // Prefer a high-quality, network-based English MALE voice if available to match "Charon"
        const bestVoice = 
            voices.find(v => v.lang.startsWith('en') && /male/i.test(v.name) && v.name.includes('Google')) ||
            voices.find(v => v.lang.startsWith('en') && /male/i.test(v.name) && v.localService === false) ||
            voices.find(v => v.lang.startsWith('en') && /male/i.test(v.name)) ||
            voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) ||
            voices.find(v => v.lang.startsWith('en') && v.localService === false) ||
            voices.find(v => v.lang.startsWith('en'));
        setSelectedVoice(bestVoice);
      }
    };
    
    getAndSetVoice();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = getAndSetVoice;
    }

    const handleBeforeUnload = () => {
        speechSynthesis.cancel();
    }
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      speechSynthesis.onvoiceschanged = null;
      speechSynthesis.cancel();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, []);

  useEffect(() => {
    if (!narrationScript || !selectedVoice) {
      return;
    }

    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(narrationScript);
    
    u.voice = selectedVoice;
    u.pitch = 1.1;
    u.rate = 1.1;

    u.onboundary = (event) => {
      if(event.name === 'word') {
         setCurrentTime(event.elapsedTime / 1000);
      }
    };
    
    u.onend = () => {
      setIsPlaying(false);
      setCurrentTime(totalDuration);
      setShowControls(true);
    };

    u.onerror = (event) => {
        console.error("SpeechSynthesis Error", event);
        // Handle interrupted errors gracefully
        if (event.error === 'interrupted') {
            console.log('Speech synthesis was interrupted, this is normal behavior');
        }
        setIsPlaying(false);
        setShowControls(true);
    }
    
    utteranceRef.current = u;
    setCurrentTime(0);
    setIsPlaying(false);

    return () => {
      speechSynthesis.cancel();
    };
  }, [videoScript, narrationScript, totalDuration, selectedVoice]);

  const handlePlayPause = () => {
    if (!utteranceRef.current) return;

    try {
        if (speechSynthesis.speaking) {
            if (speechSynthesis.paused) {
                // Is paused, so resume.
                speechSynthesis.resume();
                setIsPlaying(true);
                setShowControls(false);
            } else {
                // Is actively speaking, so pause.
                speechSynthesis.pause();
                setIsPlaying(false);
            }
        } else {
            // Is not speaking. Could be not started or has ended.
            // If it ended, reset time.
            if (currentTime >= totalDuration) {
                setCurrentTime(0);
            }
            // Cancel any previous speech to avoid conflicts
            speechSynthesis.cancel();
            // Small delay to ensure clean start
            setTimeout(() => {
                speechSynthesis.speak(utteranceRef.current!);
                setIsPlaying(true);
                setShowControls(false);
            }, 50);
        }
    } catch (error) {
        console.error('Error in handlePlayPause:', error);
        setIsPlaying(false);
        setShowControls(true);
    }
  };


  // Get all words from the full narration script
  const allWords = narrationScript.split(' ');
  const wordsPerSecond = allWords.length / totalDuration; // Approximately 5 words per second for natural speech
  const currentWordIndex = Math.floor(currentTime * wordsPerSecond);
  
  // Display only 7 words at a time, centered around the current word
  const wordsToShow = 7;
  const halfWindow = Math.floor(wordsToShow / 2);
  
  let startIndex = Math.max(0, currentWordIndex - halfWindow);
  let endIndex = Math.min(allWords.length, startIndex + wordsToShow);
  
  // Adjust if we're near the end
  if (endIndex === allWords.length) {
    startIndex = Math.max(0, endIndex - wordsToShow);
  }
  
  const displayWords = allWords.slice(startIndex, endIndex);
  const highlightIndex = currentWordIndex - startIndex;
  
  // Determine current scene based on 8-second intervals (4 scenes, 32 seconds total)
  let currentSceneIndex = Math.floor(currentTime / 8);
  if (currentSceneIndex >= sceneBreakdown.length) {
    currentSceneIndex = sceneBreakdown.length - 1;
  }
  
  const currentSceneImage = scenesReady ? sceneImages[currentSceneIndex] : null;

  return (
    <div className="flex flex-col items-center">
      <div 
        className="relative w-[320px] h-[568px] bg-black rounded-3xl shadow-2xl overflow-hidden border-4 border-gray-700/50 group"
        onClick={handlePlayPause}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => {if (isPlaying) setShowControls(false)}}
      >
        {sceneBreakdown.map((scene, index) => {
            const imageSrc = sceneImages[index];
            const videoSrc = sceneVideos[index];
            const isVisible = index === currentSceneIndex;
            return (
                <div key={scene.scene} className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                    {videoSrc ? (
                        // Show video if available
                        <video
                            src={videoSrc}
                            className="w-full h-full object-cover"
                            loop
                            muted
                            autoPlay={isVisible && isPlaying}
                            playsInline
                        />
                    ) : imageSrc ? (
                        // Show image if no video but image is available
                        <img
                            src={imageSrc}
                            alt={scene.description}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center text-gray-500">
                           {isGeneratingImages ? (
                                <>
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
                                    <p>Generating Image...</p>
                                </>
                           ) : (
                                <>
                                    <CameraIcon className="w-12 h-12 mb-4"/>
                                    <p>Image Failed</p>
                                </>
                           )}
                        </div>
                    )}
                </div>
            );
        })}

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none"></div>
        
         <div 
          className={`absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'} cursor-pointer`}
        >
          <button
            onClick={(e) => { e.stopPropagation(); handlePlayPause(); }}
            className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <PauseIcon className="w-10 h-10" /> : <PlayIcon className="w-10 h-10 pl-1" />}
          </button>
        </div>

        <div className="absolute bottom-16 left-4 right-4 text-center pointer-events-none">
           {displayWords.length > 0 && (
                <p 
                    className="text-white text-xl font-bold drop-shadow-lg px-2"
                    style={{
                        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                        fontFamily: 'Montserrat, sans-serif',
                        lineHeight: '1.4',
                        letterSpacing: '0.01em',
                        maxWidth: '90%',
                        margin: '0 auto'
                    }}
                >
                    {displayWords.map((word, index) => (
                      <span 
                        key={`${startIndex + index}-${word}`} 
                        className={`inline-block transition-all duration-200 ${
                          index === highlightIndex 
                            ? 'text-yellow-300 transform scale-110' 
                            : index < highlightIndex 
                              ? 'text-white/70' 
                              : 'text-white'
                        }`}
                      >
                        {word}{' '}
                      </span>
                    ))}
                </p>
           )}
        </div>

        <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
            <ProgressBar progress={currentTime / totalDuration} />
        </div>
      </div>

       <button
          disabled
          className="mt-6 w-full max-w-xs inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed group relative"
        >
          <DownloadIcon className="w-5 h-5 mr-2" />
          <span>Download Video (.mp4)</span>
           <div className="absolute -top-12 w-48 p-2 text-xs text-center text-white bg-gray-800 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                Video file generation is a conceptual feature.
            </div>
        </button>
    </div>
  );
};

export default VideoPreview;