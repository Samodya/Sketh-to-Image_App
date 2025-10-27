import React, { useRef, useState, useEffect, useCallback } from 'react';
import { BrushIcon, EraserIcon } from './icons';

interface ImageMaskerProps {
  imageUrl: string;
  onMaskChange: (file: File | null) => void;
  disabled: boolean;
}

export const ImageMasker: React.FC<ImageMaskerProps> = ({ imageUrl, onMaskChange, disabled }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(30);
  const [hasDrawing, setHasDrawing] = useState(false);
  const [mode, setMode] = useState<'draw' | 'erase'>('draw');

  const getCanvasContext = () => canvasRef.current?.getContext('2d');

  // Load image and set canvas dimensions
  useEffect(() => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = imageUrl;
    image.onload = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        // Set the canvas's drawing buffer resolution to the image's natural size
        // for a high-quality mask. The display size is handled by CSS.
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
      }
    };
  }, [imageUrl]);

  const getCoordinates = (event: React.MouseEvent | React.TouchEvent): { x: number, y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in event) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    } else {
        clientX = event.clientX;
        clientY = event.clientY;
    }
    
    // Scale the mouse coordinates from the canvas's display size to its internal resolution.
    // This is crucial for accuracy when the display size and resolution differ.
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
    ctx.globalCompositeOperation = mode === 'erase' ? 'destination-out' : 'source-over';
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  }, [disabled, mode]);

  const draw = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    if (!isDrawing || disabled) return;
    
    const coords = getCoordinates(event);
    if (!coords) return;
    
    const ctx = getCanvasContext();
    if (!ctx) return;
    
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round'; // Added for smoother corners
    // Changed color to semi-transparent red, a more common masking UI pattern.
    ctx.strokeStyle = mode === 'draw' ? 'rgba(239, 68, 68, 0.6)' : 'rgba(0,0,0,1)';
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  }, [isDrawing, brushSize, disabled, mode]);
  
  const stopDrawing = useCallback(() => {
    const ctx = getCanvasContext();
    if (!ctx) return;
    ctx.closePath();
    setIsDrawing(false);
  }, []);

  // Generate and export the mask when drawing stops
  useEffect(() => {
    if (!isDrawing && hasDrawing) {
      const mainCanvas = canvasRef.current;
      if (!mainCanvas) return;

      const width = mainCanvas.width;
      const height = mainCanvas.height;

      // Create a temporary canvas for processing
      const processingCanvas = document.createElement('canvas');
      processingCanvas.width = width;
      processingCanvas.height = height;
      const pCtx = processingCanvas.getContext('2d');
      if (!pCtx) return;

      // Dynamically calculate blur amount based on image size for consistent results
      const blurAmount = Math.max(4, Math.round(Math.min(width, height) / 250));

      // Apply a blur to smooth the edges of the brush strokes.
      // This helps in creating a cleaner, anti-aliased mask.
      pCtx.filter = `blur(${blurAmount}px)`;
      pCtx.drawImage(mainCanvas, 0, 0);
      pCtx.filter = 'none'; // Reset filter for subsequent operations

      // Get the pixel data from the now-blurred drawing
      const imageData = pCtx.getImageData(0, 0, width, height);
      const data = imageData.data;

      // Create the final mask canvas
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = width;
      maskCanvas.height = height;
      const maskCtx = maskCanvas.getContext('2d');
      if (!maskCtx) return;

      const maskImageData = maskCtx.createImageData(width, height);
      const maskData = maskImageData.data;

      // Apply a high-contrast threshold to the blurred data.
      // This converts the smooth gradient at the edges into a crisp, clean line.
      // We use a threshold of 50% opacity (128 out of 255).
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 128) { // Thresholding the alpha channel
          // White pixel: part of the mask
          maskData[i] = 255;
          maskData[i + 1] = 255;
          maskData[i + 2] = 255;
          maskData[i + 3] = 255;
        } else {
          // Black pixel: not part of the mask
          maskData[i] = 0;
          maskData[i + 1] = 0;
          maskData[i + 2] = 0;
          maskData[i + 3] = 255;
        }
      }
      maskCtx.putImageData(maskImageData, 0, 0);

      maskCanvas.toBlob((blob) => {
        if (blob) {
          const maskFile = new File([blob], 'mask.png', { type: 'image/png' });
          onMaskChange(maskFile);
        } else {
          onMaskChange(null);
        }
      }, 'image/png');
    }
  }, [isDrawing, hasDrawing, onMaskChange]);

  const clearMask = () => {
    const canvas = canvasRef.current;
    const ctx = getCanvasContext();
    if(canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasDrawing(false);
        onMaskChange(null);
    }
  };


  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-semibold text-gray-400">Paint over watermark</h2>
        <div className="flex items-center gap-2">
            <div className="flex items-center rounded-md bg-gray-700/60 p-0.5">
                <button
                    onClick={() => setMode('draw')}
                    disabled={disabled}
                    className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${mode === 'draw' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-300 hover:bg-gray-700'}`}
                    aria-label="Brush tool"
                    title="Brush tool"
                >
                    <BrushIcon className="w-4 h-4" />
                </button>
                <button
                    onClick={() => setMode('erase')}
                    disabled={disabled}
                    className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${mode === 'erase' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-300 hover:bg-gray-700'}`}
                    aria-label="Eraser tool"
                    title="Eraser tool"
                >
                    <EraserIcon className="w-4 h-4" />
                </button>
            </div>
            <button
              onClick={clearMask}
              disabled={disabled || !hasDrawing}
              className="px-3 py-1 text-xs font-semibold rounded-md transition-all bg-gray-700 text-gray-200 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
                Clear
            </button>
        </div>
      </div>

      <div className="relative w-full h-64 border border-gray-700 rounded-lg overflow-hidden bg-black/20" style={{ touchAction: 'none' }}>
        <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{
              touchAction: 'none',
              backgroundImage: `url(${imageUrl})`,
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
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
            <label htmlFor="brush-size" className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <BrushIcon className="w-4 h-4" />
                <span>Brush Size: {brushSize}px</span>
            </label>
            <input
                id="brush-size"
                type="range"
                min="5"
                max="100"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                disabled={disabled}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed"
            />
        </div>
    </div>
  );
};