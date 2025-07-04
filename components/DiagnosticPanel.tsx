import React, { useState } from 'react';
import { ViralVideoScript } from '../types';

interface DiagnosticPanelProps {
  videoScript: ViralVideoScript | null;
  sceneImages: (string | null)[];
  isGeneratingImages: boolean;
  isLoading: boolean;
  error: string | null;
}

const DiagnosticPanel: React.FC<DiagnosticPanelProps> = ({
  videoScript,
  sceneImages,
  isGeneratingImages,
  isLoading,
  error
}) => {
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const getStatusIcon = (status: 'success' | 'loading' | 'error' | 'pending') => {
    switch (status) {
      case 'success': return '✅';
      case 'loading': return '⏳';
      case 'error': return '❌';
      case 'pending': return '⏸️';
    }
  };

  const getScriptStatus = () => {
    if (error) return 'error';
    if (isLoading) return 'loading';
    if (videoScript) return 'success';
    return 'pending';
  };

  const getImageStatus = () => {
    if (error) return 'error';
    if (isGeneratingImages) return 'loading';
    if (sceneImages.length > 0 && sceneImages.some(img => img !== null)) return 'success';
    if (videoScript) return 'error'; // Should have images if script exists
    return 'pending';
  };

  const getAudioStatus = () => {
    if (typeof speechSynthesis === 'undefined') return 'error';
    if (videoScript?.narrationScript) return 'success';
    return 'pending';
  };

  const getVideoStatus = () => {
    // Video generation not available yet
    return 'pending';
  };

  if (!showDiagnostics) {
    return (
      <button
        onClick={() => setShowDiagnostics(true)}
        className="fixed top-4 right-4 glass-button px-3 py-2 text-xs z-50"
      >
        🔍 Diagnostics
      </button>
    );
  }

  return (
    <div className="fixed top-4 right-4 glass-card w-80 z-50 text-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-white font-semibold">🔍 System Diagnostics</h3>
        <button
          onClick={() => setShowDiagnostics(false)}
          className="text-white/60 hover:text-white"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3">
        {/* Script Generation */}
        <div className="flex items-center justify-between">
          <span className="text-white/80">Script Generation</span>
          <div className="flex items-center gap-2">
            {getStatusIcon(getScriptStatus())}
            <span className="text-xs text-white/60">
              {videoScript ? `${videoScript.narrationScript.split(' ').length} words` : 'Pending'}
            </span>
          </div>
        </div>

        {/* Image Generation */}
        <div className="flex items-center justify-between">
          <span className="text-white/80">Image Generation</span>
          <div className="flex items-center gap-2">
            {getStatusIcon(getImageStatus())}
            <span className="text-xs text-white/60">
              {sceneImages.filter(img => img !== null).length}/{sceneImages.length} images
            </span>
          </div>
        </div>

        {/* Audio System */}
        <div className="flex items-center justify-between">
          <span className="text-white/80">Audio System</span>
          <div className="flex items-center gap-2">
            {getStatusIcon(getAudioStatus())}
            <span className="text-xs text-white/60">
              {typeof speechSynthesis !== 'undefined' ? 'Available' : 'Not supported'}
            </span>
          </div>
        </div>

        {/* Video Generation */}
        <div className="flex items-center justify-between">
          <span className="text-white/80">Video Generation</span>
          <div className="flex items-center gap-2">
            {getStatusIcon(getVideoStatus())}
            <span className="text-xs text-white/60">Veo 2 (Future)</span>
          </div>
        </div>

        {/* Caption Timing */}
        {videoScript && (
          <div className="flex items-center justify-between">
            <span className="text-white/80">Caption Timing</span>
            <div className="flex items-center gap-2">
              ✅
              <span className="text-xs text-white/60">
                {videoScript.captions.length} segments
              </span>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded p-2 mt-3">
            <p className="text-red-300 text-xs">{error}</p>
          </div>
        )}

        {/* Image Details */}
        {sceneImages.length > 0 && (
          <div className="border-t border-white/10 pt-3 mt-3">
            <p className="text-white/80 text-xs mb-2">Image Details:</p>
            {sceneImages.map((img, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <span className="text-white/60">Scene {index + 1}</span>
                <span className={img ? 'text-green-400' : 'text-red-400'}>
                  {img ? `${img.substring(0, 20)}...` : 'Failed'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Test Buttons */}
        <div className="border-t border-white/10 pt-3 mt-3 space-y-2">
          <button
            onClick={() => {
              if (videoScript) {
                console.log('🎬 Script Details:', videoScript);
                console.log('📝 Narration:', videoScript.narrationScript);
                console.log('⏱️ Captions:', videoScript.captions);
                console.log('🎨 Scenes:', videoScript.sceneBreakdown);
              }
            }}
            className="w-full glass-button py-1 text-xs"
            disabled={!videoScript}
          >
            📝 Log Script Details
          </button>

          <button
            onClick={() => {
              sceneImages.forEach((img, index) => {
                if (img) {
                  console.log(`🖼️ Image ${index + 1}:`, img.substring(0, 100) + '...');
                } else {
                  console.log(`❌ Image ${index + 1}: Failed to generate`);
                }
              });
            }}
            className="w-full glass-button py-1 text-xs"
            disabled={sceneImages.length === 0}
          >
            🖼️ Log Image Data
          </button>

          <button
            onClick={() => {
              if (typeof speechSynthesis !== 'undefined') {
                const voices = speechSynthesis.getVoices();
                console.log('🔊 Available Voices:', voices.map(v => `${v.name} (${v.lang})`));
              }
            }}
            className="w-full glass-button py-1 text-xs"
          >
            🔊 Test Audio System
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticPanel;
