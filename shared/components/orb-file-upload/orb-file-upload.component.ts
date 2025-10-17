import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FileUpload, FileUploadModule } from 'primeng/fileupload';
import { ProgressBarModule } from 'primeng/progressbar';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthStore } from '../../../src/app/store';
import { ApiConfiguration } from '../../../src/app/api/api-configuration';

export type EntityType = 'user' | 'client' | 'product';

export interface FileUploadConfig {
  maxFileSize: number;
  accept: string;
  multiple: boolean;
}

@Component({
  selector: 'orb-file-upload',
  standalone: true,
  imports: [
    CommonModule,
    FileUploadModule,
    ProgressBarModule,
    ButtonModule,
    ToastModule
  ],
  providers: [MessageService],
  template: `
    <p-toast></p-toast>
    <div class="orb-file-upload">
      <p-fileUpload 
        [url]="uploadUrl"
        [multiple]="config.multiple"
        [accept]="config.accept"
        [maxFileSize]="config.maxFileSize"
        [customUpload]="true"
        (onUpload)="onUpload($event)"
        (onError)="onError($event)"
        (onSelect)="onSelect($event)"
        (uploadHandler)="customUploadHandler($event)"
        [showUploadButton]="true"
        [showCancelButton]="true"
        [chooseLabel]="chooseLabel"
        [uploadLabel]="'Subir'"
        [cancelLabel]="'Cancelar'">
        
        <ng-template pTemplate="content" let-files>
          <div class="upload-preview" *ngIf="files && files.length > 0">
            <div class="file-item" *ngFor="let file of files; let i = index">
              <div class="file-preview" *ngIf="isImageFile(file)">
                <img [src]="getFilePreview(file)" [alt]="file.name" class="preview-image"/>
              </div>
              <div class="file-info">
                <div class="file-name">{{ file.name }}</div>
                <div class="file-size">{{ formatFileSize(file.size) }}</div>
              </div>
            </div>
          </div>
        </ng-template>
        
        <ng-template pTemplate="empty" #emptyTemplate>
          <div class="empty-upload-area">
            <i class="fas fa-cloud-arrow-up" style="font-size: 3rem; color: #ccc;" aria-hidden="true"></i>
            <p>Arrastra y suelta archivos aquí para subirlos</p>
          </div>
        </ng-template>
      </p-fileUpload>
    </div>
  `,
  styleUrls: ['./orb-file-upload.component.scss']
})
export class OrbFileUploadComponent implements OnInit {
  @Input() entityType!: EntityType;
  @Input() entityId?: number;
  @Input() config: FileUploadConfig = {
    maxFileSize: 5242880, // 5MB
    accept: 'image/*',
    multiple: false
  };
  @Input() chooseLabel: string = 'Seleccionar archivo';
  
  @Output() fileUploaded = new EventEmitter<any>();
  @Output() uploadError = new EventEmitter<string>();

  uploadUrl = '';

  private authStore = inject(AuthStore);
  private apiConfig = inject(ApiConfiguration);
  private http = inject(HttpClient);
  
  constructor(private messageService: MessageService) {}

  ngOnInit() {
    // Configurar URL según el tipo de entidad
    this.uploadUrl = this.getUploadUrl();
  }

  private getUploadUrl(): string {
    // Use relative URLs - the proxy will handle the redirection to localhost:3000
    switch (this.entityType) {
      case 'user':
        return '/api/users/upload-avatar';
      case 'client':
        return `/api/clients/${this.entityId}/upload-avatar`;
      case 'product':
        return `/api/products/${this.entityId}/upload-image`;
      default:
        return '/api/upload';
    }
  }

  customUploadHandler(event: any) {
    const files = event.files;
    const formData = new FormData();
    
    // Agregar el archivo
    if (files && files.length > 0) {
      formData.append('file', files[0]);
    }

    // Realizar upload usando HttpClient (pasa por interceptor y proxy)
    this.http.post(this.uploadUrl, formData).subscribe({
      next: (result: any) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Archivo subido correctamente'
        });
        this.fileUploaded.emit(result);
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
      }
    });
  }

  onUpload(event: any) {
    console.log('Upload successful:', event);
    this.fileUploaded.emit(event.originalEvent.body);
  }

  onError(event: any) {
    console.error('Upload error:', event);
    const errorMessage = 'Error al subir el archivo';
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: errorMessage
    });
    this.uploadError.emit(errorMessage);
  }

  onSelect(event: any) {
    console.log('Files selected:', event);
  }

  isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  }

  getFilePreview(file: File): string {
    return URL.createObjectURL(file);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}