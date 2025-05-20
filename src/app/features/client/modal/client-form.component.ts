
// src/app/features/crm/client/modal/client-form.component.ts
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// PrimeNG Modules & Orb Components (ajusta según tu HTML final para el client form)
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { ButtonModule } from 'primeng/button'; // Asumo que usarás p-button o tu orb-button
import { OrbButtonComponent, OrbDatepickerComponent, OrbFormFieldComponent, OrbFormFooterComponent, OrbSelectComponent,  OrbTextAreaComponent,  OrbTextInputComponent } from '@orb-components'; // Si usas OrbFormField

// Store, DTOs
import { ClientStore } from '@orb-stores';
import { ClientResponseDto, CreateClientDto, UpdateClientDto } from '@orb-api/index';
import { GenderOption, StatusOption,FormButtonAction } from '@orb-models';
import { UtilsService } from '@orb-services';
// NotificationService no se usa aquí si el store lo maneja, o si no hay notificaciones directas desde el form.

// Tipos para los dropdowns (pueden ir en un archivo de tipos si se reutilizan)


@Component({
  selector: 'app-client-form', // Mantener el selector que habíamos definido
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    OrbTextAreaComponent,
    DropdownModule,
    CalendarModule,
    ButtonModule, 
    OrbFormFieldComponent, 
     OrbTextInputComponent,
     OrbFormFooterComponent,
     OrbSelectComponent, OrbDatepickerComponent
  ],
  templateUrl: './client-form.component.html', // Crearemos este template
  styleUrls: ['./client-form.component.scss']
})
export class ClientFormComponent implements OnInit {
  @Input() client?: ClientResponseDto = undefined; // Recibe el objeto cliente completo para edición
  @Output() saved = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private clientStore = inject(ClientStore); 
  public utilsService = inject(UtilsService);
   public footerActions: FormButtonAction[] = [];
  // isLoading se podría obtener del store si los botones necesitan mostrar un estado de carga
  // isLoading = this.store.isLoading; // Ejemplo

  form!: FormGroup; // Se inicializará en el constructor o ngOnInit

  genderOptions: GenderOption[] = [
    { label: 'Masculino', value: CreateClientDto.GenderEnum.Male },
    { label: 'Femenino', value: CreateClientDto.GenderEnum.Female },
    { label: 'Otro', value: CreateClientDto.GenderEnum.Other },
  ];

  statusOptions: StatusOption[] = [
    { label: 'Activo', value: CreateClientDto.StatusEnum.Active },
    { label: 'Inactivo', value: CreateClientDto.StatusEnum.Inactive },
    { label: 'Creado', value: CreateClientDto.StatusEnum.Created },
  ];

  constructor() {
    this.form = this.fb.group({
      // Los campos deben coincidir con CreateClientDto y UpdateClientDto,
      // y ser compatibles con ClientResponseDto para patchValue.
      fullname: ['', Validators.required],
      name: ['', Validators.required],
      lastName: ['', Validators.required],
      address: [''],
      email: ['', [Validators.email]],
      phone: [''],
      gender: [null as CreateClientDto.GenderEnum | null], // Tipado explícito para el valor inicial
      birthDate: [null as Date | null], // pCalendar trabajará con Date
      status: [CreateClientDto.StatusEnum.Active, Validators.required], // Valor por defecto
      notes: [''],
    });
  }

  ngOnInit() {
     this.setupFooterActions();
    if (this.client) {
      // Si hay un cliente, estamos en modo edición.
      // Mapeamos ClientResponseDto a los campos del formulario.
      this.form.patchValue({
        ...this.client,
        // pCalendar espera un objeto Date. ClientResponseDto.birthDate es string.
        birthDate: this.client.birthDate ? new Date(this.client.birthDate) : null,
        // Asegurarse de que el status del response sea compatible con el enum del form si es necesario
        status: this.client.status as CreateClientDto.StatusEnum,
        gender: this.client.gender as CreateClientDto.GenderEnum | null
      });
    } else {
      // Modo creación, se podrían poner valores por defecto si no se hizo en la definición del form.
      // this.form.reset({ status: CreateClientDto.StatusEnum.Active }); // Ejemplo
    }
  }

  accept() {
    if (this.form.invalid) {
      // Opcional: Marcar campos como tocados para mostrar errores
      Object.values(this.form.controls).forEach(control => control.markAsTouched());
      // this.notificationService.showError('Formulario inválido'); // Si el form debe notificar
      return;
    }

    const formValues = this.form.value;

    // Preparar el DTO
    const clientData = {
      fullname: formValues.fullname,
      name: formValues.name,
      lastName: formValues.lastName,
      address: formValues.address || undefined, // Enviar undefined si está vacío para campos opcionales
      email: formValues.email || undefined,
      phone: formValues.phone || undefined,
      gender: formValues.gender || undefined,
      birthDate: formValues.birthDate
        ? (formValues.birthDate as Date).toISOString().split('T')[0] // Formato YYYY-MM-DD
        : undefined,
      status: formValues.status, // Status es requerido en CreateClientDto
      notes: formValues.notes || undefined,
    };

    if (this.client && this.client.id !== undefined) { // Modo edición si hay this.client con id
      const updateDto: UpdateClientDto = clientData; // UpdateClientDto tiene todos los campos opcionales
      this.clientStore.updateClient({ id: this.client.id, updateDto });
      this.clientStore
    } else { // Modo creación
      const createDto: CreateClientDto = {
        ...clientData,
        status: formValues.status || CreateClientDto.StatusEnum.Created, // Asegurar que status tiene un valor válido para creación
      };
      this.clientStore.createClient(createDto);
    }
    this.saved.emit(); // Emitir evento para que el padre cierre el modal y recargue
  }

  cancelForm() {
    this.cancel.emit(); // Emitir evento para que el padre cierre el modal
  }

   private setupFooterActions(): void {
    this.footerActions = [
      {
        label: 'Cancelar',
        action: 'cancel', 
        styleType: 'text',
        severity: 'secondary',
        buttonType: 'button'
      },
      {
        label: this.client?.id ? 'Guardar Cambios' : 'Crear Cliente',
        action: 'submit', 
        severity: 'info',
        buttonType: 'submit', 
      }
    ];
  }
  handleFooterAction(action: string): void {
    if (action === 'cancel') {
      this.cancelForm();
    } else if (action === 'submit') {
   
    }
  }

}