export enum Task {
  GENERATE = 'Generate',
  EDIT = 'Edit',
  DESCRIBE = 'Describe',
  SKETCH_TO_IMAGE = 'Sketch to Image',
  // FIX: Add missing enum values for edit sub-tasks.
  UPSCALE = 'Upscale',
  REPAIR = 'Repair',
  WATERMARK = 'Watermark',
}

export type EditMode = 'prompt' | 'enhance' | 'adjust' | 'watermark';

export interface ProcessedItem {
  id: string;
  originalFile: File;
  originalUrl: string;
  processedUrl?: string;
  description?: string;
  error?: string;
  safetyWarning?: string;
  status: 'queued' | 'processing' | 'success' | 'error';
}