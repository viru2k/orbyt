

import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppointmentResponseDto, CreateAppointmentDto, UpdateAppointmentDto } from '../../../../api/model/models';
import { AgendaStore } from '../../../../store/agenda/agenda.store';
import { ClientResponseDto, UserResponseDto } from '../../../../api/model/models';
import { ClientsService } from '../../../../api/services/clients.service';
import { UsersService } from '../../../../api/services/users.service';
import { Observable, of, debounceTime, distinctUntilChanged } from 'rxjs';
import { OrbButtonComponent, OrbDatepickerComponent, OrbFormFieldComponent, OrbSelectComponent, OrbTextAreaComponent, OrbTextInputComponent } from '@orb-components';
import { MessageModule } from 'primeng/message';
import { AppointmentStatus } from '../../../../api/model/appointment-status.enum';

@Component({
  selector: 'app-agenda-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    OrbFormFieldComponent,
    OrbTextInputComponent,
    OrbDatepickerComponent,
    OrbSelectComponent,
    OrbTextAreaComponent,
    OrbButtonComponent,
    MessageModule,
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

  statusOptions = Object.keys(AppointmentStatus).map(key => ({
    label: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
    value: (AppointmentStatus as any)[key]
  }));

  // Validación de disponibilidad
  availabilityMessage: { severity: 'success' | 'info' | 'warn' | 'error', text: string } | null = null;
  private availabilityCheckTimeout: any;

  constructor(
    private fb: FormBuilder,
    public agendaStore: AgendaStore,
    private clientsService: ClientsService,
    private userService: UsersService
  ) {
    this.agendaForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      startDateTime: [null, Validators.required],
      endDateTime: [null, Validators.required],
      clientId: [{value: null, disabled: true}, Validators.required],
      professionalId: [null, Validators.required],
      serviceId: [null],
      roomId: [null],
      status: [null, Validators.required],
    });

    // Cargar profesionales del grupo
    this.professionals$ = this.userService.userControllerGetGroupUsers();
    this.services$ = of([]);  // TODO: Implement services API
    this.rooms$ = of([]);    // TODO: Implement rooms API
    
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
      // Si estamos editando, cargar los clientes del profesional y habilitar el campo cliente
      if (this.appointment.professional?.id) {
        this.selectedProfessionalId = this.appointment.professional.id;
        this.clients$ = this.clientsService.clientControllerFindAll({ userId: this.appointment.professional.id });
        this.agendaForm.get('clientId')?.enable();
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
      // Resetear el formulario y deshabilitar cliente
      this.agendaForm.reset();
      this.agendaForm.get('clientId')?.disable();
      this.clients$ = of([]);
      this.selectedProfessionalId = null;
      
      if (this.initialDate) {
        const initialDateTime = new Date(this.initialDate);
        this.agendaForm.patchValue({ 
          startDateTime: initialDateTime,
          endDateTime: new Date(initialDateTime.getTime() + 60 * 60 * 1000) // +1 hora por defecto
        });
      }
    }
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
      clientId: formValue.clientId,
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
    this.close.emit();
  }

  onDelete(): void {
    if (this.appointment?.id) {
      this.delete.emit(this.appointment.id);
    }
  }

  onCancel(): void {
    this.close.emit();
  }

  onProfessionalChange(professionalId: number): void {
    this.selectedProfessionalId = professionalId;
    
    if (professionalId) {
      // Habilitar el campo cliente y cargar clientes del profesional
      this.agendaForm.get('clientId')?.enable();
      this.clients$ = this.clientsService.clientControllerFindAll({ userId: professionalId });
      
      // Limpiar la selección actual de cliente
      this.agendaForm.get('clientId')?.setValue(null);
      
      // Trigger availability check
      this.onDateTimeChange();
    } else {
      // Deshabilitar el campo cliente si no hay profesional seleccionado
      this.agendaForm.get('clientId')?.disable();
      this.agendaForm.get('clientId')?.setValue(null);
      this.clients$ = of([]);
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
    if (startDateTime <= now) {
      this.showAvailabilityMessage('warn', 'La fecha de inicio debe ser futura');
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
}

