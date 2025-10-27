import React, { useRef, useState, useEffect, useCallback } from 'react';
import { BrushIcon, EraserIcon } from './icons';

interface SketchPadProps {
  onSketchChange: (file: File | null) => void;
  disabled: boolean;
}

export const SketchPad: React.FC<SketchPadProps> = ({ onSketchChange, disabled }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(10);
  const [brushColor, setBrushColor] = useState('#000000');
  const [mode, setMode] = useState<'draw' | 'erase'>('draw');
  const [hasDrawing, setHasDrawing] = useState(false);

  const getCanvasContext = () => canvasRef.current?.getContext('2d');

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = getCanvasContext();
    if (canvas && ctx) {
      // Set a fixed internal resolution for consistency.
      canvas.width = 512;
      canvas.height = 512;
      // Fill with a white background initially.
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const getCoordinates = (event: React.MouseEvent | React.TouchEvent): { x: number, y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in event) {
        if (event.touches.length === 0) return null;
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    } else {
        clientX = event.clientX;
        clientY = event.clientY;
    }
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    if (disabled) return;
    const coords = getCoordinates(event);
    if (!coords) return;
    
    const ctx = getCanvasContext();
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawing(true);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  }, [disabled]);

  const draw = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    if (!isDrawing || disabled) return;
    
    const coords = getCoordinates(event);
    if (!coords) return;
    
    const ctx = getCanvasContext();
    if (!ctx) return;
    
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = mode === 'erase' ? '#FFFFFF' : brushColor;
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  }, [isDrawing, brushSize, disabled, mode, brushColor]);
  
  const stopDrawing = useCallback(() => {
    const ctx = getCanvasContext();
    if (!ctx) return;
    ctx.closePath();
    setIsDrawing(false);
  }, []);

  // Generate and export the sketch when drawing stops
  useEffect(() => {
    if (!isDrawing && hasDrawing) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.toBlob((blob) => {
        if (blob) {
          const sketchFile = new File([blob], 'sketch.png', { type: 'image/png' });
          onSketchChange(sketchFile);
        } else {
          onSketchChange(null);
        }
      }, 'image/png');
    }
  }, [isDrawing, hasDrawing, onSketchChange]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = getCanvasContext();
    if(canvas && ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setHasDrawing(false);
        onSketchChange(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-semibold text-gray-400">Draw a simple sketch</h2>
        <div className="flex items-center gap-2">
            <div className="flex items-center rounded-md bg-gray-700/60 p-0.5">
                <button
                    onClick={() => setMode('draw')}
                    disabled={disabled}
                    className={`px-2 py-1 text-xs font-semibold rounded-md transition-all duration-200 flex items-center gap-1.5 ${mode === 'draw' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-gray-300 hover:bg-gray-700'}`}
                    aria-label="Brush tool"
                    title="Brush tool"
                >
                    <BrushIcon className="w-4 h-4" />
                </button>
                <button
                    onClick={() => setMode('erase')}
                    disabled={disabled}
                    className={`px-2 py-1 text-xs font-semibold rounded-md transition-all duration-200 flex items-center gap-1.5 ${mode === 'erase' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-gray-300 hover:bg-gray-700'}`}
                    aria-label="Eraser tool"
                    title="Eraser tool"
                >
                    <EraserIcon className="w-4 h-4" />
                </button>
            </div>
            
            <div className={`relative transition-all duration-300 ease-in-out ${mode === 'draw' ? 'opacity-100 scale-100 w-8' : 'opacity-0 scale-0 w-0'}`}>
                 <label 
                    htmlFor="sketch-brush-color"
                    className="flex items-center justify-center w-full h-8 rounded-md cursor-pointer ring-2 ring-offset-2 ring-offset-gray-900 ring-transparent hover:ring-gray-500 focus-within:ring-indigo-500 transition-all"
                    style={{ backgroundColor: brushColor }}
                    title={`Change brush color (Current: ${brushColor})`}
                 >
                    <input
                        id="sketch-brush-color"
                        type="color"
                        value={brushColor}
                        onChange={(e) => setBrushColor(e.target.value)}
                        disabled={disabled}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                </label>
            </div>

            <button
              onClick={clearCanvas}
              disabled={disabled || !hasDrawing}
              className="px-3 py-1 text-xs font-semibold rounded-md transition-all bg-gray-700 text-gray-200 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
                Clear
            </button>
        </div>
      </div>

      <div className="relative w-full aspect-square border border-gray-700 rounded-lg overflow-hidden bg-white" style={{ touchAction: 'none' }}>
        <canvas
            ref={canvasRef}
            className="w-full h-full cursor-crosshair"
            style={{ touchAction: 'none' }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
        />
      </div>

       <div className="space-y-2">
            <label htmlFor="sketch-brush-size" className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <BrushIcon className="w-4 h-4" />
                <span>Brush Size: {brushSize}px</span>
            </label>
            <input
                id="sketch-brush-size"
                type="range"
                min="2"
                max="50"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                disabled={disabled}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
            />
        </div>
    </div>
  );
};
