import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// PrimeNG y Componentes Orb
import { OrbButtonComponent, OrbTextInputComponent, OrbFormFieldComponent, OrbFormFooterComponent } from '@orb-components';
import { OrbCardComponent } from '@orb-shared-components/application/orb-card/orb-card.component';
import { CheckboxModule } from 'primeng/checkbox';

// Store y DTOs
import { UsersStore } from '@orb-stores';
import { UserResponseDto, AdminUpdateUserDto, RoleDto } from '../../../api/model/models';

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
    OrbTextInputComponent,
    OrbFormFieldComponent,
    OrbFormFooterComponent,
    OrbCardComponent,
    CheckboxModule
  ],
  templateUrl: './user-edit-form.component.html',
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
    this.initForm();
    this.usersStore.loadRoles(); // Cargar roles disponibles
    
    if (this.user) {
      this.form.patchValue({
        fullName: this.user.fullName,
        isActive: this.user.active,
        roles: this.user.roles?.map(role => role.id) || []
      });
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      fullName: ['', Validators.required],
      isActive: [true, Validators.required],
      roles: [[], Validators.required]
    });
  }

  isRoleSelected(roleId: number): boolean {
    const selectedRoles = this.form.get('roles')?.value || [];
    return selectedRoles.includes(roleId);
  }

  onRoleChange(roleId: number, event: any): void {
    const selectedRoles = this.form.get('roles')?.value || [];
    
    if (event.checked) {
      // Añadir el rol si no está presente
      if (!selectedRoles.includes(roleId)) {
        selectedRoles.push(roleId);
      }
    } else {
      // Remover el rol si está presente
      const index = selectedRoles.indexOf(roleId);
      if (index > -1) {
        selectedRoles.splice(index, 1);
      }
    }
    
    this.form.get('roles')?.setValue(selectedRoles);
  }
  
  // Se llama con (ngSubmit) o desde el footer
  accept(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notificationService.show(NotificationSeverity.Warn, 'Por favor, completa todos los campos requeridos.');
      return;
    }

    if (!this.user?.id) {
      this.notificationService.show(NotificationSeverity.Error, 'Error: ID de usuario no encontrado.');
      return;
    }

    // Preparar los datos para la actualización
    const formValue = this.form.getRawValue();
    
    // Obtener los roles completos basados en los IDs seleccionados
    const selectedRoleIds: number[] = formValue.roles;
    let selectedRoles: RoleDto[] = [];
    
    this.usersStore.roles$.subscribe(roles => {
      selectedRoles = roles.filter(role => selectedRoleIds.includes(role.id));
    }).unsubscribe();

    const updateDto: AdminUpdateUserDto = {
      fullName: formValue.fullName,
      isActive: formValue.isActive,
      roles: selectedRoles
    };

    this.usersStore.updateUser({ userId: this.user.id, updateData: updateDto });
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