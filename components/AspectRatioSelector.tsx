import React from 'react';

interface AspectRatioSelectorProps {
  selectedRatio: '16:9' | '9:16';
  onSelectRatio: (ratio: '16:9' | '9:16') => void;
  disabled: boolean;
}

export const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({ selectedRatio, onSelectRatio, disabled }) => {
  return (
    <div className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-400">Aspect Ratio</h2>
        <div className="grid grid-cols-2 gap-2">
            <button
                onClick={() => onSelectRatio('16:9')}
                disabled={disabled}
                className={`flex items-center justify-center text-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:ring-indigo-500
                  ${selectedRatio === '16:9'
                    ? 'bg-indigo-600/80 text-white'
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                  }
                  disabled:cursor-not-allowed disabled:opacity-50
                `}
              >
                Landscape (16:9)
            </button>
            <button
                onClick={() => onSelectRatio('9:16')}
                disabled={disabled}
                className={`flex items-center justify-center text-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:ring-indigo-500
                  ${selectedRatio === '9:16'
                    ? 'bg-indigo-600/80 text-white'
                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                  }
                  disabled:cursor-not-allowed disabled:opacity-50
                `}
              >
                Portrait (9:16)
            </button>
        </div>
    </div>
  );
};
