import React from 'react';

interface VideoGenerationProgressProps {
  stage: 'idle' | 'script' | 'images' | 'videos' | 'combining' | 'complete' | 'error';
  progress: {
    scriptsGenerated: boolean;
    imagesGenerated: number;
    imagesTotal: number;
    videosGenerated: number;
    videosTotal: number;
    finalVideoReady: boolean;
  };
  error?: string;
}

const VideoGenerationProgress: React.FC<VideoGenerationProgressProps> = ({ stage, progress, error }) => {
  const getStageIcon = (currentStage: string, targetStage: string, completed: boolean) => {
    if (currentStage === targetStage) return '⏳';
    if (completed) return '✅';
    return '⏸️';
  };

  const getProgressPercentage = () => {
    if (stage === 'idle') return 0;
    if (stage === 'script') return 10;
    if (stage === 'images') return 10 + (progress.imagesGenerated / progress.imagesTotal) * 30;
    if (stage === 'videos') return 40 + (progress.videosGenerated / progress.videosTotal) * 40;
    if (stage === 'combining') return 80;
    if (stage === 'complete') return 100;
    return 0;
  };

  return (
    <div className="glass-card p-6 space-y-4">
      <h3 className="text-white font-bold text-lg mb-4">🎬 Video Generation Progress</h3>
      
      {/* Progress Bar */}
      <div className="w-full bg-white/20 h-3 rounded-full overflow-hidden">
        <div 
          className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-500"
          style={{ width: `${getProgressPercentage()}%` }}
        />
      </div>
      
      {/* Stage Details */}
      <div className="space-y-3">
        {/* Script Generation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{getStageIcon(stage, 'script', progress.scriptsGenerated)}</span>
            <span className="text-white/80">Script Generation</span>
          </div>
          <span className="text-sm text-white/60">
            {progress.scriptsGenerated ? 'Complete' : 'Pending'}
          </span>
        </div>

        {/* Image Generation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">
              {getStageIcon(stage, 'images', progress.imagesGenerated === progress.imagesTotal && progress.imagesTotal > 0)}
            </span>
            <span className="text-white/80">Image Generation</span>
          </div>
          <span className="text-sm text-white/60">
            {progress.imagesGenerated}/{progress.imagesTotal} scenes
          </span>
        </div>

        {/* Video Generation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">
              {getStageIcon(stage, 'videos', progress.videosGenerated === progress.videosTotal && progress.videosTotal > 0)}
            </span>
            <span className="text-white/80">Video Creation</span>
          </div>
          <span className="text-sm text-white/60">
            {progress.videosGenerated}/{progress.videosTotal} clips
          </span>
        </div>

        {/* Final Video */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">
              {getStageIcon(stage, 'combining', progress.finalVideoReady)}
            </span>
            <span className="text-white/80">Final Video Assembly</span>
          </div>
          <span className="text-sm text-white/60">
            {progress.finalVideoReady ? 'Ready' : 'Pending'}
          </span>
        </div>
      </div>

      {/* Status Message */}
      <div className="mt-4 p-3 bg-white/10 rounded-lg">
        <p className="text-sm text-white/90">
          {stage === 'idle' && '🔄 Ready to generate your video'}
          {stage === 'script' && '📝 Creating your viral script...'}
          {stage === 'images' && `🎨 Generating scene images (${progress.imagesGenerated}/${progress.imagesTotal})...`}
          {stage === 'videos' && `🎥 Creating video clips (${progress.videosGenerated}/${progress.videosTotal})...`}
          {stage === 'combining' && '🎬 Assembling final video...'}
          {stage === 'complete' && '✅ Your video is ready!'}
          {stage === 'error' && `❌ Error: ${error}`}
        </p>
      </div>

      {/* Veo 2 Availability Notice */}
      {stage === 'videos' && (
        <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-xs text-yellow-300">
            <span className="font-semibold">Note:</span> Veo 2 video generation requires special API access. 
            If unavailable, static images will be shown instead.
          </p>
        </div>
      )}

      {/* Detailed Progress for Current Stage */}
      {stage === 'images' && progress.imagesTotal > 0 && (
        <div className="grid grid-cols-4 gap-2 mt-4">
          {Array.from({ length: progress.imagesTotal }).map((_, index) => (
            <div 
              key={index}
              className={`h-20 rounded-lg flex items-center justify-center ${
                index < progress.imagesGenerated 
                  ? 'bg-green-500/20 border border-green-500/30' 
                  : 'bg-white/10 border border-white/20'
              }`}
            >
              <span className="text-xs text-white/70">Scene {index + 1}</span>
            </div>
          ))}
        </div>
      )}

      {stage === 'videos' && progress.videosTotal > 0 && (
        <div className="grid grid-cols-4 gap-2 mt-4">
          {Array.from({ length: progress.videosTotal }).map((_, index) => (
            <div 
              key={index}
              className={`h-20 rounded-lg flex items-center justify-center ${
                index < progress.videosGenerated 
                  ? 'bg-purple-500/20 border border-purple-500/30' 
                  : 'bg-white/10 border border-white/20'
              }`}
            >
              <span className="text-xs text-white/70">Clip {index + 1}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoGenerationProgress;
