import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, finalize } from 'rxjs';

import { ProgressBarModule } from 'primeng/progressbar';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { MessageModule } from 'primeng/message';

import { OrbButtonComponent } from '@orb-shared-components/orb-button/orb-button.component';
import { OrbCardComponent } from '@orb-shared-components/application/orb-card/orb-card.component';

import { ImageUploadService } from '../../../src/app/shared/services/image-upload.service';
import { FileUploadResponseDto } from '../../../src/app/api/models/file-upload-response-dto';
import { 
  EntityType, 
  ImageUploadConfig, 
  ValidationResult,
  ImageUploadOptions,
  DEFAULT_IMAGE_CONFIG 
} from '../../../src/app/shared/models/image-upload.interfaces';

@Component({
  selector: 'orb-image-upload',
  standalone: true,
  imports: [
    CommonModule,
    ProgressBarModule,
    ButtonModule,
    TooltipModule,
    MessageModule,
    OrbButtonComponent,
    OrbCardComponent
  ],
  templateUrl: './orb-image-upload.component.html',
  styleUrls: ['./orb-image-upload.component.scss']
})
export class OrbImageUploadComponent implements OnInit, OnDestroy {
  
  @Input() entityType!: EntityType;
  @Input() entityId?: number;
  @Input() currentImage?: FileUploadResponseDto | null;
  @Input() config: Partial<ImageUploadConfig> = {};
  @Input() disabled = false;
  @Input() showPreview = true;
  @Input() showProgress = true;
  @Input() allowReplace = true;

  @Output() imageUploaded = new EventEmitter<FileUploadResponseDto>();
  @Output() imageDeleted = new EventEmitter<void>();
  @Output() uploadError = new EventEmitter<string>();
  @Output() validationError = new EventEmitter<string[]>();

  @ViewChild('fileInput', { static: true }) fileInput!: ElementRef<HTMLInputElement>;

  // Estado del componente
  isDragOver = false;
  isUploading = false;
  uploadProgress = 0;
  previewUrl: string | null = null;
  selectedFile: File | null = null;
  validationErrors: string[] = [];
  
  private destroy$ = new Subject<void>();
  public finalConfig: ImageUploadConfig;

  constructor(public imageUploadService: ImageUploadService) {
    this.finalConfig = { ...DEFAULT_IMAGE_CONFIG, ...this.config } as ImageUploadConfig;
  }

  ngOnInit() {
    this.finalConfig = { ...DEFAULT_IMAGE_CONFIG, ...this.config } as ImageUploadConfig;
    
    if (this.currentImage) {
      this.previewUrl = this.currentImage.thumbnailUrl || this.currentImage.url;
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.previewUrl && !this.currentImage) {
      URL.revokeObjectURL(this.previewUrl);
    }
  }

  // Event handlers para drag & drop
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.disabled) {
      this.isDragOver = true;
    }
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    if (this.disabled) return;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  // Handler para selección de archivo
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  // Abrir selector de archivos
  openFileSelector() {
    if (!this.disabled) {
      this.fileInput.nativeElement.click();
    }
  }

  // Procesar archivo seleccionado
  private handleFile(file: File) {
    this.selectedFile = file;
    this.validationErrors = [];

    // Validar archivo
    const validation = this.imageUploadService.validateImageFile(file, this.finalConfig);
    
    if (!validation.valid) {
      this.validationErrors = validation.errors;
      this.validationError.emit(validation.errors);
      return;
    }

    // Crear preview
    this.createPreview(file);
  }

  // Crear preview de la imagen
  private createPreview(file: File) {
    this.imageUploadService.createImagePreview(file)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (previewUrl) => {
          // Limpiar preview anterior si no es de currentImage
          if (this.previewUrl && !this.currentImage) {
            URL.revokeObjectURL(this.previewUrl);
          }
          this.previewUrl = previewUrl;
        },
        error: (error) => {
          console.error('Error creating preview:', error);
          this.uploadError.emit('Error al crear preview de la imagen');
        }
      });
  }

  // Subir imagen
  uploadImage() {
    if (!this.selectedFile) {
      return;
    }

    // Para usuarios no necesitamos entityId, para otros sí
    if (this.entityType !== 'user' && !this.entityId) {
      return;
    }

    this.isUploading = true;
    this.uploadProgress = 0;

    const options: Partial<ImageUploadOptions> = {
      fileType: 'avatar',
      description: `${this.entityType} avatar`
    };

    this.imageUploadService.uploadAvatar(
      this.selectedFile, 
      this.entityType, 
      this.entityId,
      options
    ).pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.isUploading = false;
        this.uploadProgress = 0;
      })
    ).subscribe({
      next: (response) => {
        this.currentImage = response;
        this.previewUrl = response.thumbnailUrl || response.url;
        this.selectedFile = null;
        this.resetFileInput();
        this.imageUploaded.emit(response);
      },
      error: (error) => {
        console.error('Upload error:', error);
        this.uploadError.emit(error.message || 'Error al subir la imagen');
        // Revertir preview si hay error
        if (this.currentImage) {
          this.previewUrl = this.currentImage.thumbnailUrl || this.currentImage.url;
        } else {
          this.clearPreview();
        }
      }
    });

    // Simular progreso (ya que el servicio no lo provee)
    this.simulateProgress();
  }

  // Eliminar imagen
  deleteImage() {
    if (!this.currentImage) return;

    this.isUploading = true;

    this.imageUploadService.deleteImage(this.currentImage.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isUploading = false)
      )
      .subscribe({
        next: () => {
          this.currentImage = null;
          this.clearPreview();
          this.imageDeleted.emit();
        },
        error: (error) => {
          console.error('Delete error:', error);
          this.uploadError.emit(error.message || 'Error al eliminar la imagen');
        }
      });
  }

  // Cancelar upload
  cancelUpload() {
    this.selectedFile = null;
    this.isUploading = false;
    this.uploadProgress = 0;
    
    // Revertir preview
    if (this.currentImage) {
      this.previewUrl = this.currentImage.thumbnailUrl || this.currentImage.url;
    } else {
      this.clearPreview();
    }
    
    this.resetFileInput();
  }

  // Utilidades
  private clearPreview() {
    if (this.previewUrl && !this.currentImage) {
      URL.revokeObjectURL(this.previewUrl);
    }
    this.previewUrl = null;
  }

  private resetFileInput() {
    this.fileInput.nativeElement.value = '';
  }

  private simulateProgress() {
    const interval = setInterval(() => {
      this.uploadProgress += 10;
      if (this.uploadProgress >= 90 || !this.isUploading) {
        clearInterval(interval);
        if (this.isUploading) {
          this.uploadProgress = 90; // Dejar en 90% hasta que termine la petición real
        }
      }
    }, 100);
  }

  // Getters para el template
  get hasImage(): boolean {
    return !!(this.currentImage || this.previewUrl);
  }

  get hasNewImage(): boolean {
    return !!(this.selectedFile && this.previewUrl);
  }

  get canUpload(): boolean {
    if (!this.selectedFile || this.isUploading) {
      return false;
    }
    
    // Para usuarios no necesitamos entityId, para otros sí
    return this.entityType === 'user' || !!this.entityId;
  }

  get canDelete(): boolean {
    return !!(this.currentImage && !this.isUploading);
  }

  get maxSizeText(): string {
    if (this.finalConfig.maxSize) {
      return this.imageUploadService.formatFileSize(this.finalConfig.maxSize);
    }
    return '5MB';
  }

  get allowedTypesText(): string {
    const types = this.finalConfig.allowedTypes || [];
    return types.map(type => type.split('/')[1].toUpperCase()).join(', ');
  }

  /**
   * Obtener nombre de archivo para mostrar, truncando si es muy largo
   */
  getDisplayFileName(fileName: string): string {
    if (!fileName) return 'Sin nombre';
    
    // Si el nombre es muy largo (como un hash), truncarlo
    if (fileName.length > 30) {
      const extension = fileName.split('.').pop();
      const nameWithoutExtension = fileName.substring(0, fileName.lastIndexOf('.') || fileName.length);
      
      if (extension) {
        return `${nameWithoutExtension.substring(0, 15)}...${nameWithoutExtension.slice(-5)}.${extension}`;
      } else {
        return `${fileName.substring(0, 15)}...${fileName.slice(-10)}`;
      }
    }
    
    return fileName;
  }
}