import React from 'react';
import { GenerateIcon } from './icons/GenerateIcon';

interface TopicInputFormProps {
  topic: string;
  setTopic: (topic: string) => void;
  platform: string;
  setPlatform: (platform: string) => void;
  duration: string;
  setDuration: (duration: string) => void;
  style: string;
  setStyle: (style: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

const ControlGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
    {children}
  </div>
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
  <select
    {...props}
    className="w-full bg-gray-700 border-gray-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 disabled:opacity-50"
  />
);

const SpeakerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
);


const TopicInputForm: React.FC<TopicInputFormProps> = ({ 
  topic, setTopic, 
  platform, setPlatform,
  duration, setDuration,
  style, setStyle,
  onGenerate, isLoading 
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate();
  };

  return (
    <div className="bg-gray-800 p-6 rounded-2xl shadow-lg h-full sticky top-8">
      <h2 className="text-2xl font-bold text-white mb-6">Generator Controls</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <ControlGroup label="Video Topic">
          <textarea
            id="topic"
            rows={5}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={isLoading}
            className="w-full bg-gray-700 border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 placeholder-gray-500 disabled:opacity-50"
            placeholder="e.g., How black holes bend time and space"
          />
        </ControlGroup>

        <ControlGroup label="Platform">
          <Select value={platform} onChange={e => setPlatform(e.target.value)} disabled={isLoading}>
            <option>TikTok</option>
            <option>YouTube Shorts</option>
            <option>Instagram Reels</option>
          </Select>
        </ControlGroup>
        
        <div className="grid grid-cols-2 gap-4">
            <ControlGroup label="Duration">
              <Select value={duration} onChange={e => setDuration(e.target.value)} disabled={isLoading}>
                <option>15s</option>
                <option>30s</option>
                <option>60s</option>
              </Select>
            </ControlGroup>

            <ControlGroup label="Style">
              <Select value={style} onChange={e => setStyle(e.target.value)} disabled={isLoading}>
                <option>Educational</option>
                <option>Entertaining</option>
                <option>Trending</option>
                <option>Viral</option>
              </Select>
            </ControlGroup>
        </div>

        <ControlGroup label="Voice">
          <div className="bg-gray-700 rounded-lg p-3 flex items-center gap-3">
             <SpeakerIcon className="w-5 h-5 text-gray-400 flex-shrink-0"/>
             <div className="flex-grow">
                <p className="text-white font-semibold">Gemini 2.5 Pro Preview TTS</p>
                <p className="text-sm text-gray-300">Voice: Charon</p>
             </div>
          </div>
        </ControlGroup>


        <button
          type="submit"
          disabled={isLoading || !topic.trim()}
          className="w-full inline-flex items-center justify-center px-6 py-4 border border-transparent text-lg font-semibold rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              <span>Generating...</span>
            </>
          ) : (
            <>
              <GenerateIcon className="w-6 h-6 mr-2" />
              <span>Generate Video</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default TopicInputForm;