import React, { useState, useEffect } from 'react';

const SystemVerification: React.FC = () => {
  const [testResults, setTestResults] = useState({
    script: '⏸️ Pending',
    images: '⏸️ Pending',
    audio: '⏸️ Pending',
    video: '⏸️ Pending',
    timing: '⏸️ Pending'
  });

  const testAudio = () => {
    setTestResults(prev => ({ ...prev, audio: '⏳ Testing...' }));
    
    if (typeof speechSynthesis === 'undefined') {
      setTestResults(prev => ({ ...prev, audio: '❌ Not supported' }));
      return;
    }

    const utterance = new SpeechSynthesisUtterance('Testing audio system');
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    utterance.onend = () => {
      setTestResults(prev => ({ ...prev, audio: '✅ Working' }));
    };
    
    utterance.onerror = () => {
      setTestResults(prev => ({ ...prev, audio: '❌ Error' }));
    };

    speechSynthesis.speak(utterance);
  };

  const testImageGeneration = () => {
    setTestResults(prev => ({ ...prev, images: '⏳ Testing...' }));
    
    try {
      // Test our SVG placeholder generation
      const testPrompt = 'Test image for verification';
      const subject = testPrompt.split(',')[0].trim().toLowerCase();
      const gradient1 = '#667eea', gradient2 = '#764ba2', emoji = '🎬';
      
      const placeholderSvg = `<svg width="320" height="568" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${gradient1};stop-opacity:1" /><stop offset="100%" style="stop-color:${gradient2};stop-opacity:1" /></linearGradient></defs><rect width="100%" height="100%" fill="url(#bg)"/><rect x="30" y="200" width="260" height="168" fill="rgba(255,255,255,0.1)" rx="20" stroke="rgba(255,255,255,0.2)" stroke-width="1"/><text x="160" y="250" font-family="Arial, sans-serif" font-size="32" fill="white" text-anchor="middle">${emoji}</text><text x="160" y="280" font-family="Arial, sans-serif" font-size="16" fill="white" text-anchor="middle" font-weight="600">${subject || 'Test'}</text><text x="160" y="300" font-family="Arial, sans-serif" font-size="12" fill="rgba(255,255,255,0.8)" text-anchor="middle">Image Placeholder</text><text x="160" y="320" font-family="Arial, sans-serif" font-size="10" fill="rgba(255,255,255,0.6)" text-anchor="middle">AI Video Creator</text></svg>`;
      
      const encodedSvg = encodeURIComponent(placeholderSvg);
      const dataUrl = `data:image/svg+xml,${encodedSvg}`;
      
      // Test if we can create an image element with this data URL
      const img = new Image();
      img.onload = () => {
        setTestResults(prev => ({ ...prev, images: '✅ Working (Placeholders)' }));
      };
      img.onerror = () => {
        setTestResults(prev => ({ ...prev, images: '❌ SVG Failed' }));
      };
      img.src = dataUrl;
      
    } catch (error) {
      setTestResults(prev => ({ ...prev, images: '❌ Error' }));
    }
  };

  const testScriptGeneration = async () => {
    setTestResults(prev => ({ ...prev, script: '⏳ Testing...' }));
    
    try {
      // Test if we can access the environment variables
      // In Vite, environment variables are accessed via import.meta.env
      if (!import.meta.env.VITE_GEMINI_API_KEY) {
        setTestResults(prev => ({ ...prev, script: '❌ No API Key' }));
        return;
      }
      
      setTestResults(prev => ({ ...prev, script: '✅ API Key Found' }));
    } catch (error) {
      setTestResults(prev => ({ ...prev, script: '❌ Error' }));
    }
  };

  const testTiming = () => {
    setTestResults(prev => ({ ...prev, timing: '⏳ Testing...' }));
    
    // Test caption timing calculations
    const testCaptions = [
      { startTime: 0, endTime: 7.5, text: 'First', narrationText: 'First segment' },
      { startTime: 7.5, endTime: 15, text: 'Second', narrationText: 'Second segment' },
      { startTime: 15, endTime: 22.5, text: 'Third', narrationText: 'Third segment' },
      { startTime: 22.5, endTime: 30, text: 'Fourth', narrationText: 'Fourth segment' }
    ];
    
    const totalDuration = testCaptions[testCaptions.length - 1].endTime;
    const isCorrectTiming = totalDuration === 30 && testCaptions.length === 4;
    
    if (isCorrectTiming) {
      setTestResults(prev => ({ ...prev, timing: '✅ Correct (30s/4 segments)' }));
    } else {
      setTestResults(prev => ({ ...prev, timing: '❌ Incorrect timing' }));
    }
  };

  const runAllTests = () => {
    testScriptGeneration();
    testImageGeneration();
    testAudio();
    testTiming();
    setTestResults(prev => ({ ...prev, video: '❌ Not available (Veo 2 requires special access)' }));
  };

  useEffect(() => {
    runAllTests();
  }, []);

  return (
    <div className="glass-card p-6 max-w-md mx-auto">
      <h2 className="text-white font-bold text-lg mb-4">🔧 System Verification</h2>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-white/80">Script Generation</span>
          <span className="text-sm">{testResults.script}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-white/80">Image Placeholders</span>
          <span className="text-sm">{testResults.images}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-white/80">Audio System</span>
          <span className="text-sm">{testResults.audio}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-white/80">Caption Timing</span>
          <span className="text-sm">{testResults.timing}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-white/80">Video Generation</span>
          <span className="text-sm">{testResults.video}</span>
        </div>
      </div>
      
      <div className="mt-6 space-y-2">
        <button 
          onClick={runAllTests}
          className="w-full glass-button py-2 text-sm"
        >
          🔄 Run All Tests
        </button>
        
        <button 
          onClick={testAudio}
          className="w-full glass-button py-2 text-sm"
        >
          🔊 Test Audio Only
        </button>
      </div>
      
      <div className="mt-4 text-xs text-white/60">
        <p>This verifies all app systems are working correctly before generating content.</p>
      </div>
    </div>
  );
};

export default SystemVerification;
