import React from 'react';
import type { ViralVideoScript } from '../types';
import { FilmIcon } from './icons/FilmIcon';
import { MicIcon } from './icons/MicIcon';
import { TitleIcon } from './icons/TitleIcon';
import { CameraIcon } from './icons/CameraIcon';

interface GeneratedContentProps {
  videoScript: ViralVideoScript;
  sceneImages: (string | null)[];
  isGeneratingImages: boolean;
}

const InfoCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="bg-gray-900/70 p-5 rounded-xl">
    <h3 className="flex items-center text-lg font-bold text-blue-300 mb-3">
      {icon}
      {title}
    </h3>
    <div className="space-y-2">
      {children}
    </div>
  </div>
);

const GeneratedContent: React.FC<GeneratedContentProps> = ({ videoScript, sceneImages, isGeneratingImages }) => {
  const { title, hook, narrationScript, sceneBreakdown } = videoScript;

  return (
    <div className="space-y-6 h-full overflow-y-auto max-h-[700px] pr-2">
      <InfoCard icon={<TitleIcon className="w-5 h-5 mr-2" />} title="Title & Hook">
        <p className="text-gray-200 font-semibold text-lg">"{title}"</p>
        <p className="text-gray-400 mt-2 italic"><strong>Hook:</strong> {hook}</p>
      </InfoCard>
      
      <InfoCard icon={<MicIcon className="w-5 h-5 mr-2" />} title="Narration Script">
        <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{narrationScript}</p>
      </InfoCard>

      <InfoCard icon={<FilmIcon className="w-5 h-5 mr-2" />} title="Scene Breakdown">
        <ul className="space-y-4">
          {sceneBreakdown.map((scene, index) => (
            <li key={scene.scene} className="flex gap-4 p-3 bg-gray-800/60 rounded-lg items-start">
              <div className="w-28 h-28 bg-gray-900 rounded-md flex-shrink-0 flex items-center justify-center overflow-hidden">
                {isGeneratingImages && !sceneImages[index] ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                ) : (
                  sceneImages[index] ? (
                    <img src={sceneImages[index]!} alt={`Preview for Scene ${scene.scene}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center text-gray-500 p-2">
                      <CameraIcon className="w-6 h-6 mx-auto mb-1" />
                      <span className="text-xs">Failed</span>
                    </div>
                  )
                )}
              </div>
              <div className="flex-grow">
                <p className="font-bold text-white">Scene {scene.scene}</p>
                <p className="text-gray-300 text-sm mt-1">{scene.description}</p>
                <div className="mt-2 text-xs text-blue-300/70 flex items-start">
                    <CameraIcon className="w-4 h-4 mr-1.5 mt-0.5 flex-shrink-0" />
                    <p className="italic">"{scene.imagePrompt}"</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </InfoCard>
    </div>
  );
};

export default GeneratedContent;
