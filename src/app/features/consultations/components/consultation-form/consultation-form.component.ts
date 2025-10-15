import { Component, Input, Output, EventEmitter, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { AvatarModule } from 'primeng/avatar';
import {
  OrbButtonComponent,
  OrbFormFieldComponent,
  OrbTextInputComponent,
  OrbTextAreaComponent,
  OrbSelectComponent,
  OrbInputNumberComponent,
  OrbCheckboxComponent,
  OrbFullcalendarComponent
} from '@orb-components';
import { OrbDatepickerComponent } from '@orb-shared-components/orb-datepicker/orb-datepicker.component';
import { MessageService } from 'primeng/api';

import { ConsultationsService } from '../../../../api/services/consultations.service';
import { ClientsService } from '../../../../api/services/clients.service';
import { BusinessTypesService } from '../../../../api/services/business-types.service';
import { ConsultationTypesService } from '../../../../api/services/consultation-types.service';
import { AgendaService } from '../../../../api/services/agenda.service';
import { ConsultationResponseDto } from '../../../../api/models/consultation-response-dto';
import { ClientResponseDto } from '../../../../api/models/client-response-dto';
import { CreateConsultationDto } from '../../../../api/models/create-consultation-dto';
import { BusinessTypeResponseDto } from '../../../../api/models/business-type-response-dto';
import { ConsultationTypeResponseDto } from '../../../../api/models/consultation-type-response-dto';
import { ProductResponseDto } from '../../../../api/models/product-response-dto';
import { ServiceResponseDto } from '../../../../api/models/service-response-dto';
import { ItemSelectorResponseDto } from '../../../../api/models/item-selector-response-dto';
import { AppointmentResponseDto } from '../../../../api/models/appointment-response-dto';

// Import interfaces and configurations
import { BusinessTypeFormConfig, FormField, FormSection } from './interfaces/form-config.interface';
import { getBusinessTypeConfig } from './configs';

// Import search modals
import { ClientSearchModalComponent } from '../../../../shared/components/client-search-modal/client-search-modal.component';
import { ProductSearchModalComponent } from '../../../../shared/components/product-search-modal/product-search-modal.component';
import { ServiceSearchModalComponent } from '../../../../shared/components/service-search-modal/service-search-modal.component';

// Import date utilities
import {
  convertToDatetimeLocal,
  convertFromDatetimeLocal,
  calculateAge,
  formatDateForDisplay,
  formatDateTimeForDisplay,
  getCurrentDatetimeLocal
} from '../../../../shared/utils';

@Component({
  selector: 'app-consultation-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    AvatarModule,
    OrbButtonComponent,
    OrbFormFieldComponent,
    OrbTextInputComponent,
    OrbTextAreaComponent,
    OrbSelectComponent,
    OrbInputNumberComponent,
    OrbCheckboxComponent,
    OrbDatepickerComponent,
    ClientSearchModalComponent,
    ProductSearchModalComponent,
    ServiceSearchModalComponent
  ],
  templateUrl: './consultation-form.component.html',
  styleUrls: ['./consultation-form.component.scss']
})
export class ConsultationFormComponent implements OnInit {
  @Input() visible = false;
  @Input() consultation: ConsultationResponseDto | null = null;
  @Input() preSelectedAppointment: AppointmentResponseDto | null = null; // Datos desde agenda
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() consultationSaved = new EventEmitter<ConsultationResponseDto>();

  private _preSelectedClient: ClientResponseDto | null = null;

  @Input()
  set preSelectedClient(client: ClientResponseDto | null) {
    console.log('preSelectedClient setter called with:', client);
    this._preSelectedClient = client;
    if (client) {
      this.selectedClient.set(client);
      this.consultationForm.patchValue({
        clientId: client.id
      });
      console.log('Form clientId updated in setter to:', client.id);
    }
  }

  get preSelectedClient(): ClientResponseDto | null {
    return this._preSelectedClient;
  }

  consultationForm: FormGroup;
  clients = signal<ClientResponseDto[]>([]);
  consultationTypes = signal<ConsultationTypeResponseDto[]>([]);
  selectedConsultationType = signal<ConsultationTypeResponseDto | null>(null);
  selectedClient = signal<ClientResponseDto | null>(null);
  selectedProducts = signal<ProductResponseDto[]>([]);
  selectedServices = signal<ItemSelectorResponseDto[]>([]);
  selectedAppointment = signal<AppointmentResponseDto | null>(null);
  clientAppointments = signal<AppointmentResponseDto[]>([]);
  saving = signal(false);
  isEdit = false;

  // Modal states
  showClientSearchModal = signal(false);
  showProductSearchModal = signal(false);
  showServiceSearchModal = signal(false);
  showAppointmentModal = signal(false);

  // Computed para obtener la configuración dinámica basada en el tipo seleccionado
  currentFormConfig = computed(() => {
    const selectedType = this.selectedConsultationType();
    if (!selectedType) {
      // Por defecto usar hair_salon si no hay selección
      return getBusinessTypeConfig('hair_salon');
    }

    // Mapeo basado en businessTypeId
    const businessTypeIdToCodeMap: { [key: number]: string } = {
      1: 'psychology',
      2: 'veterinary',
      3: 'office',
      4: 'beauty',
      5: 'hair_salon',
      6: 'medical'
    };

    const businessTypeCode = businessTypeIdToCodeMap[selectedType.businessTypeId] || 'hair_salon';
    return getBusinessTypeConfig(businessTypeCode);
  });

  // Computed to know if we should show the client selection button
  shouldShowClientSelector = computed(() => {
    return !this.preSelectedClient && !this.selectedClient();
  });

  constructor(
    private fb: FormBuilder,
    private consultationsService: ConsultationsService,
    private clientsService: ClientsService,
    private businessTypesService: BusinessTypesService,
    private consultationTypesService: ConsultationTypesService,
    private agendaService: AgendaService,
    private messageService: MessageService
  ) {
    this.consultationForm = this.createForm();
  }

  ngOnInit() {
    console.log('ConsultationForm ngOnInit');
    console.log('preSelectedClient:', this.preSelectedClient);

    this.loadClients();
    this.loadConsultationTypes();

    // Note: preSelectedClient is now handled by the setter
    // This ensures it works even when set after component initialization

    // Handle pre-selected appointment from agenda
    if (this.preSelectedAppointment) {
      // Si hay cita desde agenda, cargar cliente y horarios
      if (this.preSelectedAppointment.client) {
        // Type conversion since AppointmentClientResponseDto has fewer properties than ClientResponseDto
        const clientFromAppointment = this.preSelectedAppointment.client as any as ClientResponseDto;
        this.selectedClient.set(clientFromAppointment);
        this.consultationForm.patchValue({
          clientId: this.preSelectedAppointment.client.id
        });
      }

      // Pre-cargar fechas desde la cita
      this.selectedAppointment.set(this.preSelectedAppointment);
      this.consultationForm.patchValue({
        startTime: new Date(this.preSelectedAppointment.start),
        endTime: this.preSelectedAppointment.end ? new Date(this.preSelectedAppointment.end) : null
      });
    }

    if (this.consultation) {
      this.isEdit = true;
      this.populateForm();
    } else if (!this.preSelectedAppointment) {
      // Solo establecer fechas por defecto si no viene de agenda
      this.setDefaultDateTimes();
    }
  }


  createForm(): FormGroup {
    const formConfig: { [key: string]: any } = {
      clientId: [null, Validators.required],
      consultationTypeId: [null, Validators.required]
    };

    // Add all possible dynamic fields
    const allFields = [
      'startTime', 'endTime', 'symptoms', 'temperature', 'bloodPressure', 'heartRate',
      'weight', 'height', 'diagnosis', 'treatment', 'recommendations', 'medications',
      'allergies', 'followUpRequired', 'followUpDate', 'notes'
    ];

    allFields.forEach(field => {
      if (field === 'followUpRequired') {
        formConfig[field] = [false];
      } else if (field === 'startTime') {
        formConfig[field] = ['', Validators.required];
      } else if (field === 'endTime') {
        formConfig[field] = ['', Validators.required];
      } else if (field === 'temperature' || field === 'heartRate' || field === 'weight' || field === 'height') {
        formConfig[field] = [null];
      } else if (field === 'followUpDate') {
        formConfig[field] = [null];
      } else {
        formConfig[field] = [''];
      }
    });

    const formGroup = this.fb.group(formConfig);

    // Add custom validator for date range
    formGroup.addValidators(this.dateRangeValidator);

    return formGroup;
  }

  loadClients() {
    this.clientsService.clientControllerFindAll().subscribe({
      next: (clients) => {
        this.clients.set(clients);
      },
      error: (error) => {
        console.error('Error loading clients:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al cargar la lista de clientes'
        });
      }
    });
  }

  loadConsultationTypes() {
    // Cargar todos los tipos de consulta usando el nuevo endpoint
    this.consultationTypesService.consultationTypeControllerFindAll().subscribe({
      next: (types) => {
        this.consultationTypes.set(types);
      },
      error: (error) => {
        console.error('Error loading consultation types:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al cargar los tipos de consulta'
        });
      }
    });
  }

  onConsultationTypeChange(event: any) {
    const selectedType = this.consultationTypes().find(t => t.id === event);
    this.selectedConsultationType.set(selectedType || null);

    // Aquí podríamos aplicar validaciones específicas basadas en el tipo
    if (selectedType) {
      this.applyTypeSpecificValidations(selectedType);
    }
  }

  private applyTypeSpecificValidations(type: ConsultationTypeResponseDto) {
    // Implementar validaciones específicas según el tipo de consulta
    // Por ejemplo, para veterinaria podrían ser obligatorios ciertos campos

    const formControls = this.consultationForm.controls;

    // Reset all validations first
    Object.keys(formControls).forEach(key => {
      if (key !== 'clientId' && key !== 'consultationTypeId') {
        formControls[key].clearValidators();
        formControls[key].updateValueAndValidity();
      }
    });

    // Apply specific validations based on required fields
    if (type.requiredFields) {
      type.requiredFields.forEach(fieldName => {
        if (formControls[fieldName]) {
          formControls[fieldName].setValidators([Validators.required]);
          formControls[fieldName].updateValueAndValidity();
        }
      });
    }
  }

  populateForm() {
    if (this.consultation) {
      // Convertir arrays de strings a strings separados por líneas
      const medications = Array.isArray(this.consultation.medications)
        ? this.consultation.medications.join('\n')
        : this.consultation.medications || '';

      const allergies = Array.isArray(this.consultation.allergies)
        ? this.consultation.allergies.join('\n')
        : this.consultation.allergies || '';

      this.consultationForm.patchValue({
        clientId: this.consultation.clientId,
        startTime: convertToDatetimeLocal(this.consultation.startTime),
        endTime: convertToDatetimeLocal(this.consultation.endTime),
        symptoms: this.consultation.symptoms,
        temperature: this.consultation.temperature,
        bloodPressure: this.consultation.bloodPressure,
        heartRate: this.consultation.heartRate,
        weight: this.consultation.weight,
        height: this.consultation.height,
        diagnosis: this.consultation.diagnosis,
        treatment: this.consultation.treatment,
        recommendations: this.consultation.recommendations,
        medications: medications,
        allergies: allergies,
        followUpRequired: this.consultation.followUpRequired,
        followUpDate: this.consultation.followUpDate ? new Date(this.consultation.followUpDate) : null,
        notes: this.consultation.notes
      });

      // Set selected client from consultation
      const consultation = this.consultation;
      if (consultation && consultation.clientId) {
        const client = this.clients().find(c => c.id === consultation.clientId);
        if (client) {
          this.selectedClient.set(client);
        }
      }
    }
  }

  onSubmit() {
    console.log('Form submission attempted');
    console.log('Form valid:', this.consultationForm.valid);
    console.log('Form errors:', this.consultationForm.errors);
    console.log('Form value:', this.consultationForm.value);

    // Log individual field validation status
    Object.keys(this.consultationForm.controls).forEach(key => {
      const control = this.consultationForm.get(key);
      if (control && control.invalid) {
        console.log(`Field '${key}' is invalid:`, control.errors);
      }
    });

    if (this.consultationForm.valid) {
      this.saving.set(true);

      const formValue = this.consultationForm.value;

      // Convertir strings de líneas a arrays
      const medications = formValue.medications
        ? formValue.medications.split('\n').filter((m: string) => m.trim())
        : [];

      const allergies = formValue.allergies
        ? formValue.allergies.split('\n').filter((a: string) => a.trim())
        : [];

      const consultationData: CreateConsultationDto = {
        ...formValue,
        medications,
        allergies,
        startTime: formValue.startTime instanceof Date ? formValue.startTime.toISOString() : formValue.startTime,
        endTime: formValue.endTime instanceof Date ? formValue.endTime.toISOString() : formValue.endTime,
        followUpDate: formValue.followUpDate instanceof Date ? formValue.followUpDate.toISOString() : formValue.followUpDate
      };

      const operation = this.isEdit && this.consultation
        ? this.consultationsService.consultationControllerUpdate({
            id: this.consultation.id,
            body: consultationData
          })
        : this.consultationsService.consultationControllerCreate({ body: consultationData });

      operation.subscribe({
        next: (result) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: `Consulta ${this.isEdit ? 'actualizada' : 'creada'} correctamente`
          });
          this.consultationSaved.emit(result);
          this.onCancel();
          this.saving.set(false);
        },
        error: (error) => {
          console.error('Error saving consultation:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Error al ${this.isEdit ? 'actualizar' : 'crear'} la consulta`
          });
          this.saving.set(false);
        }
      });
    }
  }

  onCancel() {
    this.visible = false;
    this.visibleChange.emit(false);
    this.consultationForm.reset();
    this.isEdit = false;
    this.consultation = null;

    // Only clear selected client if we don't have a pre-selected client
    if (!this.preSelectedClient) {
      this.selectedClient.set(null);
    } else {
      // Restore the pre-selected client
      this.selectedClient.set(this.preSelectedClient);
      this.consultationForm.patchValue({
        clientId: this.preSelectedClient.id
      });
    }

    this.selectedProducts.set([]);
    this.selectedServices.set([]);
  }

  // Client search modal methods
  openClientSearchModal() {
    this.showClientSearchModal.set(true);
  }

  onClientSelected(client: ClientResponseDto) {
    console.log('Client selected:', client);
    this.selectedClient.set(client);
    this.consultationForm.patchValue({
      clientId: client.id
    });
    console.log('Form clientId updated to:', client.id);
    this.showClientSearchModal.set(false);
  }

  onClientSearchModalClose() {
    this.showClientSearchModal.set(false);
  }

  clearClient() {
    // Limpiar cliente seleccionado
    this.selectedClient.set(null);
    this.consultationForm.patchValue({
      clientId: null
    });

    // Limpiar arrays de consultas relacionadas
    this.clientAppointments.set([]);
    this.selectedAppointment.set(null);

    // Limpiar productos y servicios seleccionados
    this.selectedProducts.set([]);
    this.selectedServices.set([]);

    console.log('Client cleared, form reset to initial state');
  }

  get selectedClientDisplayName(): string {
    const client = this.selectedClient();
    if (!client) return '';

    if (client.fullname) return client.fullname;
    if (client.name && client.lastName) {
      return `${client.name} ${client.lastName}`;
    }
    if (client.name) return client.name;
    if (client.email) return client.email;
    return 'Cliente seleccionado';
  }

  // Product search modal methods
  openProductSearchModal() {
    this.showProductSearchModal.set(true);
  }

  onProductSelected(product: ProductResponseDto) {
    const currentProducts = this.selectedProducts();
    const exists = currentProducts.find(p => p.id === product.id);

    if (!exists) {
      this.selectedProducts.set([...currentProducts, product]);
    }
    this.showProductSearchModal.set(false);
  }

  onProductSearchModalClose() {
    this.showProductSearchModal.set(false);
  }

  removeProduct(productId: number) {
    const currentProducts = this.selectedProducts();
    this.selectedProducts.set(currentProducts.filter(p => p.id !== productId));
  }

  // Service search modal methods
  openServiceSearchModal() {
    this.showServiceSearchModal.set(true);
  }

  onServiceSelected(service: ItemSelectorResponseDto) {
    const currentServices = this.selectedServices();
    const exists = currentServices.find(s => s.id === service.id);

    if (!exists) {
      this.selectedServices.set([...currentServices, service]);

      // Si el servicio tiene duración definida, mostrar notificación para ajustar
      if (service.duration && service.duration > 0) {
        this.showServiceDurationNotification(service.name || 'el servicio', service.duration);

        // Auto-ajustar si es el primer servicio y no hay fechas manuales
        const hasManualTimes = this.consultationForm.get('startTime')?.dirty || this.consultationForm.get('endTime')?.dirty;
        if (currentServices.length === 0 && !hasManualTimes) {
          // Mostrar confirmación antes de auto-ajustar
          this.messageService.add({
            severity: 'success',
            summary: 'Ajuste Automático',
            detail: `Se aplicará automáticamente la duración del servicio (${service.duration} min) en 3 segundos...`,
            life: 3000,
            key: 'auto-apply'
          });

          setTimeout(() => {
            this.adjustTimeForService(service.duration!);
          }, 3000);
        }
      }
    }
    this.showServiceSearchModal.set(false);
  }

  onServiceSearchModalClose() {
    this.showServiceSearchModal.set(false);
  }

  removeService(serviceId: number) {
    const currentServices = this.selectedServices();
    this.selectedServices.set(currentServices.filter(s => s.id === serviceId ? false : true));
  }

  // Appointment selection methods
  openAppointmentModal() {
    const client = this.selectedClient();
    if (client) {
      this.loadClientAppointments(client.id);
      this.showAppointmentModal.set(true);
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Cliente Requerido',
        detail: 'Primero debe seleccionar un cliente para ver sus citas'
      });
    }
  }

  loadClientAppointments(clientId: number) {
    // Load appointments for the selected client
    this.agendaService.agendaControllerGetAppointments({
      // Add any parameters needed to filter by client
      // This might need to be adjusted based on the actual API
    }).subscribe({
      next: (appointments) => {
        // Filter by client if the API doesn't support client filtering
        const clientAppointments = appointments.filter(app =>
          app.client?.id === clientId &&
          app.status !== 'cancelled' &&
          app.status !== 'no_show'
        );
        this.clientAppointments.set(clientAppointments);
      },
      error: (error) => {
        console.error('Error loading client appointments:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al cargar las citas del cliente'
        });
      }
    });
  }

  onAppointmentSelected(appointment: AppointmentResponseDto) {
    this.selectedAppointment.set(appointment);

    // Convert dates to datetime-local format for form inputs
    this.consultationForm.patchValue({
      startTime: convertToDatetimeLocal(appointment.start),
      endTime: convertToDatetimeLocal(appointment.end)
    });

    this.showAppointmentModal.set(false);

    this.messageService.add({
      severity: 'success',
      summary: 'Cita Seleccionada',
      detail: `Fechas y horarios cargados desde la cita del ${formatDateForDisplay(appointment.start)}`
    });
  }

  onAppointmentModalClose() {
    this.showAppointmentModal.set(false);
  }

  getSelectedAppointmentInfo(): string {
    const appointment = this.selectedAppointment();
    if (!appointment) return '';

    const startDate = new Date(appointment.start);
    const endDate = appointment.end ? new Date(appointment.end) : null;

    let info = startDate.toLocaleDateString('es-ES') + ' (' + startDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    if (endDate) {
      info += ' - ' + endDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }
    info += ')';

    return info;
  }

  clearSelectedAppointment() {
    this.selectedAppointment.set(null);
    this.consultationForm.patchValue({
      startTime: '',
      endTime: ''
    });
  }

  getAppointmentStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      cancelled: 'Cancelada',
      checked_in: 'Registrado',
      in_progress: 'En Progreso',
      completed: 'Completada',
      no_show: 'No Asistió'
    };
    return statusMap[status] || status;
  }

  formatAppointmentDate(dateString: string): string {
    return formatDateForDisplay(dateString, 'es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  formatAppointmentTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  getPatientAge(birthDate: string): string {
    return calculateAge(birthDate).toString();
  }

  /**
   * Formatea una fecha para mostrarla en la interfaz
   */
  formatDisplayTime(dateValue: any): string {
    if (!dateValue) return '';

    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
    return date.toLocaleDateString('es-ES') + ' ' + date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Validador personalizado para el rango de fechas
   * Verifica que la fecha de fin sea posterior a la fecha de inicio
   */
  dateRangeValidator = (control: any) => {
    const formGroup = control as FormGroup;
    const startTime = formGroup.get('startTime')?.value;
    const endTime = formGroup.get('endTime')?.value;

    // No validar si alguno de los campos está vacío
    if (!startTime || !endTime) {
      return null;
    }

    try {
      // Asegurar que ambos sean objetos Date válidos
      const startDate = startTime instanceof Date ? startTime : new Date(startTime);
      const endDate = endTime instanceof Date ? endTime : new Date(endTime);

      // Verificar que las fechas son válidas
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return null; // No validar si las fechas no son válidas
      }

      if (endDate <= startDate) {
        return { dateRangeInvalid: true };
      }
    } catch (error) {
      console.error('Error in date range validator:', error);
      return null; // No validar si hay error de conversión
    }

    return null;
  };

  /**
   * Establece fechas y horas por defecto para nuevas consultas
   * Hora actual + 1 hora de duración por defecto
   */
  setDefaultDateTimes() {
    const now = new Date();
    // Agregar 1 hora por defecto
    const endDate = new Date(now.getTime() + (60 * 60 * 1000)); // +1 hora

    this.consultationForm.patchValue({
      startTime: now,
      endTime: endDate
    });
  }

  /**
   * Ajusta las fechas basado en la duración del servicio seleccionado
   */
  adjustTimeForService(serviceDurationMinutes: number) {
    const startTime = this.consultationForm.get('startTime')?.value;
    if (!startTime) {
      this.setDefaultDateTimes();
      return;
    }

    const startDate = startTime instanceof Date ? startTime : new Date(startTime);
    const endDate = new Date(startDate.getTime() + (serviceDurationMinutes * 60 * 1000));

    this.consultationForm.patchValue({
      endTime: endDate
    });

    // Limpiar notificaciones anteriores
    this.messageService.clear('service-duration');
    this.messageService.clear('auto-adjust');

    this.messageService.add({
      severity: 'info',
      summary: 'Duración Ajustada',
      detail: `El horario se ajustó según la duración del servicio (${serviceDurationMinutes} minutos)`
    });
  }

  /**
   * Aplica duración de servicio manualmente
   */
  applyServiceDuration(durationMinutes: number) {
    this.adjustTimeForService(durationMinutes);
  }

  /**
   * Muestra notificación para ajustar el tiempo según el servicio
   */
  showServiceDurationNotification(serviceName: string, durationMinutes: number) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Ajustar Duración',
      detail: `El servicio "${serviceName}" tiene una duración de ${durationMinutes} minutos. Puedes ajustar manualmente el horario de finalización o usar el botón "Ajustar" en la notificación.`,
      sticky: true,
      closable: true,
      key: 'service-duration',
      data: { serviceName, durationMinutes }
    });

    // Agregar botón de acción para ajustar automáticamente
    setTimeout(() => {
      this.messageService.add({
        severity: 'info',
        summary: 'Ajuste Automático',
        detail: `Haz clic aquí para ajustar automáticamente la duración a ${durationMinutes} minutos`,
        life: 10000,
        key: 'auto-adjust',
        data: { durationMinutes }
      });
    }, 1500);
  }

}