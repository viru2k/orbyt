import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// PrimeNG y Componentes Orb
import { CheckboxModule } from 'primeng/checkbox';
import { OrbButtonComponent, OrbTextInputComponent, OrbFormFieldComponent, OrbFormFooterComponent, OrbCheckboxComponent } from '@orb-components';
import { OrbCardComponent } from '@orb-shared-components/application/orb-card/orb-card.component';

// Store y DTOs
import { UsersStore } from '@orb-stores';
import { UserResponseDto, AdminUpdateUserDto, RoleDto, CreateSubUserDto, RoleResponseDto } from '../../../api/model/models';

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
}

// Servicios y Modelos
import { NotificationService } from '@orb-services';
import { NotificationSeverity, FormButtonAction } from '@orb-models';

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

  form!: FormGroup;
  availableRoles$ = this.usersStore.roles$;
  loading$ = this.usersStore.loading$;
  isEditMode: boolean = false;
  pizza: string[] = [];
  selectedRoles: number[] = [];

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
    console.log('Roles seleccionados:', selectedRoles);
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

  // Maneja los clics del componente orb-form-footer
  handleFooterAction(action: string): void {
    if (action === 'save') {
      this.accept();
    } else if (action === 'cancel') {
      this.cancel.emit();
    }
  }
}