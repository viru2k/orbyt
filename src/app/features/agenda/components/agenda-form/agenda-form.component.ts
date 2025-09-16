

import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppointmentResponseDto, CreateAppointmentDto, UpdateAppointmentDto } from '../../../../api/models';
import { AgendaStore } from '../../../../store/agenda/agenda.store';
import { ClientResponseDto, UserResponseDto } from '../../../../api/models';
import { ItemSelectorResponseDto } from '../../../../api/models/item-selector-response-dto';
import { ClientsService } from '../../../../api/services/clients.service';
import { UsersService } from '../../../../api/services/users.service';
import { ServicesService } from '../../../../api/services/services.service';
import { Observable, of, debounceTime, distinctUntilChanged, map, take } from 'rxjs';
import { OrbButtonComponent, OrbDatepickerComponent, OrbFormFieldComponent, OrbSelectComponent, OrbTextAreaComponent, OrbTextInputComponent, OrbEntityAvatarComponent } from '@orb-components';
import { ClientSearchModalComponent } from '../../../../shared/components/client-search-modal/client-search-modal.component';
import { ServiceSearchModalComponent } from '../../../../shared/components/service-search-modal/service-search-modal.component';
import { MessageModule } from 'primeng/message';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AppointmentStatus } from '../../../../api/model/appointment-status.enum';
import { Router } from '@angular/router';

@Component({
  selector: 'app-agenda-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    OrbFormFieldComponent,
    OrbTextInputComponent,
    OrbDatepickerComponent,
    OrbSelectComponent,
    OrbTextAreaComponent,
    OrbButtonComponent,
    OrbEntityAvatarComponent,
    MessageModule,
    ConfirmDialogModule,
    ToastModule,
    ClientSearchModalComponent,
    ServiceSearchModalComponent,
  ],
  providers: [
    ConfirmationService,
    MessageService
  ],
  templateUrl: './agenda-form.component.html',
  styleUrls: ['./agenda-form.component.scss'],
})
export class AgendaFormComponent implements OnChanges {
  @Input() appointment: AppointmentResponseDto | null = null;
  @Input() initialDate: string | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() delete = new EventEmitter<string>();

  agendaForm: FormGroup;
  clients$: Observable<ClientResponseDto[]> = of([]);
  professionals$: Observable<UserResponseDto[]> = of([]);
  services$: Observable<any[]> = of([]);
  rooms$: Observable<any[]> = of([]);
  selectedProfessionalId: number | null = null;

  // Estado para los modales y selecciones
  showClientSearchModal = false;
  showServiceSearchModal = false;
  selectedClient: ClientResponseDto | null = null;
  selectedService: ItemSelectorResponseDto | null = null;

  statusOptions = [
    { label: 'Pendiente', value: AppointmentStatus.PENDING },
    { label: 'Confirmada', value: AppointmentStatus.CONFIRMED },
    { label: 'Registrado', value: AppointmentStatus.CHECKED_IN },
    { label: 'En Progreso', value: AppointmentStatus.IN_PROGRESS },
    { label: 'Completada', value: AppointmentStatus.COMPLETED },
    { label: 'Cancelada', value: AppointmentStatus.CANCELLED },
    { label: 'No Asistió', value: AppointmentStatus.NO_SHOW }
  ];

  // Validación de disponibilidad
  availabilityMessage: { severity: 'success' | 'info' | 'warn' | 'error', text: string } | null = null;
  private availabilityCheckTimeout: any;

  constructor(
    private fb: FormBuilder,
    public agendaStore: AgendaStore,
    private clientsService: ClientsService,
    private userService: UsersService,
    private servicesService: ServicesService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private translate: TranslateService,
    private router: Router
  ) {
    this.agendaForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      startDateTime: [null, Validators.required],
      endDateTime: [null, Validators.required],
      clientId: [null, Validators.required],
      professionalId: [null, Validators.required],
      serviceId: [null],
      roomId: [null],
      status: [null, Validators.required],
    });

    // Cargar profesionales del grupo
    this.professionals$ = this.userService.userControllerGetGroupUsers();
    this.services$ = of([]);  // TODO: Implement services API
    
    // Load rooms data (mock for now until API is implemented)
    this.rooms$ = of([
      { id: 1, name: 'Sala de Consulta 1', description: 'Sala principal para consultas generales', isActive: true },
      { id: 2, name: 'Sala de Procedimientos', description: 'Sala equipada para procedimientos médicos', isActive: true },
      { id: 3, name: 'Sala de Reuniones', description: 'Sala para reuniones y capacitaciones', isActive: false }
    ]);
    
    // Escuchar cambios en el profesional seleccionado
    this.agendaForm.get('professionalId')?.valueChanges.subscribe((professionalId: number) => {
      this.onProfessionalChange(professionalId);
    });

    // Escuchar cambios en las fechas para verificar disponibilidad
    this.agendaForm.get('startDateTime')?.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(() => {
      this.onDateTimeChange();
    });

    this.agendaForm.get('endDateTime')?.valueChanges.pipe(
      debounceTime(500), 
      distinctUntilChanged()
    ).subscribe(() => {
      this.onDateTimeChange();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.appointment) {
      // Si estamos editando, cargar los datos existentes
      if (this.appointment.professional?.id) {
        this.selectedProfessionalId = this.appointment.professional.id;
      }
      
      if (this.appointment.client) {
        // Convertir AppointmentClientResponseDto a ClientResponseDto compatible
        this.selectedClient = {
          id: this.appointment.client.id,
          fullname: this.appointment.client.fullname,
          name: this.appointment.client.name || '',
          lastName: this.appointment.client.lastName || '',
          email: '', // No disponible en AppointmentClientResponseDto
          phone: '', // No disponible en AppointmentClientResponseDto
          status: 'ACTIVE' as const, // Valor por defecto
          createdAt: '', // No disponible
          updatedAt: '' // No disponible
        };
      }
      
      // Cargar servicio si existe
      if (this.appointment.serviceId) {
        this.loadServiceById(this.appointment.serviceId);
      }
      
      this.agendaForm.patchValue({
        title: this.appointment.title,
        description: this.appointment.notes || '',
        startDateTime: new Date(this.appointment.start),
        endDateTime: this.appointment.end ? new Date(this.appointment.end) : null,
        clientId: this.appointment.client?.id,
        professionalId: this.appointment.professional?.id,
        serviceId: this.appointment.serviceId,
        roomId: this.appointment.roomId,
        status: this.appointment.status,
      }, { emitEvent: false });
    } else {
      // Resetear el formulario y estados
      this.agendaForm.reset();
      this.selectedProfessionalId = null;
      this.selectedClient = null;
      this.selectedService = null;
      
      // Establecer fecha/hora actual como defecto
      const now = new Date();
      let defaultStartTime: Date;
      
      if (this.initialDate) {
        defaultStartTime = new Date(this.initialDate);
      } else {
        // Usar fecha/hora actual, redondeada al siguiente cuarto de hora
        defaultStartTime = new Date(now);
        const minutes = defaultStartTime.getMinutes();
        const roundedMinutes = Math.ceil(minutes / 15) * 15;
        defaultStartTime.setMinutes(roundedMinutes, 0, 0);
        
        // Si el tiempo redondeado está en el pasado o es muy cercano al presente, 
        // añadir tiempo suficiente para que sea válido (al menos 2 minutos en el futuro)
        const minFutureTime = new Date(now.getTime() + 2 * 60 * 1000); // +2 minutos del tiempo actual
        if (defaultStartTime <= minFutureTime) {
          defaultStartTime = new Date(minFutureTime);
          // Redondear al siguiente cuarto de hora para mantener consistencia
          const minutes = defaultStartTime.getMinutes();
          const roundedMinutes = Math.ceil(minutes / 15) * 15;
          defaultStartTime.setMinutes(roundedMinutes, 0, 0);
        }
      }
      
      const defaultEndTime = new Date(defaultStartTime.getTime() + 60 * 60 * 1000); // +1 hora por defecto
      
      this.agendaForm.patchValue({ 
        startDateTime: defaultStartTime,
        endDateTime: defaultEndTime,
        status: AppointmentStatus.CONFIRMED // Estado por defecto
      });
      
      // Preseleccionar el usuario actual como profesional por defecto
      this.setCurrentUserAsProfessional();
    }

    // Actualizar el título automáticamente cuando se seleccionan cliente y servicio
    this.updateAppointmentTitle();
  }

  onSubmit(): void {
    if (this.agendaForm.invalid) {
      return;
    }

    const formValue = this.agendaForm.getRawValue(); // Usar getRawValue() para obtener también campos deshabilitados

    const appointmentPayload = {
      title: formValue.title,
      startDateTime: formValue.startDateTime.toISOString(),
      endDateTime: formValue.endDateTime.toISOString(),
      notes: formValue.description,
      allDay: false,
      clientId: this.selectedClient?.id || formValue.clientId,
      professionalId: formValue.professionalId,
      status: formValue.status,
      serviceId: formValue.serviceId,
      roomId: formValue.roomId,
    };

    if (this.appointment?.id) {
      this.agendaStore.updateAppointment({
        id: this.appointment.id,
        dto: appointmentPayload as UpdateAppointmentDto,
      });
    } else {
      this.agendaStore.createAppointment(appointmentPayload as CreateAppointmentDto);
    }
    
    // Preguntar si desea crear factura después de guardar el turno
    this.showInvoiceCreationDialog(this.selectedClient?.id || formValue.clientId);
  }

  onDelete(): void {
    if (this.appointment?.id) {
      this.delete.emit(this.appointment.id);
    }
  }

  onCancel(): void {
    this.close.emit();
  }

  onCreateInvoice(): void {
    if (this.appointment && this.appointment.client?.id) {
      this.navigateToInvoiceCreation(this.appointment.client.id);
    }
  }

  onProfessionalChange(professionalId: number): void {
    this.selectedProfessionalId = professionalId;
    
    if (professionalId) {
      // Limpiar la selección actual de cliente si cambia el profesional
      if (this.selectedClient) {
        this.clearClient();
      }
      
      // Trigger availability check
      this.onDateTimeChange();
    } else {
      this.selectedProfessionalId = null;
      this.clearClient();
      this.clearAvailabilityMessage();
    }
  }

  onDateTimeChange(): void {
    // Limpiar timeout anterior
    if (this.availabilityCheckTimeout) {
      clearTimeout(this.availabilityCheckTimeout);
    }

    // Crear nuevo timeout para evitar múltiples llamadas rápidas
    this.availabilityCheckTimeout = setTimeout(() => {
      this.checkAvailability();
    }, 500); // Esperar 500ms después del último cambio
  }

  private checkAvailability(): void {
    const startDateTime = this.agendaForm.get('startDateTime')?.value;
    const endDateTime = this.agendaForm.get('endDateTime')?.value;
    const professionalId = this.agendaForm.get('professionalId')?.value;

    // Validaciones básicas
    if (!startDateTime || !endDateTime) {
      this.clearAvailabilityMessage();
      return;
    }

    if (startDateTime >= endDateTime) {
      this.showAvailabilityMessage('error', 'La fecha de fin debe ser posterior a la fecha de inicio');
      return;
    }

    const now = new Date();
    const minValidTime = new Date(now.getTime() + 60 * 1000); // +1 minuto del tiempo actual
    
    if (startDateTime <= minValidTime) {
      this.showAvailabilityMessage('warn', 'La fecha de inicio debe ser al menos 1 minuto en el futuro');
      return;
    }

    // Verificar que hay al menos 1 minuto de duración
    const durationMinutes = Math.round((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60));
    if (durationMinutes < 1) {
      this.showAvailabilityMessage('error', 'El turno debe tener una duración mínima de 1 minuto');
      return;
    }

    // Si hay un profesional seleccionado, verificar disponibilidad
    if (professionalId) {
      this.checkProfessionalAvailability(startDateTime, endDateTime, professionalId);
    } else {
      this.showAvailabilityMessage('info', 'Selecciona un profesional para verificar disponibilidad');
    }
  }

  private checkProfessionalAvailability(startDateTime: Date, endDateTime: Date, professionalId: string): void {
    // Mostrar mensaje de verificación
    this.showAvailabilityMessage('info', 'Verificando disponibilidad...');

    // Cargar appointments del profesional en el rango de fechas
    const dayStart = new Date(startDateTime);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(startDateTime);
    dayEnd.setHours(23, 59, 59, 999);

    this.agendaStore.loadAppointments({
      from: dayStart.toISOString(),
      to: dayEnd.toISOString(),
      professionalId: [Number(professionalId)]
    });

    // Suscribirse a los appointments para verificar conflictos
    const subscription = this.agendaStore.appointments$.pipe(
      debounceTime(300) // Esperar a que se carguen los datos
    ).subscribe(appointments => {
      const hasConflict = this.checkTimeConflicts(appointments, startDateTime, endDateTime, this.appointment?.id);
      
      if (hasConflict) {
        this.showAvailabilityMessage('error', 'El profesional no está disponible en este horario. Hay un turno que se superpone.');
      } else {
        const duration = Math.round((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60));
        this.showAvailabilityMessage('success', `✅ Horario disponible (${duration} minutos)`);
      }
      
      // Cancelar suscripción después del primer resultado
      subscription.unsubscribe();
    });
  }

  private checkTimeConflicts(appointments: AppointmentResponseDto[], startDateTime: Date, endDateTime: Date, currentAppointmentId?: string): boolean {
    const requestedStart = startDateTime.getTime();
    const requestedEnd = endDateTime.getTime();
    
    return appointments.some(appointment => {
      // Excluir la cita actual si estamos editando
      if (currentAppointmentId && appointment.id === currentAppointmentId) {
        return false;
      }
      
      if (!appointment.start || !appointment.end) {
        return false;
      }
      
      const existingStart = new Date(appointment.start).getTime();
      const existingEnd = new Date(appointment.end).getTime();
      
      // Verificar si hay superposición de horarios
      // Hay conflicto si: el inicio de la nueva cita es antes del fin de la existente
      // Y el fin de la nueva cita es después del inicio de la existente
      return requestedStart < existingEnd && requestedEnd > existingStart;
    });
  }

  private showAvailabilityMessage(severity: 'success' | 'info' | 'warn' | 'error', text: string): void {
    this.availabilityMessage = { severity, text };
    
    // Auto-ocultar mensajes de éxito después de 3 segundos
    if (severity === 'success') {
      setTimeout(() => {
        this.clearAvailabilityMessage();
      }, 3000);
    }
  }

  clearAvailabilityMessage(): void {
    this.availabilityMessage = null;
  }

  private setCurrentUserAsProfessional(): void {
    // Por ahora, preseleccionar el primer profesional de la lista
    this.professionals$.pipe(take(1)).subscribe(professionals => {
      if (professionals && professionals.length > 0) {
        const firstProfessional = professionals[0];
        this.agendaForm.patchValue({
          professionalId: firstProfessional.id
        });
        // Trigger el cambio de profesional para cargar clientes
        this.onProfessionalChange(firstProfessional.id);
      }
    });
  }

  private showInvoiceCreationDialog(clientId: number): void {
    // Cerrar el modal inmediatamente después de guardar
    this.close.emit();
    
    if (!clientId) {
      return;
    }

    // Mostrar el diálogo de creación de factura después de cerrar
    setTimeout(() => {
      this.confirmationService.confirm({
        header: 'Crear Factura',
        message: '¿Deseas crear una factura para este cliente?',
        icon: 'pi pi-question-circle',
        acceptButtonStyleClass: 'p-button-primary',
        rejectButtonStyleClass: 'p-button-secondary',
        acceptLabel: 'Sí',
        rejectLabel: 'No',
        accept: () => {
          this.navigateToInvoiceCreation(clientId);
        },
        reject: () => {
          // No hacer nada, se queda en la agenda
        }
      });
    }, 100);
  }

  private navigateToInvoiceCreation(clientId: number): void {
    // Navegar a la página de facturas (la ruta correcta es /invoices)
    this.router.navigate(['/invoices'], {
      queryParams: {
        clientId: clientId,
        fromAppointment: true
      }
    });
  }

  // Métodos para manejo de modales y selecciones
  openClientSearchModal(): void {
    if (!this.selectedProfessionalId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Primero selecciona un profesional'
      });
      return;
    }
    this.showClientSearchModal = true;
  }

  onClientSelected(client: ClientResponseDto): void {
    this.selectedClient = client;
    this.agendaForm.patchValue({ clientId: client.id });
    this.showClientSearchModal = false;
    this.updateAppointmentTitle();
  }

  onClientSearchCancel(): void {
    this.showClientSearchModal = false;
  }

  clearClient(): void {
    this.selectedClient = null;
    this.agendaForm.patchValue({ clientId: null });
    this.clearService(); // También limpiar el servicio
    this.updateAppointmentTitle();
  }

  openServiceSearchModal(): void {
    this.showServiceSearchModal = true;
  }

  onServiceSelected(service: ItemSelectorResponseDto): void {
    this.selectedService = service;
    // Si el servicio tiene ID, es uno existente del backend
    if ('id' in service && service.id) {
      this.agendaForm.patchValue({ serviceId: service.id });
    } else {
      // Es un servicio nuevo/personalizado - podríamos guardarlo primero o manejarlo diferente
      this.agendaForm.patchValue({ serviceId: null });
    }
    this.showServiceSearchModal = false;
    this.updateAppointmentTitle();
  }

  onServiceSearchCancel(): void {
    this.showServiceSearchModal = false;
  }

  clearService(): void {
    this.selectedService = null;
    this.agendaForm.patchValue({ serviceId: null });
    this.updateAppointmentTitle();
  }

  private updateAppointmentTitle(): void {
    if (this.selectedClient && this.selectedService) {
      const clientName = this.getClientDisplayName(this.selectedClient);
      const serviceName = this.selectedService.name;
      const title = `${clientName} - ${serviceName}`;
      this.agendaForm.patchValue({ title }, { emitEvent: false });
    } else if (this.selectedClient) {
      const clientName = this.getClientDisplayName(this.selectedClient);
      this.agendaForm.patchValue({ title: clientName }, { emitEvent: false });
    } else {
      // Si no hay selecciones, limpiar el título para que el usuario lo ingrese manualmente
      if (!this.appointment) { // Solo limpiar si no estamos editando
        this.agendaForm.patchValue({ title: '' }, { emitEvent: false });
      }
    }
  }

  getClientDisplayName(client: ClientResponseDto): string {
    if (client.fullname) return client.fullname;
    if (client.name && client.lastName) {
      return `${client.name} ${client.lastName}`;
    }
    if (client.name) return client.name;
    if (client.lastName) return client.lastName;
    if (client.email) return client.email;
    return 'Cliente sin nombre';
  }

  formatPrice(price?: number): string {
    if (!price) return 'Sin precio';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  }

  getServicePrice(service: ItemSelectorResponseDto): number | undefined {
    if (service.price !== undefined) {
      return service.price;
    }
    return undefined;
  }

  /**
   * Cargar servicio por ID y establecerlo como seleccionado
   */
  private loadServiceById(serviceId: number): void {
    this.servicesService.serviceControllerFindOne({ id: serviceId }).pipe(
      take(1)
    ).subscribe({
      next: (service) => {
        // Convertir ServiceResponseDto a ItemSelectorResponseDto
        this.selectedService = {
          id: service.id,
          name: service.name,
          description: service.description || '',
          type: 'service' as 'product' | 'service',
          price: service.basePrice,
          category: service.category || '',
          status: service.status
        };
      },
      error: (error) => {
        console.error('Error loading service:', error);
        this.messageService.add({
          severity: 'warn',
          summary: 'Advertencia',
          detail: 'No se pudo cargar el servicio asociado'
        });
      }
    });
  }

  onOpenConsultation(): void {
    if (this.appointment && this.selectedClient) {
      this.confirmationService.confirm({
        header: 'Crear consulta',
        message: '¿Desea cerrar esta ventana y abrir el formulario de consulta para este cliente?',
        icon: 'pi pi-question-circle',
        acceptButtonStyleClass: 'p-button-primary',
        rejectButtonStyleClass: 'p-button-secondary',
        acceptLabel: 'Sí, continuar',
        rejectLabel: 'Cancelar',
        accept: () => {
          this.navigateToConsultation();
        }
      });
    }
  }

  onOpenInvoice(): void {
    if (this.appointment && this.selectedClient) {
      this.confirmationService.confirm({
        header: 'Crear factura',
        message: '¿Desea cerrar esta ventana y abrir el formulario de factura para este cliente?',
        icon: 'pi pi-question-circle',
        acceptButtonStyleClass: 'p-button-primary',
        rejectButtonStyleClass: 'p-button-secondary',
        acceptLabel: 'Sí, continuar',
        rejectLabel: 'Cancelar',
        accept: () => {
          this.navigateToInvoiceCreation(this.selectedClient!.id!);
        }
      });
    }
  }

  private navigateToConsultation(): void {
    // Close the current modal first
    this.close.emit();

    // Navigate to consultations page with appointment and client data
    this.router.navigate(['/consultations'], {
      queryParams: {
        appointmentId: this.appointment?.id,
        clientId: this.selectedClient?.id,
        professionalId: this.selectedProfessionalId,
        appointmentDate: this.appointment?.start,
        fromAppointment: true
      }
    });
  }
}

