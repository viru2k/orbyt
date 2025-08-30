export type EntityType = 'user' | 'client' | 'product';
export type FileType = 'image' | 'avatar' | 'thumbnail' | 'document';

export interface ImageUploadConfig {
  entityType: EntityType;
  entityId?: number;
  allowedTypes?: string[];
  maxSize?: number; // en bytes
  aspectRatio?: number;
  required?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ImageUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface ImageUploadOptions {
  fileType: FileType;
  description?: string;
  generateThumbnail?: boolean;
}

export const DEFAULT_IMAGE_CONFIG: Partial<ImageUploadConfig> = {
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  maxSize: 5 * 1024 * 1024, // 5MB
  aspectRatio: 1, // 1:1 para avatares
  required: false
};

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/gif',
  'image/webp'
];

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB