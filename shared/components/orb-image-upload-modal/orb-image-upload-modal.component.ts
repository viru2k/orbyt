import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { Subject, takeUntil, finalize } from 'rxjs';

import { OrbButtonComponent } from '../orb-button/orb-button.component';
import { OrbSimpleUploadComponent } from '../orb-simple-upload/orb-simple-upload.component';

import { FileUploadResponseDto } from '../../../src/app/api/models/file-upload-response-dto';
import { EntityType } from '../../../src/app/shared/models/image-upload.interfaces';

@Component({
  selector: 'orb-image-upload-modal',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    OrbButtonComponent,
    OrbSimpleUploadComponent
  ],
  template: `
    <p-dialog 
      [(visible)]="visible"
      [header]="modalTitle"
      [modal]="true"
      [closable]="true"
      [draggable]="false"
      [resizable]="false"
      styleClass="image-upload-modal"
      [style]="{ width: '500px' }"
      (onHide)="onCancel()">
      
      <div class="modal-content">
        <orb-simple-upload
          [entityType]="entityType"
          [entityId]="entityId"
          [currentFile]="currentImage"
          acceptTypes="image/*"
          uploadText="Selecciona o arrastra una imagen"
          [disabled]="isUploading"
          (fileUploaded)="onImageUploaded($event)"
          (fileDeleted)="onImageDeleted()"
          (uploadError)="onUploadError($event)">
        </orb-simple-upload>
      </div>

      <ng-template pTemplate="footer">
        <div class="modal-footer">
          <orb-button
            label="Cerrar"
            severity="secondary"
            styleType="text"
            [disabled]="isUploading"
            (onClick)="onCancel()">
          </orb-button>
        </div>
      </ng-template>
    </p-dialog>
  `,
  styleUrls: ['./orb-image-upload-modal.component.scss']
})
export class OrbImageUploadModalComponent implements OnInit, OnDestroy {
  @Input() visible = false;
  @Input() entityType!: EntityType;
  @Input() entityId?: number;
  @Input() currentImage?: FileUploadResponseDto | null;
  @Input() modalTitle = 'Subir Imagen';

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() imageUploaded = new EventEmitter<FileUploadResponseDto>();
  @Output() imageDeleted = new EventEmitter<void>();
  @Output() uploadError = new EventEmitter<string>();

  isUploading = false;
  private destroy$ = new Subject<void>();

  ngOnInit() {
    // Inicialización si es necesaria
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onImageUploaded(image: FileUploadResponseDto) {
    this.imageUploaded.emit(image);
    // Cerrar modal después de subida exitosa
    setTimeout(() => {
      this.closeModal();
    }, 1000); // Esperar un poco para que se vea la notificación de éxito
  }

  onImageDeleted() {
    this.imageDeleted.emit();
    // Cerrar modal después de eliminación exitosa
    setTimeout(() => {
      this.closeModal();
    }, 1000);
  }

  onUploadError(error: string) {
    this.uploadError.emit(error);
    // No cerramos el modal en caso de error
  }

  onCancel() {
    this.closeModal();
  }

  private closeModal() {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}