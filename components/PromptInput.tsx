import React from 'react';
import { WandIcon } from './icons';
import { LoadingSpinner } from './LoadingSpinner';

interface PromptInputProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  disabled: boolean;
  placeholder?: string;
  onEnhancePrompt: () => void;
  isEnhancing: boolean;
}

export const PromptInput: React.FC<PromptInputProps> = ({ prompt, setPrompt, disabled, placeholder, onEnhancePrompt, isEnhancing }) => {
  return (
    <div className="space-y-2">
      <label htmlFor="prompt" className="text-sm font-semibold text-gray-400">
        Describe the image you want to create or the edits you want to make
      </label>
      <div className="relative">
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={disabled || isEnhancing}
          placeholder={placeholder || "e.g., A majestic lion wearing a crown, cinematic lighting, hyperrealistic..."}
          rows={5}
          className="w-full p-3 pr-28 bg-gray-800/70 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          onClick={onEnhancePrompt}
          disabled={disabled || isEnhancing || !prompt.trim()}
          className="absolute bottom-2.5 right-2.5 flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-md transition-all
                     bg-gray-700 text-gray-200
                     hover:bg-gray-600
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:ring-indigo-500
                     disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed"
          title="Enhance prompt with AI"
        >
          {isEnhancing ? (
            <LoadingSpinner className="w-4 h-4" />
          ) : (
            <WandIcon className="w-4 h-4" />
          )}
          <span>Enhance</span>
        </button>
      </div>
    </div>
  );
};
