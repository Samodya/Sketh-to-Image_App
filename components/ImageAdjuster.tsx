import React from 'react';

interface ImageAdjusterProps {
  adjustments: {
    brightness: number;
    contrast: number;
    saturation: number;
  };
  onAdjustmentsChange: (adjustments: ImageAdjusterProps['adjustments']) => void;
  onReset: () => void;
  disabled: boolean;
}

type AdjustmentKey = keyof ImageAdjusterProps['adjustments'];

export const ImageAdjuster: React.FC<ImageAdjusterProps> = ({ adjustments, onAdjustmentsChange, onReset, disabled }) => {
  const handleSliderChange = (key: AdjustmentKey, value: string) => {
    onAdjustmentsChange({ ...adjustments, [key]: Number(value) });
  };
  
  const hasAdjustments = adjustments.brightness !== 100 || adjustments.contrast !== 100 || adjustments.saturation !== 100;

  return (
    <div className="space-y-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
        <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-400">Adjust Image</h2>
            <button
                onClick={onReset}
                disabled={disabled || !hasAdjustments}
                className="px-3 py-1 text-xs font-semibold rounded-md transition-all bg-gray-700 text-gray-200 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed"
             >
                Reset
            </button>
        </div>

        <div className="space-y-3">
            <AdjustmentSlider label="Brightness" value={adjustments.brightness} onChange={(e) => handleSliderChange('brightness', e.target.value)} disabled={disabled} />
            <AdjustmentSlider label="Contrast" value={adjustments.contrast} onChange={(e) => handleSliderChange('contrast', e.target.value)} disabled={disabled} />
            <AdjustmentSlider label="Saturation" value={adjustments.saturation} max="200" onChange={(e) => handleSliderChange('saturation', e.target.value)} disabled={disabled} />
        </div>
    </div>
  );
};

interface SliderProps {
    label: string;
    value: number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    min?: string;
    max?: string;
    disabled: boolean;
}

const AdjustmentSlider: React.FC<SliderProps> = ({ label, value, onChange, min = "0", max = "200", disabled }) => (
    <div>
        <label htmlFor={`${label}-slider`} className="text-xs font-medium text-gray-400 flex justify-between">
            <span>{label}</span>
            <span>{value}%</span>
        </label>
        <input
            id={`${label}-slider`}
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed [&::-webkit-slider-thumb]:bg-indigo-500 [&::-moz-range-thumb]:bg-indigo-500"
        />
    </div>
);