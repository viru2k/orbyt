import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// PrimeNG y Componentes Orb
import { CheckboxModule } from 'primeng/checkbox';
import { OrbButtonComponent, OrbTextInputComponent, OrbFormFieldComponent, OrbFormFooterComponent, OrbCheckboxComponent, OrbEntityAvatarComponent, OrbSelectComponent } from '@orb-components';
import { OrbCardComponent } from '@orb-shared-components/application/orb-card/orb-card.component';

// Store y DTOs
import { UsersStore } from '@orb-stores';
import { UserResponseDto, AdminUpdateUserDto, RoleDto, CreateSubUserDto, RoleResponseDto } from '../../../api/models';
import { AvatarDto } from '../../../api/models/avatar-dto';
import { AvatarEntity } from '../../../shared/models/entity-avatar.interfaces';

// Interfaces temporales hasta que se actualicen los DTOs generados
interface ExtendedCreateSubUserDto {
  email: string;
  password: string;
  fullName?: string;
  isActive?: boolean;
  isAdmin?: boolean;
  roles?: RoleResponseDto[];
}

interface ExtendedAdminUpdateUserDto {
  email?: string;
  fullName?: string;
  isActive?: boolean;
  isAdmin?: boolean;
  roles?: RoleResponseDto[];
  avatarUrl?: string;
}

// Servicios y Modelos
import { NotificationService } from '@orb-services';
import { NotificationSeverity, FormButtonAction } from '@orb-models';
import { ImageUploadService } from '../../../shared/services/image-upload.service';

@Component({
  selector: 'app-user-edit-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    CheckboxModule,
    OrbTextInputComponent,
    OrbFormFieldComponent,
    OrbFormFooterComponent,
    OrbCardComponent,
    OrbCheckboxComponent,
    OrbEntityAvatarComponent,
    OrbSelectComponent,
    OrbCheckboxComponent
  ],
  templateUrl: './user-edit-form.component.html',
  styleUrls: ['./user-edit-form.component.scss'],
})
export class UserEditFormComponent implements OnInit {
  @Input() user?: UserResponseDto;
  @Output() saved = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private usersStore = inject(UsersStore);
  private notificationService = inject(NotificationService);
  private imageUploadService = inject(ImageUploadService);

  form!: FormGroup;
  availableRoles$ = this.usersStore.roles$;
  loading$ = this.usersStore.loading$;
  isEditMode: boolean = false;
  pizza: string[] = [];
  selectedRoles: number[] = [];
  currentUserEntity: AvatarEntity | null = null;
  currentAvatar: AvatarDto | null = null;
  private pendingAvatarUpload: File | null = null;

  statusOptions = [
    { label: 'Activo', value: true },
    { label: 'Inactivo', value: false }
  ];

  footerButtons: FormButtonAction[] = [
    {
      label: 'Cancelar',
      action: 'cancel',
      severity: 'secondary',
      styleType: 'text'
    },
    {
      label: 'Guardar',
      action: 'save',
      severity: 'success',
      buttonType: 'submit',
      outlined: true
    }
  ];


  ngOnInit(): void {
    this.isEditMode = !!this.user;
    this.initForm();
    this.usersStore.loadRoles(); // Cargar roles disponibles

    if (this.user) {
      const userRoles = this.user.roles?.map(role => role.id) || [];
      this.form.patchValue({
        fullName: this.user.fullName,
        email: this.user.email,
        isActive: this.user.active,
        isAdmin: this.user.isAdmin,
        roles: userRoles
      });
      this.selectedRoles = [...userRoles]; // Sincronizar con selectedRoles
      this.currentUserEntity = { ...this.user };
      this.currentAvatar = this.user.avatar || null;
    } else {
      // Para modo creación, crear una entidad temporal
      this.currentUserEntity = {
        id: 0, // ID temporal para nuevo usuario
        fullName: '',
        email: '',
        active: true,
        isAdmin: false,
        roles: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as UserResponseDto;
    }
  }

  private initForm(): void {
    const formConfig: any = {
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      isActive: [true, Validators.required],
      isAdmin: [false],
      roles: [[]]
    };

    // Solo agregar password si es creación
    if (!this.isEditMode) {
      formConfig.password = ['', [Validators.required, Validators.minLength(6)]];
    }

    this.form = this.fb.group(formConfig);
  }

  isRoleSelected(roleId: number): boolean {
    return this.selectedRoles.includes(roleId);
  }

  onRolesChange(selectedRoles: number[]): void {
    // Sincronizar con el FormControl
    this.form.get('roles')?.setValue(selectedRoles);    
  }
  
  // Se llama con (ngSubmit) o desde el footer
  accept(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notificationService.show(NotificationSeverity.Warn, 'Por favor, completa todos los campos requeridos.');
      return;
    }

    const formValue = this.form.getRawValue();

    if (this.isEditMode) {
      // MODO EDICIÓN
      if (!this.user?.id) {
        this.notificationService.show(NotificationSeverity.Error, 'Error: ID de usuario no encontrado.');
        return;
      }

      // Obtener los roles completos basados en los IDs seleccionados
      const selectedRoleIds: number[] = this.selectedRoles;
      let selectedRolesFull: RoleResponseDto[] = [];

      this.usersStore.roles$.subscribe(roles => {
        selectedRolesFull = roles.filter(role => selectedRoleIds.includes(role.id));
      }).unsubscribe();

      const updateDto: ExtendedAdminUpdateUserDto = {
        email: formValue.email,
        fullName: formValue.fullName,
        isActive: formValue.isActive,
        isAdmin: formValue.isAdmin,
        roles: selectedRolesFull
      };

      this.usersStore.updateUser({ id: this.user.id, userData: updateDto });
      this.saved.emit();
    } else {
      // MODO CREACIÓN
      // Obtener los roles completos para crear
      const selectedRoleIds: number[] = this.selectedRoles;
      let selectedRolesFull: RoleResponseDto[] = [];

      this.usersStore.roles$.subscribe(roles => {
        selectedRolesFull = roles.filter(role => selectedRoleIds.includes(role.id));
      }).unsubscribe();

      const createDto: ExtendedCreateSubUserDto = {
        email: formValue.email,
        password: formValue.password,
        fullName: formValue.fullName,
        isActive: formValue.isActive,
        isAdmin: formValue.isAdmin,
        roles: selectedRolesFull
      };

      this.usersStore.createUser(createDto);

      // Si hay avatar pendiente, esperar a que se cree el usuario
      if (this.pendingAvatarUpload) {
        // Esperar un momento para que el store se actualice
        setTimeout(() => {
          this.usersStore.groupUsers$.pipe().subscribe((users: UserResponseDto[]) => {
            if (users.length > 0) {
              const latestUser = users[users.length - 1];

              // Subir avatar con el ID del usuario creado
              this.imageUploadService.uploadAvatar(
                this.pendingAvatarUpload!,
                'user',
                latestUser.id,
                { fileType: 'avatar' }
              ).subscribe({
                next: (result) => {
                  console.log('Avatar uploaded after user creation:', result);

                  // Actualizar el usuario con el avatarUrl
                  if (result?.url) {
                    const updateDto: ExtendedAdminUpdateUserDto = {
                      avatarUrl: result.url
                    };
                    this.usersStore.updateUser({ id: latestUser.id, userData: updateDto });
                  }

                  this.currentAvatar = result;
                  this.pendingAvatarUpload = null;
                },
                error: (error) => {
                  console.error('Error uploading avatar after user creation:', error);
                  this.notificationService.show(
                    NotificationSeverity.Error,
                    `Error al subir avatar: ${error.message || error}`
                  );
                }
              });
            }
          }).unsubscribe();
        }, 500);
      }

      this.saved.emit();
    }
  }

  // Manejar la carga de avatar
  onAvatarUploaded(result: any): void {
    this.currentAvatar = result;

    // Si estamos en modo edición, actualizar el usuario con el avatarUrl
    if (this.isEditMode && this.user?.id && result?.url) {
      const avatarUrl = result.url;
      const updateDto: ExtendedAdminUpdateUserDto = {
        avatarUrl: avatarUrl
      };

      this.usersStore.updateUser({ id: this.user.id, userData: updateDto });
    }

    // Recargar los usuarios para reflejar el cambio
    this.usersStore.loadGroupUsers();
  }
  
  // Manejar la eliminación de avatar
  onAvatarDeleted(): void {
    this.currentAvatar = null;
    this.notificationService.show(
      NotificationSeverity.Success, 
      'Avatar eliminado correctamente'
    );
    
    // Recargar los usuarios para reflejar el cambio
    this.usersStore.loadGroupUsers();
  }

  // Handle file selection (before upload)
  onAvatarFileSelected(file: File): void {
    if (!this.isEditMode) {
      // In create mode, store the file for later upload
      this.pendingAvatarUpload = file;
    }
    // In edit mode, upload immediately (existing behavior)
  }

  // Manejar errores de upload
  onUploadError(error: string): void {
    console.error('Upload error:', error);
    this.notificationService.show(
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