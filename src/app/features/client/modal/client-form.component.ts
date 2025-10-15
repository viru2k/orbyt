import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// PrimeNG y Componentes Orb
import { OrbButtonComponent, OrbTextInputComponent, OrbFormFieldComponent, OrbFormFooterComponent, OrbSelectComponent, OrbDatepickerComponent, OrbTextAreaComponent, OrbCardComponent, OrbEntityAvatarComponent } from '@orb-components';

// Store y DTOs
import { ClientStore } from '@orb-stores';
import { ClientResponseDto, CreateClientDto, UpdateClientDto } from '../../../api/models';
import { FileUploadResponseDto } from '../../../api/models/file-upload-response-dto';
import { AvatarEntity } from '../../../shared/models/entity-avatar.interfaces';

// Servicios y Modelos
import { NotificationService, UtilsService } from '@orb-services';
import { NotificationSeverity, FormButtonAction } from '@orb-models';
import { ImageUploadService } from '../../../shared/services/image-upload.service';

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,    
    OrbTextInputComponent,
    OrbFormFieldComponent,
    OrbFormFooterComponent,
    OrbSelectComponent,
    OrbDatepickerComponent,
    OrbTextAreaComponent,
    OrbCardComponent,
    OrbEntityAvatarComponent
  ],
  templateUrl: './client-form.component.html',
  styleUrls: ['./client-form.component.scss'],
})
export class ClientFormComponent implements OnInit {
  @Input() client?: ClientResponseDto;
  @Output() saved = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private clientStore = inject(ClientStore);
  private notificationService = inject(NotificationService);
  public utilsService = inject(UtilsService); // Se hace público para el template
  private imageUploadService = inject(ImageUploadService);

  form!: FormGroup;
  isEditMode = false;
  currentClientEntity: AvatarEntity | null = null;
  currentAvatar: FileUploadResponseDto | null = null;
  private pendingAvatarUpload: File | null = null;

  // Opciones para los menús desplegables
  genderOptions = [
    { label: 'Masculino', value: 'MALE' },
    { label: 'Femenino', value: 'FEMALE' },
    { label: 'Otro', value: 'OTHER' },
  ];

  statusOptions = [
    { label: 'Activo', value: 'ACTIVE' },
    { label: 'Inactivo', value: 'INACTIVE' },
  ];

  dniTypeOptions = [
    { label: 'Cédula de Ciudadanía', value: 'CC' },
    { label: 'Cédula de Extranjería', value: 'CE' },
    { label: 'Pasaporte', value: 'PP' },
    { label: 'Tarjeta de Identidad', value: 'TI' },
  ];

  // Configuración para el pie de página del formulario
  footerActions: FormButtonAction[] = [
    { label: 'Cancelar', action: 'cancel', severity: 'secondary', styleType: 'text' },
    { label: 'Guardar', action: 'save', severity: 'success', buttonType: 'submit', outlined: true },
  ];

  ngOnInit(): void {
    this.isEditMode = !!this.client;
    this.initForm();

    if (this.isEditMode && this.client) {
      this.form.patchValue(this.client);
      this.currentClientEntity = { ...this.client, isActive: this.client.isActive ?? true };
    } else {
      // Para modo creación, crear una entidad temporal
      this.currentClientEntity = {
        id: 0, // ID temporal para nuevo cliente
        name: '',
        lastName: '',
        fullname: '',
        email: '',
        phone: '',
        address: '',
        birthDate: '',
        gender: undefined,
        status: 'ACTIVE',
        isActive: true, // Nuevo campo requerido
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as ClientResponseDto;
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      fullname: [{ value: '', disabled: true }], // Campo deshabilitado, se calcula automáticamente
      name: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      address: [''],
      birthDate: [null],
      gender: [null],
      status: ['ACTIVE', Validators.required],
      dniType: [null],
      dniNumber: [''],
      notes: ['']
    });

    // Lógica para actualizar 'fullname' cuando 'name' o 'lastName' cambian
    this.form.get('name')?.valueChanges.subscribe(() => this.updateFullname());
    this.form.get('lastName')?.valueChanges.subscribe(() => this.updateFullname());
  }

  private updateFullname(): void {
    const name = this.form.get('name')?.value || '';
    const lastName = this.form.get('lastName')?.value || '';
    this.form.get('fullname')?.setValue(`${name} ${lastName}`.trim(), { emitEvent: false });
  }
  
  // Se llama con (ngSubmit) o desde el footer
  accept(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notificationService.showWarn(NotificationSeverity.Warn, 'Por favor, completa todos los campos requeridos.');
      return;
    }

    // Obtenemos los valores, incluyendo los deshabilitados como 'fullname'
    const formValue = this.form.getRawValue();

    if (this.isEditMode && this.client?.id) {
      const updateDto: UpdateClientDto = formValue;
      this.clientStore.update({ id: this.client.id, clientDto: updateDto });
      this.notificationService.showSuccess(NotificationSeverity.Success, 'Cliente actualizado con éxito.');
      this.saved.emit();
    } else {
      // Para modo creación, primero crear el cliente
      const createDto: CreateClientDto = formValue;

      // Necesitamos suscribirnos al store para obtener el cliente creado
      // y luego subir el avatar si hay uno pendiente
      this.clientStore.create(createDto);

      // Si hay avatar pendiente, esperar a que se cree el cliente
      if (this.pendingAvatarUpload) {
        // Esperar un momento para que el store se actualice
        setTimeout(() => {
          const clients = this.clientStore.clients();
          if (clients.length > 0) {
            const latestClient = clients[clients.length - 1];

            // Subir avatar con el ID del cliente creado
            this.imageUploadService.uploadAvatar(
              this.pendingAvatarUpload!,
              'client',
              latestClient.id,
              { fileType: 'avatar' }
            ).subscribe({
              next: (result) => {
                console.log('Avatar uploaded after client creation:', result);

                // Actualizar el cliente con el avatarUrl usando any cast temporalmente
                if (result?.url) {
                  const updateDto: any = {
                    avatarUrl: result.url
                  };
                  this.clientStore.update({ id: latestClient.id, clientDto: updateDto });
                }

                this.currentAvatar = result;
                this.pendingAvatarUpload = null;
              },
              error: (error) => {
                console.error('Error uploading avatar after client creation:', error);
                this.notificationService.showError(
                  NotificationSeverity.Error,
                  `Error al subir avatar: ${error.message || error}`
                );
              }
            });
          }
        }, 500);
      }

      this.notificationService.showSuccess(NotificationSeverity.Success, 'Cliente creado con éxito.');
      this.saved.emit();
    }
  }

  // Manejar la carga de avatar
  onAvatarUploaded(result: any): void {
    console.log('Avatar uploaded:', result);
    this.currentAvatar = result;

    // Si estamos en modo edición, actualizar el cliente con el avatarUrl
    if (this.isEditMode && this.client?.id && result?.url) {
      const avatarUrl = result.url;
      const updateDto: any = {
        avatarUrl: avatarUrl
      };

      this.clientStore.update({ id: this.client.id, clientDto: updateDto });
    }

    // Recargar los clientes para reflejar el cambio
    this.clientStore.load();
  }

  // Handle file selection (before upload)
  onAvatarFileSelected(file: File): void {
    if (!this.isEditMode) {
      // In create mode, store the file for later upload
      this.pendingAvatarUpload = file;
    }
    // In edit mode, upload immediately (existing behavior)
  }

  // Upload pending avatar after client creation
  private uploadPendingAvatar(clientId: number): void {
    if (this.pendingAvatarUpload) {
      this.imageUploadService.uploadAvatar(
        this.pendingAvatarUpload,
        'client',
        clientId,
        { fileType: 'avatar' }
      ).subscribe({
        next: (result) => {
          console.log('Avatar uploaded after client creation:', result);
          this.currentAvatar = result;
          this.clientStore.load();
          this.pendingAvatarUpload = null;
        },
        error: (error) => {
          console.error('Error uploading avatar after client creation:', error);
          this.notificationService.showError(
            NotificationSeverity.Error,
            `Error al subir avatar: ${error.message || error}`
          );
        }
      });
    }
  }
  
  // Manejar errores de upload
  onUploadError(error: string): void {
    console.error('Upload error:', error);
    this.notificationService.showError(
      NotificationSeverity.Error, 
      `Error al subir avatar: ${error}`
    );
  }

  // Maneja los clics del componente orb-form-footer
  handleFooterAction(action: string): void {
    if (action === 'save') {
      this.accept();
    } else if (action === 'cancel') {
      this.cancel.emit();
    }
  }
}
