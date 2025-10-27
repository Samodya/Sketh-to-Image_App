import React, { useRef } from 'react';
import { UploadIcon, XIcon } from './icons';
import { ProcessedItem } from '../types';

interface ImageUploaderProps {
  onImageUpload: (files: File[]) => void;
  onRemoveImage: (item: ProcessedItem) => void;
  onClear: () => void;
  items: ProcessedItem[];
  disabled: boolean;
  multiple: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, onRemoveImage, onClear, items, disabled, multiple }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      onImageUpload(Array.from(files));
    }
    // Reset file input to allow re-uploading the same file
    if(fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
        // Fix: Explicitly type `file` as `File` to resolve TypeScript error.
        const imageFiles = Array.from(files).filter((file: File) => file.type.startsWith('image/'));
        onImageUpload(imageFiles);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-semibold text-gray-400">
          {multiple ? 'Upload Image(s)' : 'Upload Image'}
        </h2>
        {items.length > 0 && (
            <button
              onClick={onClear}
              disabled={disabled}
              className="px-3 py-1 text-xs font-semibold rounded-md transition-all bg-gray-700 text-gray-200 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed"
            >
                Clear All
            </button>
        )}
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {items.map(item => (
                <div key={item.id} className="relative group aspect-square">
                    <img src={item.originalUrl} alt={item.originalFile.name} className="w-full h-full object-cover rounded-md" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          onClick={() => onRemoveImage(item)}
                          disabled={disabled}
                          className="p-1.5 bg-red-600/80 text-white rounded-full hover:bg-red-500 disabled:bg-gray-700"
                          aria-label="Remove image"
                        >
                            <XIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
      ) : null}

      <label
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors
          ${disabled ? 'bg-gray-800/50 border-gray-700 cursor-not-allowed' : 'bg-gray-800/50 border-gray-600 hover:border-gray-500 hover:bg-gray-800'}`}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
            <UploadIcon className="w-8 h-8 mb-4 text-gray-500" />
            <p className="mb-2 text-sm text-gray-400">
                <span className="font-semibold">
                    {items.length > 0 ? 'Add more images' : 'Click to upload'}
                </span> or drag and drop
            </p>
             <p className="text-xs text-gray-500">PNG, JPG, WEBP</p>
        </div>
        <input 
            ref={fileInputRef} 
            id="dropzone-file" 
            type="file" 
            className="hidden" 
            onChange={handleFileChange} 
            accept="image/png, image/jpeg, image/webp" 
            disabled={disabled}
            multiple={multiple}
        />
      </label>
    </div>
  );
};