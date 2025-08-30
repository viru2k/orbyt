import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ProgressBarModule } from 'primeng/progressbar';
import { MessageService } from 'primeng/api';

import { ImageUploadService } from '../../../src/app/shared/services/image-upload.service';
import { FileUploadResponseDto } from '../../../src/app/api/models/file-upload-response-dto';
import { EntityType } from '../../../src/app/shared/models/image-upload.interfaces';

@Component({
  selector: 'orb-simple-upload',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    ToastModule,
    ProgressBarModule
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>
    <div class="orb-simple-upload" 
         [class.drag-over]="isDragOver"
         (drop)="onDrop($event)" 
         (dragover)="onDragOver($event)" 
         (dragleave)="onDragLeave($event)">
      
      <!-- Hidden file input -->
      <input #fileInput 
             type="file" 
             [accept]="acceptTypes" 
             (change)="onFileSelected($event)"
             style="display: none;">
      
      <!-- Upload area -->
      <div class="upload-area" *ngIf="!selectedFile && !currentFile">
        <div class="upload-content">
          <i class="pi pi-cloud-upload upload-icon"></i>
          <p class="upload-text">{{ uploadText }}</p>
          <p class="upload-hint">o arrastra y suelta aquí</p>
          <p-button 
            label="Seleccionar archivo" 
            icon="pi pi-folder-open"
            [disabled]="isUploading"
            (onClick)="openFileSelector()">
          </p-button>
        </div>
      </div>
      
      <!-- File preview -->
      <div class="file-preview" *ngIf="selectedFile || currentFile">
        <div class="preview-content">
          <img *ngIf="previewUrl && isImage" 
               [src]="previewUrl" 
               [alt]="fileName"
               class="preview-image">
          <i *ngIf="!isImage" class="pi pi-file preview-file-icon"></i>
          
          <div class="file-info">
            <p class="file-name">{{ fileName }}</p>
            <p class="file-size">{{ fileSize }}</p>
          </div>
          
          <div class="file-actions">
            <p-button *ngIf="selectedFile && !isUploading" 
                      label="Subir" 
                      icon="pi pi-upload" 
                      severity="success"
                      (onClick)="uploadFile()">
            </p-button>
            
            <p-button *ngIf="selectedFile" 
                      label="Cancelar" 
                      icon="pi pi-times" 
                      severity="secondary"
                      [disabled]="isUploading"
                      (onClick)="cancelUpload()">
            </p-button>
            
            <p-button *ngIf="currentFile" 
                      label="Cambiar" 
                      icon="pi pi-pencil" 
                      severity="info"
                      [disabled]="isUploading"
                      (onClick)="openFileSelector()">
            </p-button>
            
            <p-button *ngIf="currentFile" 
                      label="Eliminar" 
                      icon="pi pi-trash" 
                      severity="danger"
                      [disabled]="isUploading"
                      (onClick)="deleteFile()">
            </p-button>
          </div>
        </div>
        
        <!-- Progress bar -->
        <p-progressBar *ngIf="isUploading" 
                       [value]="uploadProgress"
                       [showValue]="true">
        </p-progressBar>
      </div>
    </div>
  `,
  styleUrls: ['./orb-simple-upload.component.scss']
})
export class OrbSimpleUploadComponent {
  @Input() entityType!: EntityType;
  @Input() entityId?: number;
  @Input() currentFile?: FileUploadResponseDto | null;
  @Input() acceptTypes: string = 'image/*';
  @Input() uploadText: string = 'Selecciona o arrastra una imagen';
  @Input() disabled: boolean = false;

  @Output() fileUploaded = new EventEmitter<FileUploadResponseDto>();
  @Output() fileDeleted = new EventEmitter<void>();
  @Output() uploadError = new EventEmitter<string>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  selectedFile: File | null = null;
  previewUrl: string | null = null;
  isUploading: boolean = false;
  uploadProgress: number = 0;
  isDragOver: boolean = false;

  constructor(
    private imageUploadService: ImageUploadService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    if (this.currentFile) {
      this.previewUrl = this.currentFile.thumbnailUrl || this.currentFile.url;
    }
  }

  ngOnDestroy() {
    this.cleanupPreview();
  }

  openFileSelector() {
    if (!this.disabled && !this.isUploading) {
      this.fileInput.nativeElement.click();
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.disabled && !this.isUploading) {
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

    if (this.disabled || this.isUploading) return;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  private handleFile(file: File) {
    this.selectedFile = file;
    this.createPreview(file);
  }

  private createPreview(file: File) {
    this.cleanupPreview();
    
    if (this.isImage) {
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  uploadFile() {
    if (!this.selectedFile) return;

    this.isUploading = true;
    this.uploadProgress = 0;

    // Simular progreso
    this.simulateProgress();

    this.imageUploadService.uploadAvatar(
      this.selectedFile,
      this.entityType,
      this.entityId
    ).pipe(
      finalize(() => {
        this.isUploading = false;
        this.uploadProgress = 0;
      })
    ).subscribe({
      next: (response) => {
        this.currentFile = response;
        this.previewUrl = response.thumbnailUrl || response.url;
        this.selectedFile = null;
        this.resetFileInput();
        
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Archivo subido correctamente'
        });
        
        this.fileUploaded.emit(response);
      },
      error: (error) => {
        console.error('Upload error:', error);
        const errorMessage = error.message || 'Error al subir el archivo';
        
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage
        });
        
        this.uploadError.emit(errorMessage);
        
        // Revertir preview si hay error
        if (this.currentFile) {
          this.previewUrl = this.currentFile.thumbnailUrl || this.currentFile.url;
        } else {
          this.cleanupPreview();
        }
      }
    });
  }

  cancelUpload() {
    this.selectedFile = null;
    this.cleanupPreview();
    this.resetFileInput();
    
    if (this.currentFile) {
      this.previewUrl = this.currentFile.thumbnailUrl || this.currentFile.url;
    }
  }

  deleteFile() {
    if (!this.currentFile) return;

    this.isUploading = true;

    this.imageUploadService.deleteImage(this.currentFile.id)
      .pipe(finalize(() => this.isUploading = false))
      .subscribe({
        next: () => {
          this.currentFile = null;
          this.cleanupPreview();
          
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Archivo eliminado correctamente'
          });
          
          this.fileDeleted.emit();
        },
        error: (error) => {
          console.error('Delete error:', error);
          const errorMessage = error.message || 'Error al eliminar el archivo';
          
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: errorMessage
          });
        }
      });
  }

  private simulateProgress() {
    const interval = setInterval(() => {
      this.uploadProgress += 10;
      if (this.uploadProgress >= 90 || !this.isUploading) {
        clearInterval(interval);
        if (this.isUploading) {
          this.uploadProgress = 90;
        }
      }
    }, 100);
  }

  private cleanupPreview() {
    if (this.previewUrl && !this.currentFile) {
      URL.revokeObjectURL(this.previewUrl);
    }
    this.previewUrl = null;
  }

  private resetFileInput() {
    this.fileInput.nativeElement.value = '';
  }

  get fileName(): string {
    let name = '';
    if (this.selectedFile) {
      name = this.selectedFile.name;
    } else if (this.currentFile) {
      name = this.currentFile.originalName || this.currentFile.filename;
    }
    
    return this.getDisplayFileName(name);
  }

  /**
   * Obtener nombre de archivo para mostrar, truncando si es muy largo
   */
  private getDisplayFileName(fileName: string): string {
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

  get fileSize(): string {
    if (this.selectedFile) {
      return this.formatFileSize(this.selectedFile.size);
    }
    if (this.currentFile) {
      return this.formatFileSize(this.currentFile.size);
    }
    return '';
  }

  get isImage(): boolean {
    if (this.selectedFile) {
      return this.selectedFile.type.startsWith('image/');
    }
    if (this.currentFile) {
      return this.currentFile.mimeType.startsWith('image/');
    }
    return false;
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}