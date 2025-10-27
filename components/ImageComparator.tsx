import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronLeftRightIcon } from './icons';

interface ImageComparatorProps {
  originalImageUrl: string;
  processedImageUrl: string;
}

export const ImageComparator: React.FC<ImageComparatorProps> = ({ originalImageUrl, processedImageUrl }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    let percentage = (x / rect.width) * 100;
    if (percentage < 0) percentage = 0;
    if (percentage > 100) percentage = 100;
    setSliderPosition(percentage);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
  };

  // Effect to handle dragging logic on the window to allow movement outside component bounds
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) handleMove(e.clientX);
    };
    const onTouchMove = (e: TouchEvent) => {
        if (isDragging) handleMove(e.touches[0].clientX);
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMove, handleMouseUp]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full select-none overflow-hidden rounded-md cursor-ew-resize"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* Original Image (Bottom Layer) */}
      <div className="absolute inset-0 flex items-center justify-center">
        <img
            src={originalImageUrl}
            alt="Original"
            className="max-w-full max-h-full object-contain pointer-events-none"
            draggable={false}
        />
      </div>

      {/* Processed Image (Top Layer, Clipped) */}
      <div
        className="absolute inset-0 flex items-center justify-center overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img
          src={processedImageUrl}
          alt="Processed"
          className="max-w-full max-h-full object-contain pointer-events-none"
          draggable={false}
        />
      </div>
      
      {/* Slider Handle */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white/50 cursor-ew-resize pointer-events-none"
        style={{ left: `calc(${sliderPosition}% - 0.5px)` }}
        draggable={false}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 text-gray-900 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm">
          <ChevronLeftRightIcon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
