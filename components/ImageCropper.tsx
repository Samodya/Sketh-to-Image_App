import React, { useRef, useState, useEffect, useCallback } from 'react';

interface ImageCropperProps {
  imageUrl: string;
  onConfirm: (file: File) => void;
  onCancel: () => void;
}

const MIN_SIZE = 50;

export const ImageCropper: React.FC<ImageCropperProps> = ({ imageUrl, onConfirm, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState({ x: 50, y: 50, width: 200, height: 200 });
  const [dragInfo, setDragInfo] = useState<{ type: string; startX: number; startY: number; startCrop: typeof crop } | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const hRatio = canvas.width / image.naturalWidth;
    const vRatio = canvas.height / image.naturalHeight;
    const ratio = Math.min(hRatio, vRatio) * 0.9;
    const scaledWidth = image.naturalWidth * ratio;
    const scaledHeight = image.naturalHeight * ratio;
    const offsetX = (canvas.width - scaledWidth) / 2;
    const offsetY = (canvas.height - scaledHeight) / 2;

    ctx.drawImage(image, offsetX, offsetY, scaledWidth, scaledHeight);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.clearRect(crop.x, crop.y, crop.width, crop.height);
    ctx.drawImage(image, offsetX, offsetY, scaledWidth, scaledHeight);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 2;
    ctx.strokeRect(crop.x, crop.y, crop.width, crop.height);

    const handleSize = 10;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(crop.x - handleSize / 2, crop.y - handleSize / 2, handleSize, handleSize);
    ctx.fillRect(crop.x + crop.width - handleSize / 2, crop.y - handleSize / 2, handleSize, handleSize);
    ctx.fillRect(crop.x - handleSize / 2, crop.y + crop.height - handleSize / 2, handleSize, handleSize);
    ctx.fillRect(crop.x + crop.width - handleSize / 2, crop.y + crop.height - handleSize / 2, handleSize, handleSize);
  }, [crop]);

  useEffect(() => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = imageUrl;
    image.onload = () => {
      imageRef.current = image;
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const hRatio = canvas.width / image.naturalWidth;
        const vRatio = canvas.height / image.naturalHeight;
        const ratio = Math.min(hRatio, vRatio) * 0.7;
        const initialWidth = image.naturalWidth * ratio;
        const initialHeight = image.naturalHeight * ratio;
        const initialX = (canvas.width - initialWidth) / 2;
        const initialY = (canvas.height - initialHeight) / 2;
        setCrop({ width: initialWidth, height: initialHeight, x: initialX, y: initialY });
      }
    };

    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        draw();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [imageUrl, draw]);

  useEffect(() => {
    draw();
  }, [crop, draw]);

  const getEventCoords = (e: MouseEvent | TouchEvent): { clientX: number, clientY: number } => {
    if ('touches' in e) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    return { clientX: e.clientX, clientY: e.clientY };
  };
  
  const getCanvasCoords = (clientX: number, clientY: number): { x: number, y: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      return { x: clientX - rect.left, y: clientY - rect.top };
  };
  
  const getDragInfoFromCoords = (canvasX: number, canvasY: number): { type: string, cursor: string } => {
    const handleSize = 12;
    if (canvasX > crop.x - handleSize && canvasX < crop.x + handleSize && canvasY > crop.y - handleSize && canvasY < crop.y + handleSize) return { type: 'tl', cursor: 'nwse-resize' };
    if (canvasX > crop.x + crop.width - handleSize && canvasX < crop.x + crop.width + handleSize && canvasY > crop.y - handleSize && canvasY < crop.y + handleSize) return { type: 'tr', cursor: 'nesw-resize' };
    if (canvasX > crop.x - handleSize && canvasX < crop.x + handleSize && canvasY > crop.y + crop.height - handleSize && canvasY < crop.y + crop.height + handleSize) return { type: 'bl', cursor: 'nesw-resize' };
    if (canvasX > crop.x + crop.width - handleSize && canvasX < crop.x + crop.width + handleSize && canvasY > crop.y + crop.height - handleSize && canvasY < crop.y + crop.height + handleSize) return { type: 'br', cursor: 'nwse-resize' };
    if (canvasX > crop.x && canvasX < crop.x + crop.width && canvasY > crop.y && canvasY < crop.y + crop.height) return { type: 'move', cursor: 'move' };
    return { type: '', cursor: 'default' };
  };

  const handleInteractionStart = (e: React.MouseEvent | React.TouchEvent) => {
    const { clientX, clientY } = getEventCoords(e.nativeEvent);
    const canvasCoords = getCanvasCoords(clientX, clientY);
    if (canvasCoords) {
      const { type } = getDragInfoFromCoords(canvasCoords.x, canvasCoords.y);
      if (type) {
        e.preventDefault();
        setDragInfo({ type, startX: clientX, startY: clientY, startCrop: { ...crop } });
      }
    }
  };
  
  useEffect(() => {
    const handleInteractionMove = (e: MouseEvent | TouchEvent) => {
        if (!dragInfo) return;
        
        const { clientX, clientY } = getEventCoords(e);
        const dx = clientX - dragInfo.startX;
        const dy = clientY - dragInfo.startY;
        let newCrop = { ...dragInfo.startCrop };
        
        switch (dragInfo.type) {
            case 'move':
                newCrop.x += dx;
                newCrop.y += dy;
                break;
            case 'tl':
                newCrop.x += dx;
                newCrop.y += dy;
                newCrop.width -= dx;
                newCrop.height -= dy;
                break;
            case 'tr':
                newCrop.y += dy;
                newCrop.width += dx;
                newCrop.height -= dy;
                break;
            case 'bl':
                newCrop.x += dx;
                newCrop.width -= dx;
                newCrop.height += dy;
                break;
            case 'br':
                newCrop.width += dx;
                newCrop.height += dy;
                break;
        }

        if (newCrop.width < MIN_SIZE) {
            newCrop.width = MIN_SIZE;
            if (dragInfo.type === 'tl' || dragInfo.type === 'bl') newCrop.x = dragInfo.startCrop.x + dragInfo.startCrop.width - MIN_SIZE;
        }
        if (newCrop.height < MIN_SIZE) {
            newCrop.height = MIN_SIZE;
            if (dragInfo.type === 'tl' || dragInfo.type === 'tr') newCrop.y = dragInfo.startCrop.y + dragInfo.startCrop.height - MIN_SIZE;
        }

        setCrop(newCrop);
    };

    const handleInteractionEnd = () => {
        setDragInfo(null);
    };

    if (dragInfo) {
        window.addEventListener('mousemove', handleInteractionMove);
        window.addEventListener('touchmove', handleInteractionMove, { passive: false });
        window.addEventListener('mouseup', handleInteractionEnd);
        window.addEventListener('touchend', handleInteractionEnd);
    }

    return () => {
        window.removeEventListener('mousemove', handleInteractionMove);
        window.removeEventListener('touchmove', handleInteractionMove);
        window.removeEventListener('mouseup', handleInteractionEnd);
        window.removeEventListener('touchend', handleInteractionEnd);
    };
  }, [dragInfo]);

  const handleHoverMove = (e: React.MouseEvent) => {
    if (dragInfo) return;
    const { cursor } = getDragInfoFromCoords(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    e.currentTarget.style.cursor = cursor;
  };

  const handleConfirmCrop = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const hRatio = canvas.width / image.naturalWidth;
    const vRatio = canvas.height / image.naturalHeight;
    const ratio = Math.min(hRatio, vRatio) * 0.9;
    const offsetX = (canvas.width - (image.naturalWidth * ratio)) / 2;
    const offsetY = (canvas.height - (image.naturalHeight * ratio)) / 2;

    const sourceX = (crop.x - offsetX) / ratio;
    const sourceY = (crop.y - offsetY) / ratio;
    const sourceWidth = crop.width / ratio;
    const sourceHeight = crop.height / ratio;

    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = sourceWidth;
    cropCanvas.height = sourceHeight;
    const ctx = cropCanvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight);

    cropCanvas.toBlob(blob => {
      if (blob) {
        onConfirm(new File([blob], 'cropped-image.png', { type: 'image/png' }));
      }
    }, 'image/png');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center">
      <canvas 
        ref={canvasRef} 
        onMouseDown={handleInteractionStart}
        onTouchStart={handleInteractionStart}
        onMouseMove={handleHoverMove}
      />
      <div className="absolute bottom-8 flex gap-4">
        <button onClick={onCancel} className="px-6 py-3 bg-gray-700 text-white font-semibold rounded-md hover:bg-gray-600 transition-colors">Cancel</button>
        <button onClick={handleConfirmCrop} className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-500 transition-colors">Confirm Crop</button>
      </div>
    </div>
  );
};
