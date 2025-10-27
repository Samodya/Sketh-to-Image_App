import React, { useRef } from 'react';
import { UploadIcon, XIcon, ImageIcon } from './icons';

interface FaceSwapUploaderProps {
  sourceFile: File | null;
  faceFile: File | null;
  onSourceFileChange: (file: File | null) => void;
  onFaceFileChange: (file: File | null) => void;
  disabled: boolean;
}

const Uploader: React.FC<{
    file: File | null;
    onFileChange: (file: File | null) => void;
    title: string;
    disabled: boolean;
}> = ({ file, onFileChange, title, disabled }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            onFileChange(files[0]);
        }
        if(fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (disabled) return;
        const files = event.dataTransfer.files;
        if (files && files.length > 0) {
            const imageFiles = Array.from(files).filter((file: File) => file.type.startsWith('image/'));
            if(imageFiles.length > 0) onFileChange(imageFiles[0]);
        }
    };
    
    const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        event.stopPropagation();
    };

    const fileUrl = file ? URL.createObjectURL(file) : null;

    return (
        <div className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-400">{title}</h2>
            {file && fileUrl ? (
                <div className="relative group aspect-square">
                    <img src={fileUrl} alt="Preview" className="w-full h-full object-cover rounded-md" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          onClick={() => onFileChange(null)}
                          disabled={disabled}
                          className="p-1.5 bg-red-600/80 text-white rounded-full hover:bg-red-500 disabled:bg-gray-700"
                          aria-label="Remove image"
                        >
                            <XIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ) : (
                <label
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className={`flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed rounded-lg cursor-pointer transition-colors
                    ${disabled ? 'bg-gray-800/50 border-gray-700 cursor-not-allowed' : 'bg-gray-800/50 border-gray-600 hover:border-gray-500 hover:bg-gray-800'}`}
                >
                    <div className="flex flex-col items-center justify-center text-center p-2">
                        <UploadIcon className="w-8 h-8 mb-2 text-gray-500" />
                        <p className="text-xs text-gray-400">
                            <span className="font-semibold">Click to upload</span> or drop
                        </p>
                    </div>
                    <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" disabled={disabled} />
                </label>
            )}
        </div>
    );
};

export const FaceSwapUploader: React.FC<FaceSwapUploaderProps> = ({ sourceFile, faceFile, onSourceFileChange, onFaceFileChange, disabled }) => {
  return (
    <div className="space-y-4">
        <div className="text-center p-2 rounded-md bg-gray-900/50 border border-gray-700/50">
            <h2 className="font-semibold text-gray-200">Face Swap</h2>
            <p className="text-xs text-gray-400 mt-1">Upload a source image and an image containing the face you want to use.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <Uploader file={sourceFile} onFileChange={onSourceFileChange} title="Source Image" disabled={disabled} />
            <Uploader file={faceFile} onFileChange={onFaceFileChange} title="Face Image" disabled={disabled} />
        </div>
    </div>
  );
};
