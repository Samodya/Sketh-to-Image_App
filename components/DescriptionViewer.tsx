import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { ImageIcon, SearchIcon } from './icons';
import { ProcessedItem } from '../types';

interface DescriptionViewerProps {
  items: ProcessedItem[];
  isLoading: boolean;
}

const ResultRow: React.FC<{ item: ProcessedItem }> = ({ item }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-gray-800/50 p-3 rounded-lg">
        <div className="flex items-center justify-center bg-black/20 rounded-md aspect-square">
            <img src={item.originalUrl} alt="Original" className="max-w-full max-h-full object-contain" />
        </div>
        <div className="h-full relative text-gray-300 overflow-y-auto text-sm">
            {item.status === 'processing' && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <LoadingSpinner />
                </div>
            )}
            {item.status === 'success' && <p className="whitespace-pre-wrap">{item.description}</p>}
            {item.status === 'error' && <p className="text-red-400">Error: {item.error}</p>}
            {item.status === 'queued' && <p className="text-gray-500">Waiting to be processed...</p>}
        </div>
    </div>
);

export const DescriptionViewer: React.FC<DescriptionViewerProps> = ({ items, isLoading }) => {
    if (items.length === 0 && !isLoading) {
        return (
            <div className="flex-grow flex flex-col items-center justify-center text-center text-gray-500">
                <ImageIcon className="w-24 h-24 mb-4" />
                <h3 className="text-lg font-semibold text-gray-400">Describe Image(s)</h3>
                <p className="max-w-sm">
                    Upload one or more images to get detailed descriptions from the AI.
                </p>
            </div>
        );
    }

    return (
        <div className="flex-grow flex flex-col h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-3 py-2 text-sm font-medium text-gray-400 border-b border-gray-700/50">
                <div>Original Image</div>
                <div>AI Description</div>
            </div>
            <div className="flex-grow overflow-y-auto p-3 space-y-3">
                {items.map(item => <ResultRow key={item.id} item={item} />)}
            </div>
        </div>
    );
};