
import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { ImageIcon, DownloadIcon, XIcon } from './icons';
import { Task, ProcessedItem, EditMode } from '../types';
import { ImageComparator } from './ImageComparator';

interface ImageViewerProps {
  items: ProcessedItem[];
  isLoading: boolean;
  loadingMessage: string;
  task: Task;
  editMode?: EditMode;
  onDownload: (item: ProcessedItem) => void;
  adjustments: { brightness: number; contrast: number; saturation: number };
}

const ResultCard: React.FC<{
    item: ProcessedItem;
    task: Task;
    onDownload: (item: ProcessedItem) => void;
}> = ({ item, task, onDownload }) => {
    const { status, originalUrl, processedUrl, error, originalFile } = item;

    return (
        <div className="border border-gray-700/80 bg-gray-900/50 rounded-lg flex flex-col aspect-[4/5] overflow-hidden">
            <div className="p-2 text-xs text-center text-gray-400 truncate border-b border-gray-700/80" title={originalFile.name}>
                {originalFile.name}
            </div>
            <div className="flex-grow relative flex items-center justify-center p-1">
                {status === 'processing' && (
                    <>
                        <img src={originalUrl} alt="Processing" className="w-full h-full object-contain blur-sm" />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <LoadingSpinner />
                        </div>
                    </>
                )}
                {status === 'error' && (
                    <div className="text-center text-red-400 p-2 text-xs flex flex-col items-center justify-center">
                         <XIcon className="w-8 h-8 mb-2" />
                        <p className="font-semibold">Processing Failed</p>
                        <p className="mt-1 opacity-80">{error}</p>
                    </div>
                )}
                 {status === 'queued' && <img src={originalUrl} alt="Queued" className="w-full h-full object-contain" />}
                 {status === 'success' && (
                    <>
                        {processedUrl && originalUrl && ![Task.GENERATE, Task.SKETCH_TO_IMAGE].includes(task) && (
                            <ImageComparator originalImageUrl={originalUrl} processedImageUrl={processedUrl} />
                        )}
                        {processedUrl && ![Task.GENERATE, Task.SKETCH_TO_IMAGE].includes(task) === false && (
                             <img src={processedUrl} alt="Generated" className="w-full h-full object-contain" />
                        )}
                        <button
                          onClick={() => onDownload(item)}
                          className="absolute top-1.5 right-1.5 p-2 bg-gray-900/70 text-gray-200 rounded-full hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors z-10"
                          aria-label="Download"
                          title="Download"
                        >
                          <DownloadIcon className="w-4 h-4" />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export const ImageViewer: React.FC<ImageViewerProps> = ({ items, isLoading, loadingMessage, task, editMode, onDownload, adjustments }) => {
  const showPlaceholder = items.length === 0 && !isLoading;
  const item = items[0];

  const getPlaceholderMessage = () => {
    switch(task) {
      case Task.GENERATE:
        return 'Describe your vision in the prompt box and click "Generate Image" to bring it to life.';
      case Task.SKETCH_TO_IMAGE:
        return 'Draw a simple object in the sketchpad and see the AI bring it to life as a 3D rendered image.';
      case Task.EDIT:
        switch(editMode) {
            case 'prompt':
                return 'Upload an image, describe your edits in the prompt box, and let the AI work its magic.';
            case 'adjust':
                return 'Upload an image and use the controls to adjust brightness, contrast, and saturation.';
            case 'watermark':
                return 'Paint over the area you want to remove, then click the button in the footer. The result will appear here.';
            case 'enhance':
                 return 'Upload an image and choose an enhancement like Upscale or Repair.';
            default:
                return 'Upload an image and select an edit tool to begin.';
        }
      default:
        return 'Upload one or more images and select a task to begin enhancing.';
    }
  }

  if (showPlaceholder) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center text-center text-gray-500">
        <ImageIcon className="w-24 h-24 mb-4" />
        <h3 className="text-lg font-semibold text-gray-400">
          Your masterpiece awaits
        </h3>
        <p className="max-w-sm">
          {getPlaceholderMessage()}
        </p>
      </div>
    );
  }

  // FIX: Always use grid view for more than one item, otherwise use single view.
  // This prevents the jarring layout shift for a single item when its status changes.
  if (items.length > 1) {
      return (
        <div className="flex-grow flex flex-col h-full">
            <div className="flex-shrink-0 text-center py-2 text-sm font-medium text-gray-400">
                {isLoading ? loadingMessage : `Results (${items.filter(i => i.status === 'success' || i.status === 'error').length}/${items.length})`}
            </div>
            <div className="flex-grow bg-black/20 rounded-md p-2 relative overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {items.map(item => (
                        <ResultCard key={item.id} item={item} task={task} onDownload={onDownload} />
                    ))}
                </div>
            </div>
        </div>
      );
  }
  
  // Single image view (for items.length === 1)
  return (
    <div className="flex-grow flex flex-col h-full">
      <div className="flex-shrink-0 text-center py-2 text-sm font-medium text-gray-400">
        {isLoading && items[0]?.status !== 'error' ? loadingMessage || 'Processing...' : (item?.status === 'success' ? 'Result' : (item?.status === 'error' ? 'Error' : 'Preview'))}
      </div>
      <div className="flex-grow bg-black/20 rounded-md flex items-center justify-center p-2 relative overflow-hidden">
        {isLoading && item?.status !== 'error' && (
            <div className="absolute inset-0 bg-gray-900/60 flex flex-col items-center justify-center rounded-md text-center p-4 z-20">
              <LoadingSpinner className="w-12 h-12" />
              {loadingMessage && <p className="mt-4 text-lg text-gray-200 font-medium">{loadingMessage}</p>}
            </div>
        )}
        
        {/* FIX: Add a dedicated error state display for the single item view. */}
        {item && item.status === 'error' && (
            <div className="text-center text-red-400 p-4 flex flex-col items-center justify-center">
                <XIcon className="w-12 h-12 mb-3" />
                <p className="font-semibold text-lg">Processing Failed</p>
                <p className="mt-1 text-sm opacity-90">{item.error}</p>
            </div>
        )}

        {item && item.status === 'success' && item.processedUrl && (
          <>
            {item.originalUrl && ![Task.GENERATE, Task.SKETCH_TO_IMAGE].includes(task) ? (
               <ImageComparator 
                originalImageUrl={item.originalUrl} 
                processedImageUrl={item.processedUrl} 
              />
            ) : (
              <img src={item.processedUrl} alt="Result" className="max-w-full max-h-full object-contain" />
            )}
            <button
              onClick={() => onDownload(item)}
              className="absolute top-2 right-2 p-2 bg-gray-900/70 text-gray-200 rounded-full hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors z-10"
              aria-label="Download image"
              title="Download image"
            >
              <DownloadIcon className="w-5 h-5" />
            </button>
          </>
        )}
        
        {item && (item.status === 'queued' || item.status === 'processing') && item.originalUrl ? (
           <img 
              src={item.originalUrl} 
              alt="Preview" 
              className="max-w-full max-h-full object-contain" 
              style={{ filter: task === Task.EDIT && editMode === 'adjust' ? `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%)` : 'none'}}
            />
        ) : null}
      </div>
    </div>
  );
};