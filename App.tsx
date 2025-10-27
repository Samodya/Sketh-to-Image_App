
import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { TaskSelector } from './components/TaskSelector';
import { ImageUploader } from './components/ImageUploader';
import { PromptInput } from './components/PromptInput';
import { ImageViewer } from './components/ImageViewer';
import { ImageMasker } from './components/ImageMasker';
import { ImageAdjuster } from './components/ImageAdjuster';
import { DescriptionViewer } from './components/DescriptionViewer';
import { LoadingSpinner } from './components/LoadingSpinner';
import { SketchPad } from './components/SketchPad';
import { SafetyWarningModal } from './components/SafetyWarningModal';
import { processImage, generateImage, describeImage, enhancePrompt, generateImageFromSketch } from './services/geminiService';
import { authService, User } from './services/authService';
import { Task, ProcessedItem, EditMode } from './types';
import { SparklesIcon, XIcon, PencilIcon, SlidersIcon, NoWatermarkIcon, WandIcon, SlidersHorizontalIcon } from './components/icons';

// Augment the window type for aistudio functions
declare global {
    interface AIStudio {
        hasSelectedApiKey: () => Promise<boolean>;
        openSelectKey: () => Promise<void>;
    }
    interface Window {
        aistudio?: AIStudio;
    }
}

const DEFAULT_ADJUSTMENTS = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
};

// --- EditTools Component ---
interface EditToolsProps {
  mode: EditMode;
  setMode: (mode: EditMode) => void;
  disabled: boolean;
}

const tools: { id: EditMode, icon: React.ReactElement, label: string }[] = [
  { id: 'prompt', icon: <PencilIcon className="w-5 h-5" />, label: "AI Prompt" },
  { id: 'enhance', icon: <SparklesIcon className="w-5 h-5" />, label: "Enhance" },
  { id: 'adjust', icon: <SlidersIcon className="w-5 h-5" />, label: "Adjust" },
  { id: 'watermark', icon: <NoWatermarkIcon className="w-5 h-5" />, label: "Watermark" },
];

const EditTools: React.FC<EditToolsProps> = ({ mode, setMode, disabled }) => {
  return (
    <div className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-400">Edit Tools</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {tools.map((tool) => (
                <button
                    key={tool.id}
                    onClick={() => setMode(tool.id)}
                    disabled={disabled}
                    className={`flex flex-col items-center justify-center text-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:ring-indigo-500
                      ${mode === tool.id
                        ? 'bg-indigo-600/80 text-white'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                      }
                      disabled:cursor-not-allowed disabled:opacity-50
                    `}
                  >
                    {tool.icon}
                    <span>{tool.label}</span>
                </button>
            ))}
        </div>
    </div>
  );
};

// --- Controls Content Component ---
// This component encapsulates all the controls to be displayed in the sidebar/bottom sheet.
const ControlsContent = (props: any) => {
    const { 
        selectedTask, prompt, setPrompt, isLoading, onEnhancePrompt, isEnhancing, editMode, setEditMode, 
        processedItems, handleImageUpload, handleRemoveImage, handleClear, isBatchAllowed, 
        adjustments, setAdjustments, onResetAdjustments, onMaskChange, 
        onSketchChange,
        handleSubmit, error, getSubmitButtonText, isSubmitDisabled, onMobileSubmit 
    } = props;

    const handleFormSubmit = (subTask?: Task) => {
        handleSubmit(subTask);
        if (onMobileSubmit) onMobileSubmit();
    };

    return (
        <>
            <div className="flex-grow p-4 space-y-6 overflow-y-auto">
                {selectedTask === Task.GENERATE && (
                    <PromptInput
                        prompt={prompt}
                        setPrompt={setPrompt}
                        disabled={isLoading}
                        onEnhancePrompt={onEnhancePrompt}
                        isEnhancing={isEnhancing}
                    />
                )}
                {selectedTask === Task.SKETCH_TO_IMAGE && (
                    <SketchPad
                        onSketchChange={onSketchChange}
                        disabled={isLoading}
                    />
                )}
                {selectedTask === Task.EDIT && (
                    <>
                        <EditTools mode={editMode} setMode={setEditMode} disabled={isLoading || processedItems.length === 0} />
                        <ImageUploader
                            onImageUpload={handleImageUpload}
                            onRemoveImage={handleRemoveImage}
                            onClear={handleClear}
                            items={processedItems}
                            disabled={isLoading}
                            multiple={isBatchAllowed && editMode !== 'watermark'}
                        />
                        {editMode === 'prompt' && processedItems.length > 0 &&
                            <PromptInput
                                prompt={prompt}
                                setPrompt={setPrompt}
                                disabled={isLoading}
                                placeholder="e.g., Make the sky a vibrant sunset..."
                                onEnhancePrompt={onEnhancePrompt}
                                isEnhancing={isEnhancing}
                            />
                        }
                        {editMode === 'adjust' && processedItems.length > 0 &&
                            <ImageAdjuster
                                adjustments={adjustments}
                                onAdjustmentsChange={setAdjustments}
                                onReset={onResetAdjustments}
                                disabled={isLoading}
                            />
                        }
                        {editMode === 'watermark' && processedItems.length > 0 &&
                            <ImageMasker
                                imageUrl={processedItems[0].originalUrl}
                                onMaskChange={onMaskChange}
                                disabled={isLoading}
                            />
                        }
                        {editMode === 'enhance' && processedItems.length > 0 &&
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => handleFormSubmit(Task.UPSCALE)} disabled={isLoading} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md text-white bg-gradient-to-r from-indigo-600 to-purple-500 hover:from-indigo-500 hover:to-purple-400 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md shadow-indigo-500/30 disabled:bg-gradient-to-r disabled:from-gray-600 disabled:to-gray-700 disabled:shadow-none disabled:scale-100 disabled:cursor-not-allowed">
                                    <SparklesIcon className="w-4 h-4" /> Upscale
                                </button>
                                <button onClick={() => handleFormSubmit(Task.REPAIR)} disabled={isLoading} className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md text-white bg-gradient-to-r from-indigo-600 to-purple-500 hover:from-indigo-500 hover:to-purple-400 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md shadow-indigo-500/30 disabled:bg-gradient-to-r disabled:from-gray-600 disabled:to-gray-700 disabled:shadow-none disabled:scale-100 disabled:cursor-not-allowed">
                                    <WandIcon className="w-4 h-4" /> Repair
                                </button>
                            </div>
                        }
                    </>
                )}
                {[Task.DESCRIBE].includes(selectedTask) &&
                    <ImageUploader
                        onImageUpload={handleImageUpload}
                        onRemoveImage={handleRemoveImage}
                        onClear={handleClear}
                        items={processedItems}
                        disabled={isLoading}
                        multiple={isBatchAllowed}
                    />
                }
            </div>
            <div className="flex-shrink-0 p-4 border-t border-gray-700/50 space-y-3">
                {error && <div className="text-sm text-red-400 bg-red-900/50 p-3 rounded-md text-center">{error}</div>}
                {editMode !== 'enhance' && (
                    <button
                        onClick={() => handleFormSubmit()}
                        disabled={isSubmitDisabled()}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 text-base font-semibold rounded-md text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 focus-visible:ring-indigo-500 transition-all duration-300 ease-in-out transform bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/60 hover:scale-[1.02] active:scale-[0.98] disabled:bg-gradient-to-r disabled:from-gray-600 disabled:to-gray-700 disabled:shadow-none disabled:scale-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <LoadingSpinner className="w-6 h-6" /> : getSubmitButtonText()}
                    </button>
                )}
            </div>
        </>
    );
};


export default function App() {
  const [selectedTask, setSelectedTask] = useState<Task>(Task.GENERATE);
  const [editMode, setEditMode] = useState<EditMode>('prompt');
  const [prompt, setPrompt] = useState<string>('');
  const [processedItems, setProcessedItems] = useState<ProcessedItem[]>([]);
  const [maskFile, setMaskFile] = useState<File | null>(null);
  const [sketchFile, setSketchFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [safetyWarning, setSafetyWarning] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isControlsOpen, setIsControlsOpen] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [adjustments, setAdjustments] = useState(DEFAULT_ADJUSTMENTS);

  const isBatchAllowed = ![Task.GENERATE, Task.SKETCH_TO_IMAGE].includes(selectedTask);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  useEffect(() => {
    setProcessedItems([]);
    setMaskFile(null);
    setSketchFile(null);
    setPrompt('');
    setError(null);
    setSafetyWarning(null);
    setLoadingMessage('');
    setAdjustments(DEFAULT_ADJUSTMENTS);
    setEditMode('prompt');
  }, [selectedTask]);
  
  // Effect to revoke object URLs when component unmounts or items change
  useEffect(() => {
    return () => {
      processedItems.forEach(item => {
        if (item.originalUrl) URL.revokeObjectURL(item.originalUrl);
        if (item.processedUrl) URL.revokeObjectURL(item.processedUrl);
      });
    };
  }, [processedItems]);
  
  const getProcessedClientImage = useCallback(async (imageFile: File): Promise<File> => {
    const isAdjusted = adjustments.brightness !== 100 || adjustments.contrast !== 100 || adjustments.saturation !== 100;
    if (!isAdjusted) {
        return imageFile;
    }

    return new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.src = URL.createObjectURL(imageFile);
        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error("Could not get canvas context"));
            }

            ctx.filter = `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%)`;
            ctx.drawImage(image, 0, 0);

            canvas.toBlob((blob) => {
                if (blob) {
                    const newFile = new File([blob], imageFile.name, { type: blob.type });
                    resolve(newFile);
                } else {
                    reject(new Error("Canvas to Blob conversion failed"));
                }
            }, imageFile.type);
        };
        image.onerror = (err) => reject(new Error(`Image load error: ${err}`));
    });
  }, [adjustments]);

  const handleImageUpload = (files: File[]) => {
    setError(null);
    const newItems: ProcessedItem[] = files.map(file => ({
        id: `${file.name}-${file.lastModified}`,
        originalFile: file,
        originalUrl: URL.createObjectURL(file),
        status: 'queued',
    }));

    const multiple = isBatchAllowed && !(selectedTask === Task.EDIT && editMode === 'watermark');
    if (multiple) {
        setProcessedItems(currentItems => {
            const currentIds = new Set(currentItems.map(item => item.id));
            const uniqueNewItems = newItems.filter(item => !currentIds.has(item.id));
            return [...currentItems, ...uniqueNewItems];
        });
    } else {
        setProcessedItems(newItems.length > 0 ? [newItems[0]] : []);
    }
  };

  const handleRemoveImage = (itemToRemove: ProcessedItem) => {
    setProcessedItems(currentItems =>
      currentItems.filter(item => item.id !== itemToRemove.id)
    );
  };

  const handleClear = () => {
    setProcessedItems([]);
  };

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    setLoadingMessage('Enhancing prompt...');
    try {
        const enhanced = await enhancePrompt(prompt, selectedTask === Task.EDIT ? Task.EDIT : Task.GENERATE);
        setPrompt(enhanced);
    } catch (e: any) {
        setError(e.message);
    } finally {
        setIsEnhancing(false);
        setLoadingMessage('');
    }
  };
  
  const handleDownload = (item: ProcessedItem) => {
    if (!item.processedUrl) return;
    const link = document.createElement('a');
    link.href = item.processedUrl;
    
    const name = item.originalFile.name;
    const extIndex = name.lastIndexOf('.');
    const baseName = extIndex !== -1 ? name.substring(0, extIndex) : name;
    
    link.download = `${baseName}-${selectedTask.toLowerCase().replace(' ', '_')}.jpeg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSignIn = () => {
    const signedInUser = authService.signIn();
    setUser(signedInUser);
  };

  const handleSignOut = () => {
    authService.signOut();
    setUser(null);
  };
  
  const handleSubmit = async (subTask?: Task) => {
    setError(null);
    setSafetyWarning(null);
    setIsLoading(true);

    const taskToRun = subTask || selectedTask;
    let itemsToProcess: ProcessedItem[] = [];
    
    if (taskToRun === Task.GENERATE) {
        const placeholder: ProcessedItem = { id: `gen-${Date.now()}`, originalFile: new File([], "prompt.txt"), originalUrl: '', status: 'queued' };
        setProcessedItems([placeholder]);
        itemsToProcess = [placeholder];
    } else if (taskToRun === Task.SKETCH_TO_IMAGE) {
        if (sketchFile) {
            const placeholder: ProcessedItem = {
                id: `sketch-${Date.now()}`,
                originalFile: sketchFile,
                originalUrl: URL.createObjectURL(sketchFile),
                status: 'queued',
            };
            setProcessedItems([placeholder]);
            itemsToProcess = [placeholder];
        }
    } else {
        itemsToProcess = processedItems.filter(item => item.status === 'queued');
    }
    
    if (itemsToProcess.length === 0 && ![Task.GENERATE, Task.SKETCH_TO_IMAGE].includes(taskToRun)) {
        setError('Please upload an image to process.');
        setIsLoading(false);
        return;
    }
    
    const total = itemsToProcess.length;
    let processedCount = 0;

    for (let i = 0; i < total; i++) {
        const currentItem = itemsToProcess[i];
        processedCount++;

        setProcessedItems(prev => prev.map(item => item.id === currentItem.id ? { ...item, status: 'processing' } : item));
        
        try {
            let resultData: string | undefined;
            let description: string | undefined;

            if (taskToRun === Task.GENERATE) {
                setLoadingMessage('Generating image...');
                resultData = await generateImage(prompt);
                setUser(authService.incrementApiCount());
            } else if (taskToRun === Task.SKETCH_TO_IMAGE) {
                setLoadingMessage('Bringing sketch to life...');
                if (!sketchFile) throw new Error("No sketch was provided.");
                resultData = await generateImageFromSketch(sketchFile);
                setUser(authService.incrementApiCount());
            } else if (taskToRun === Task.DESCRIBE) {
                setLoadingMessage(`Describing image ${processedCount} of ${total}...`);
                description = await describeImage(currentItem.originalFile);
                setUser(authService.incrementApiCount());
            } else if (taskToRun === Task.EDIT && editMode === 'adjust') {
                setLoadingMessage('Applying adjustments...');
                const imageToProcess = await getProcessedClientImage(currentItem.originalFile);
                resultData = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                    reader.onerror = reject;
                    reader.readAsDataURL(imageToProcess);
                });
            } else {
                 let imageToProcess = currentItem.originalFile;
                 let secondaryFile: File | undefined = undefined;
                 let effectiveTask = taskToRun;

                 if (taskToRun === Task.EDIT && editMode === 'watermark') {
                     effectiveTask = Task.WATERMARK;
                 }

                 if (effectiveTask === Task.WATERMARK) {
                     setLoadingMessage(`Removing watermark ${processedCount} of ${total}...`);
                     secondaryFile = maskFile ?? undefined;
                 } else {
                    setLoadingMessage(`Processing image ${processedCount} of ${total}...`);
                 }
                 
                 resultData = await processImage(
                    effectiveTask,
                    imageToProcess,
                    prompt,
                    secondaryFile
                );
                setUser(authService.incrementApiCount());
            }
            

            if (resultData) {
                const blob = await (await fetch(`data:image/jpeg;base64,${resultData}`)).blob();
                const processedUrl = URL.createObjectURL(blob);
                setProcessedItems(prev => prev.map(item => item.id === currentItem.id ? { ...item, status: 'success', processedUrl } : item));
            } else if (description) {
                 setProcessedItems(prev => prev.map(item => item.id === currentItem.id ? { ...item, status: 'success', description } : item));
            }

        } catch (e: any) {
            console.error(e);
            const errorMessage = e.message || 'An unknown error occurred.';
            if (errorMessage.includes('blocked by the safety filter')) {
                setSafetyWarning(errorMessage);
            } else {
                setError(errorMessage);
            }
            setProcessedItems(prev => prev.map(item => item.id === currentItem.id ? { ...item, status: 'error', error: errorMessage, safetyWarning: errorMessage.includes('safety') ? errorMessage : undefined } : item));
        }
    }
    
    setIsLoading(false);
    setLoadingMessage('');
  };

  const getSubmitButtonText = () => {
    switch(selectedTask) {
        case Task.GENERATE: return 'Generate Image';
        case Task.SKETCH_TO_IMAGE: return 'Generate from Sketch';
        case Task.DESCRIBE: return `Describe Image(s)`;
        case Task.EDIT:
            switch(editMode) {
                case 'prompt': return 'Apply Edits';
                case 'watermark': return 'Remove Watermark';
                case 'adjust': return 'Apply Adjustments';
                case 'enhance': return 'Enhance'; // Placeholder, handled by sub-buttons
            }
        default: return 'Process Image(s)';
    }
  };

  const isSubmitDisabled = () => {
      if (isLoading) return true;
      if (selectedTask === Task.GENERATE) return !prompt.trim();
      if (selectedTask === Task.SKETCH_TO_IMAGE) return !sketchFile;
      if (selectedTask === Task.DESCRIBE) return processedItems.length === 0;
      if (selectedTask === Task.EDIT) {
          if (processedItems.length === 0) return true;
          if (editMode === 'prompt') return !prompt.trim();
          if (editMode === 'watermark') return !maskFile;
      }
      return false;
  }
  
  const mainContent = () => {
    switch (selectedTask) {
        case Task.DESCRIBE:
            return <DescriptionViewer items={processedItems} isLoading={isLoading} />;
        default:
            return <ImageViewer 
              items={processedItems} 
              isLoading={isLoading} 
              loadingMessage={loadingMessage} 
              task={selectedTask}
              editMode={editMode}
              onDownload={handleDownload}
              adjustments={adjustments}
            />;
    }
  }
  
  const controlsContentProps = {
      selectedTask, prompt, setPrompt, isLoading, onEnhancePrompt: handleEnhancePrompt, isEnhancing, editMode, setEditMode,
      processedItems, handleImageUpload, handleRemoveImage, handleClear, isBatchAllowed,
      adjustments, setAdjustments, onResetAdjustments: () => setAdjustments(DEFAULT_ADJUSTMENTS), onMaskChange: setMaskFile,
      onSketchChange: setSketchFile,
      handleSubmit, error, getSubmitButtonText, isSubmitDisabled,
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100 font-sans">
      <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} user={user} onSignIn={handleSignIn} onSignOut={handleSignOut} />
      <div className="flex flex-grow overflow-hidden">
        <TaskSelector selectedTask={selectedTask} onSelectTask={setSelectedTask} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        
        <main className="flex-grow flex flex-col p-4 md:p-6 lg:p-8 overflow-y-auto">
            {mainContent()}
        </main>
        
        {/* Desktop Controls Panel */}
        <aside className="hidden md:flex w-96 flex-shrink-0 bg-gray-800/50 border-l border-gray-700/50 flex-col">
            <ControlsContent {...controlsContentProps} />
        </aside>

        {/* Mobile: Controls Trigger Button */}
        <div className="md:hidden fixed bottom-6 right-6 z-30">
            <button
                onClick={() => setIsControlsOpen(true)}
                className="flex items-center justify-center w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 transition-transform active:scale-95"
                aria-label="Open controls"
            >
                <SlidersHorizontalIcon className="w-6 h-6" />
            </button>
        </div>

        {/* Mobile: Bottom Sheet for Controls */}
        <div className={`md:hidden fixed inset-0 z-40 transition-opacity duration-300 ${isControlsOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsControlsOpen(false)} />
            <aside className={`absolute bottom-0 left-0 right-0 max-h-[90vh] bg-gray-900 border-t border-gray-700/50 rounded-t-2xl flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${isControlsOpen ? 'translate-y-0' : 'translate-y-full'}`}>
                <div className="flex-shrink-0 p-4 text-center relative">
                    <div className="w-10 h-1.5 bg-gray-600 rounded-full mx-auto" aria-hidden="true" />
                    <button onClick={() => setIsControlsOpen(false)} className="absolute top-2.5 right-3 p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex-grow flex flex-col overflow-hidden">
                     <ControlsContent {...controlsContentProps} onMobileSubmit={() => setIsControlsOpen(false)} />
                </div>
            </aside>
        </div>
      </div>

      {safetyWarning && (
        <SafetyWarningModal 
          error={safetyWarning} 
          onClose={() => setSafetyWarning(null)} 
        />
      )}
    </div>
  );
}
