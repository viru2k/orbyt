import { Injectable, inject } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { exhaustMap, tap, switchMap, catchError, of } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { linkToGlobalState } from '../component-state.reducer';
import { Store } from '@ngrx/store';
import { NotificationService } from '@orb-services';
import { NotificationSeverity } from '@orb-models';
import {
  FileUploadResponseDto
} from '../../api/models';
import { UploadService } from '../../api/services/upload.service';

export interface UploadState {
  // Files
  allFiles: FileUploadResponseDto[];
  myFiles: FileUploadResponseDto[];
  entityFiles: { [key: string]: FileUploadResponseDto[] }; // entityType:entityId -> files

  // Upload progress tracking
  uploadProgress: { [key: string]: number }; // filename -> progress percentage
  uploading: { [key: string]: boolean }; // filename -> uploading status

  // UI state
  loading: boolean;
  loadingMyFiles: boolean;
  loadingEntityFiles: boolean;
  error: any | null;
}

const initialState: UploadState = {
  allFiles: [],
  myFiles: [],
  entityFiles: {},
  uploadProgress: {},
  uploading: {},
  loading: false,
  loadingMyFiles: false,
  loadingEntityFiles: false,
  error: null
};

@Injectable({ providedIn: 'root' })
export class UploadStore extends ComponentStore<UploadState> {
  private readonly uploadService = inject(UploadService);
  private readonly notificationService = inject(NotificationService);

  constructor(private readonly globalStore: Store) {
    super(initialState);
    linkToGlobalState(this.state$, 'UploadStore', this.globalStore);
  }

  // Selectors
  readonly allFiles$ = this.select((state) => state.allFiles);
  readonly myFiles$ = this.select((state) => state.myFiles);
  readonly entityFiles$ = this.select((state) => state.entityFiles);
  readonly uploadProgress$ = this.select((state) => state.uploadProgress);
  readonly uploading$ = this.select((state) => state.uploading);
  readonly loading$ = this.select((state) => state.loading);
  readonly loadingMyFiles$ = this.select((state) => state.loadingMyFiles);
  readonly loadingEntityFiles$ = this.select((state) => state.loadingEntityFiles);

  // Computed selectors
  readonly selectFilesByEntity = (entityType: string, entityId: number) =>
    this.select((state) => state.entityFiles[`${entityType}:${entityId}`] || []);

  readonly selectFilesByType = (fileType: string) =>
    this.select(
      this.allFiles$,
      (files) => files.filter(file => file.fileType === fileType)
    );

  readonly selectImageFiles = this.select(
    this.allFiles$,
    (files) => files.filter(file => file.fileType === 'image' || file.fileType === 'avatar' || file.fileType === 'thumbnail')
  );

  readonly selectDocumentFiles = this.select(
    this.allFiles$,
    (files) => files.filter(file => file.fileType === 'document')
  );

  readonly selectUploadingFiles = this.select(
    this.uploading$,
    (uploading) => Object.keys(uploading).filter(filename => uploading[filename])
  );

  // Updaters
  private readonly setLoading = this.updater((state, loading: boolean) => ({
    ...state,
    loading
  }));

  private readonly setLoadingMyFiles = this.updater((state, loadingMyFiles: boolean) => ({
    ...state,
    loadingMyFiles
  }));

  private readonly setLoadingEntityFiles = this.updater((state, loadingEntityFiles: boolean) => ({
    ...state,
    loadingEntityFiles
  }));

  private readonly setMyFiles = this.updater((state, myFiles: FileUploadResponseDto[]) => ({
    ...state,
    myFiles,
    loadingMyFiles: false
  }));

  private readonly setEntityFiles = this.updater((state, { key, files }: { key: string, files: FileUploadResponseDto[] }) => ({
    ...state,
    entityFiles: {
      ...state.entityFiles,
      [key]: files
    },
    loadingEntityFiles: false
  }));

  private readonly addFile = this.updater((state, file: FileUploadResponseDto) => ({
    ...state,
    allFiles: [file, ...state.allFiles],
    myFiles: [file, ...state.myFiles],
    uploading: {
      ...state.uploading,
      [file.originalName]: false
    },
    uploadProgress: {
      ...state.uploadProgress,
      [file.originalName]: 100
    }
  }));

  private readonly updateFile = this.updater((state, file: FileUploadResponseDto) => ({
    ...state,
    allFiles: state.allFiles.map(f => f.id === file.id ? file : f),
    myFiles: state.myFiles.map(f => f.id === file.id ? file : f),
    entityFiles: Object.keys(state.entityFiles).reduce((acc, key) => ({
      ...acc,
      [key]: state.entityFiles[key].map(f => f.id === file.id ? file : f)
    }), {})
  }));

  private readonly removeFile = this.updater((state, fileId: number) => ({
    ...state,
    allFiles: state.allFiles.filter(f => f.id !== fileId),
    myFiles: state.myFiles.filter(f => f.id !== fileId),
    entityFiles: Object.keys(state.entityFiles).reduce((acc, key) => ({
      ...acc,
      [key]: state.entityFiles[key].filter(f => f.id !== fileId)
    }), {})
  }));

  private readonly setUploadProgress = this.updater((state, { filename, progress }: { filename: string, progress: number }) => ({
    ...state,
    uploadProgress: {
      ...state.uploadProgress,
      [filename]: progress
    }
  }));

  private readonly setUploading = this.updater((state, { filename, uploading }: { filename: string, uploading: boolean }) => ({
    ...state,
    uploading: {
      ...state.uploading,
      [filename]: uploading
    }
  }));

  private readonly setError = this.updater((state, error: any) => ({
    ...state,
    error,
    loading: false,
    loadingMyFiles: false,
    loadingEntityFiles: false
  }));

  // Effects
  readonly loadMyFiles = this.effect<{ page?: number; limit?: number }>((params$) =>
    params$.pipe(
      tap(() => this.setLoadingMyFiles(true)),
      exhaustMap((params) =>
        this.uploadService.uploadControllerGetMyFiles(params).pipe(
          tapResponse(
            (files: FileUploadResponseDto[]) => {
              this.setMyFiles(files);
            },
            (error: any) => {
              console.error('Error loading my files:', error);
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al cargar mis archivos.'
              );
            }
          )
        )
      )
    )
  );

  readonly loadFilesByEntity = this.effect<{ entityType: string; entityId: number }>((params$) =>
    params$.pipe(
      tap(() => this.setLoadingEntityFiles(true)),
      exhaustMap(({ entityType, entityId }) =>
        this.uploadService.uploadControllerGetFilesByEntity({ entityType, entityId }).pipe(
          tapResponse(
            (files: FileUploadResponseDto[]) => {
              const key = `${entityType}:${entityId}`;
              this.setEntityFiles({ key, files });
            },
            (error: any) => {
              console.error('Error loading entity files:', error);
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al cargar los archivos de la entidad.'
              );
            }
          )
        )
      )
    )
  );

  readonly uploadFile = this.effect<{
    file: File;
    entityType?: string;
    entityId?: number;
    fileType?: string;
    description?: string
  }>((uploadData$) =>
    uploadData$.pipe(
      tap(({ file }) => {
        this.setUploading({ filename: file.name, uploading: true });
        this.setUploadProgress({ filename: file.name, progress: 0 });
      }),
      exhaustMap(({ file, entityType, entityId, fileType, description }) => {
        const formData = new FormData();
        formData.append('file', file);
        if (entityType) formData.append('entityType', entityType);
        if (entityId) formData.append('entityId', entityId.toString());
        if (fileType) formData.append('fileType', fileType);
        if (description) formData.append('description', description);

        return this.uploadService.uploadControllerUploadFile({ body: formData }).pipe(
          tapResponse(
            (uploadedFile: FileUploadResponseDto) => {
              this.addFile(uploadedFile);
              this.notificationService.showSuccess(
                NotificationSeverity.Success,
                'Archivo subido con éxito.'
              );

              // If file was uploaded for an entity, refresh entity files
              if (entityType && entityId) {
                this.loadFilesByEntity({ entityType, entityId });
              }
            },
            (error: any) => {
              console.error('Error uploading file:', error);
              this.setUploading({ filename: file.name, uploading: false });
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al subir el archivo.'
              );
            }
          )
        );
      })
    )
  );

  readonly updateFileEntity = this.effect<{
    fileId: number;
    entityType: string;
    entityId: number;
    description?: string
  }>((updateData$) =>
    updateData$.pipe(
      tap(() => this.setLoading(true)),
      exhaustMap(({ fileId, entityType, entityId, description }) =>
        this.uploadService.uploadControllerUpdateFileEntity({
          id: fileId,
          body: { entityType, entityId, description }
        }).pipe(
          tapResponse(
            (updatedFile: FileUploadResponseDto) => {
              this.updateFile(updatedFile);
              this.setLoading(false);
              this.notificationService.showSuccess(
                NotificationSeverity.Success,
                'Archivo actualizado con éxito.'
              );

              // Refresh entity files
              this.loadFilesByEntity({ entityType, entityId });
            },
            (error: any) => {
              console.error('Error updating file entity:', error);
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al actualizar el archivo.'
              );
            }
          )
        )
      )
    )
  );

  readonly deleteFile = this.effect<number>((fileId$) =>
    fileId$.pipe(
      tap(() => this.setLoading(true)),
      exhaustMap((fileId) =>
        this.uploadService.uploadControllerDeleteFile({ id: fileId }).pipe(
          tapResponse(
            () => {
              this.removeFile(fileId);
              this.setLoading(false);
              this.notificationService.showSuccess(
                NotificationSeverity.Success,
                'Archivo eliminado con éxito.'
              );
            },
            (error: any) => {
              console.error('Error deleting file:', error);
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al eliminar el archivo.'
              );
            }
          )
        )
      )
    )
  );

  readonly downloadFile = this.effect<number>((fileId$) =>
    fileId$.pipe(
      exhaustMap((fileId) =>
        this.uploadService.uploadControllerDownloadFile({ id: fileId }).pipe(
          tapResponse(
            (response) => {
              // Handle file download - this might need additional implementation
              // depending on how the backend returns the file
              this.notificationService.showSuccess(
                NotificationSeverity.Success,
                'Descarga iniciada.'
              );
            },
            (error: any) => {
              console.error('Error downloading file:', error);
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al descargar el archivo.'
              );
            }
          )
        )
      )
    )
  );

  // Utility methods
  refreshMyFiles(): void {
    this.loadMyFiles({});
  }

  refreshEntityFiles(entityType: string, entityId: number): void {
    this.loadFilesByEntity({ entityType, entityId });
  }

  getFileById(fileId: number): FileUploadResponseDto | undefined {
    return this.get().allFiles.find(file => file.id === fileId) ||
           this.get().myFiles.find(file => file.id === fileId);
  }

  getFilesByEntity(entityType: string, entityId: number): FileUploadResponseDto[] {
    const key = `${entityType}:${entityId}`;
    return this.get().entityFiles[key] || [];
  }

  getUploadProgress(filename: string): number {
    return this.get().uploadProgress[filename] || 0;
  }

  isUploading(filename: string): boolean {
    return this.get().uploading[filename] || false;
  }

  // Helper method to validate file type and size
  validateFile(file: File, maxSizeBytes: number = 10 * 1024 * 1024): { valid: boolean; error?: string } {
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `El archivo es demasiado grande. Máximo permitido: ${Math.round(maxSizeBytes / 1024 / 1024)}MB`
      };
    }

    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv'
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Tipo de archivo no permitido.'
      };
    }

    return { valid: true };
  }

  // Helper method to get file type icon
  getFileTypeIcon(file: FileUploadResponseDto): string {
    if (file.fileType === 'image' || file.fileType === 'avatar' || file.fileType === 'thumbnail') {
      return 'pi pi-image';
    }

    if (file.mimeType.includes('pdf')) {
      return 'pi pi-file-pdf';
    }

    if (file.mimeType.includes('word') || file.mimeType.includes('document')) {
      return 'pi pi-file-word';
    }

    if (file.mimeType.includes('excel') || file.mimeType.includes('spreadsheet')) {
      return 'pi pi-file-excel';
    }

    return 'pi pi-file';
  }

  // Helper method to format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}