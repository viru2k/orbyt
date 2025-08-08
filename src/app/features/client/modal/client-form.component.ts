import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// PrimeNG y Componentes Orb
import { OrbButtonComponent, OrbTextInputComponent, OrbFormFieldComponent, OrbFormFooterComponent, OrbSelectComponent, OrbDatepickerComponent, OrbTextAreaComponent } from '@orb-components';

// Store y DTOs
import { ClientStore } from '@orb-stores';
import { ClientResponseDto, CreateClientDto, UpdateClientDto } from '../../../api/model/models';

// Servicios y Modelos
import { NotificationService, UtilsService } from '@orb-services';
import { NotificationSeverity, FormButtonAction } from '@orb-models';

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
    OrbTextAreaComponent
  ],
  templateUrl: './client-form.component.html',
})
export class ClientFormComponent implements OnInit {
  @Input() client?: ClientResponseDto;
  @Output() saved = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private clientStore = inject(ClientStore);
  private notificationService = inject(NotificationService);
  public utilsService = inject(UtilsService); // Se hace público para el template

  form!: FormGroup;
  isEditMode = false;

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

  // Configuración para el pie de página del formulario
  footerActions: FormButtonAction[] = [
    { label: 'Cancelar', action: 'cancel', styleType: 'p-button-text' , severity: 'secondary'},
    { label: 'Guardar', action: 'save', styleType: 'p-button-success' , buttonType: 'submit' ,severity: 'info'},
  ];

  ngOnInit(): void {
    this.isEditMode = !!this.client;
    this.initForm();

    if (this.isEditMode && this.client) {
      this.form.patchValue(this.client);
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
    } else {
      const createDto: CreateClientDto = formValue;
      this.clientStore.create(createDto);
      this.notificationService.showSuccess(NotificationSeverity.Success, 'Cliente creado con éxito.');
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
