import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// PrimeNG y Componentes Orb
import { CheckboxModule } from 'primeng/checkbox';
import { OrbButtonComponent, OrbTextInputComponent, OrbFormFieldComponent, OrbFormFooterComponent, OrbCheckboxComponent, OrbEntityAvatarComponent, OrbSelectComponent } from '@orb-components';
import { OrbCardComponent } from '@orb-shared-components/application/orb-card/orb-card.component';

// Store y DTOs
import { UsersStore } from '@orb-stores';
import { UserResponseDto, AdminUpdateUserDto, RoleDto, CreateSubUserDto, RoleResponseDto } from '../../../api/model/models';
import { FileUploadResponseDto } from '../../../api/models/file-upload-response-dto';
import { AvatarEntity } from '../../../shared/models/entity-avatar.interfaces';



// Servicios y Modelos
import { NotificationService } from '@orb-services';
import { NotificationSeverity, FormButtonAction } from '@orb-models';
import { ImageUploadService } from '../../../shared/services/image-upload.service';
import { InputNumberModule } from 'primeng/inputnumber';

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
     InputNumberModule,
    OrbSelectComponent
  ],
  templateUrl: './room-edit-form.component.html',
  styleUrls: ['./room-edit-form.component.scss'],
})
export class RoomEditFormComponent implements OnInit {
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
  currentAvatar: FileUploadResponseDto | null = null;

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
      buttonType: 'submit'
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

      this.usersStore.updateUser({ userId: this.user.id, updateData: updateDto });
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
    }

    this.saved.emit();
  }

  // Manejar la carga de avatar
  onAvatarUploaded(result: any): void {    
    this.currentAvatar = result;
    
    // Recargar los usuarios para reflejar el cambio
    this.usersStore.loadUsers();
  }
  
  // Manejar la eliminación de avatar
  onAvatarDeleted(): void {
    this.currentAvatar = null;
    this.notificationService.show(
      NotificationSeverity.Success, 
      'Avatar eliminado correctamente'
    );
    
    // Recargar los usuarios para reflejar el cambio
    this.usersStore.loadUsers();
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