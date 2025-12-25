
export interface ArtStyle {
  id: string;
  name: string;
  description: string;
  prompt: string;
  previewImage: string;
}

export interface GenerationRecord {
  id: string;
  originalImage: string;
  resultImage: string;
  styleName: string;
  timestamp: number;
}

export type AppStatus = 'idle' | 'uploading' | 'generating' | 'success' | 'error';
