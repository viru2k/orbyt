import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { AppointmentsStore } from '../../store/appointments/appointments.store';
import { UsersStore } from '../../store/users/users.store';
import { OrbButtonComponent } from '@orb-shared-components/orb-button/orb-button.component';
import { OrbMainHeaderComponent } from '@orb-shared-components/orb-main-header/orb-main-header.component';
import { OrbDialogComponent } from '@orb-shared-components/orb-dialog/orb-dialog.component';
import { OrbDatepickerComponent } from '@orb-shared-components/orb-datepicker/orb-datepicker.component';
import { OrbMultiselectComponent } from '@orb-shared-components/orb-multiselect/orb-multiselect.component';
import { DateRangePickerComponent, DateRange, DateRangePickerConfig } from '../../shared/components/date-range-picker';
import { AgendaFormComponent } from './components/agenda-form/agenda-form.component';
import { AppointmentResponseDto, UpdateAppointmentDto } from '../../api/model/models';
import { OrbCardComponent } from '@orb-shared-components/application/orb-card/orb-card.component';
import { OrbTagComponent } from '@orb-shared-components/orb-tag/orb-tag.component';
import { OrbTableComponent } from '@orb-shared-components/orb-table/orb-table.component';
import { OrbModernCalendarComponent, ModernCalendarEvent, DateSelectInfo, AdaptedEventClickArg, AdaptedDatesSetArg } from '@orb-shared-components/orb-modern-calendar/orb-modern-calendar.component';
// import { OrbDevXSchedulerComponent, DevXSchedulerEvent, DevXEventClickArg, DevXDateSelectInfo, DevXDatesSetArg } from '@orb-shared-components/orb-devx-scheduler/orb-devx-scheduler.component';
import { DateSelectArg, EventClickArg, DatesSetArg, EventDropArg } from '@fullcalendar/core';
import { CalendarEventTimesChangedEvent, CalendarView } from 'angular-calendar';
import { AuthStore } from '../../store/auth/auth.store';
import { STATUS_COLORS } from './constants/status-colors.map';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { STATUS_TRANSLATION } from './constants/status-translation.map';
import { SUMMARY_KEY_MAP } from './constants/summary-key.map';
import { STATUS_SEVERITY } from './constants/status-severity.map';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DOCUMENT } from '@angular/common';
import { importProvidersFrom } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    OrbButtonComponent,
    OrbMainHeaderComponent,
    OrbDialogComponent,
    OrbDatepickerComponent,
    OrbMultiselectComponent,
    DateRangePickerComponent,
    AgendaFormComponent,
    OrbCardComponent,
    OrbTagComponent,
    OrbTableComponent,
    OrbModernCalendarComponent,
    OverlayPanelModule,
    TagModule,
    ConfirmDialogModule,
    ToastModule,
    ButtonModule,
    TooltipModule,
  ],
  providers: [
    ConfirmationService,
    MessageService,
    { provide: DOCUMENT, useFactory: () => document }
  ],
  templateUrl: './agenda.component.html',
  styleUrls: ['./agenda.component.scss'],
})
export class AgendaComponent implements OnInit {
  displayAgendaForm = false;
  selectedAppointment: AppointmentResponseDto | null = null;
  dialogInitialDate: string | null = null;
  showInfo = false;
  statusColors = STATUS_COLORS;
  SUMMARY_KEY_MAP = SUMMARY_KEY_MAP;

  // Alias for template compatibility
  get agendaStore() {
    return this.appointmentsStore;
  }


  // Make CalendarView available in template
  CalendarView = CalendarView;

  // Vista actual (calendario o tabla)
  currentView: 'calendar' | 'table' = 'calendar';

  // Filtros de fecha
  selectedDateFrom: Date = new Date();
  selectedDateTo: Date = new Date();

  // Current view date for the calendar (to maintain selected day after creating appointment)
  calendarViewDate: Date = new Date();
  
  // Configuración para DateRangePicker
  dateRangePickerConfig: DateRangePickerConfig = {
    showTime: true,
    showAvailability: false, // Desactivado temporalmente hasta implementar el endpoint
    placeholder: 'Seleccionar rango de fechas',
    minDate: new Date(2024, 0, 1), // Desde enero 2024
    maxDate: new Date(2030, 11, 31) // Hasta diciembre 2030
  };
  
  // Rango de fechas seleccionado
  selectedDateRange: DateRange = {
    start: new Date(),
    end: new Date()
  };
  
  // Filtros de usuarios y estados
  selectedUsers: any[] = [];
  selectedStatuses: any[] = [];
  
  // Opciones para los filtros (según nueva API)
  statusOptions: any[] = [];

  // Columnas para la tabla
  tableColumns: any[] = [];

  constructor(
    public appointmentsStore: AppointmentsStore,
    public usersStore: UsersStore,
    private authStore: AuthStore,
    private router: Router,
    private translate: TranslateService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {
    // Configurar fechas por defecto (hoy)
    this.setTodayDates();
  }

  // No transformation needed for Modern Calendar - uses same event format

  ngOnInit(): void {
    // Inicializar configuraciones
    this.initializeTranslations();
    
    // Cargar usuarios para el filtro
    this.usersStore.loadSubUsers();
    
    // Subscribirse a cambios del usuario actual
    this.authStore.user$.subscribe(user => {
      if (user && user.id) {       
        
        // Cargar configuración de agenda del usuario actual
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);

        this.appointmentsStore.loadAvailabilitySlots({
          from: today.toISOString().split('T')[0],
          to: nextWeek.toISOString().split('T')[0]
        });
        
        // Usar el usuario actual directamente, sin necesidad de buscarlo en la lista de usuarios
        // Crear un objeto compatible con selectedUsers que use el ProfileResponseDto
        const currentUserForAgenda = {
          id: user.id,
          name: user.name,
          lastName: user.lastName,
          email: user.email,
          isActive: user.isActive
        };
               
        this.selectedUsers = [currentUserForAgenda];
        
        // Cargar resumen automáticamente
        this.loadSummaryForCurrentUser();
        
        // Realizar búsqueda automática con el usuario actual seleccionado
        this.performSearch();
        
        // También cargar la lista de usuarios para el filtro (sin bloquear la funcionalidad principal)
        this.usersStore.loadSubUsers();
      }
    });

    // Subscribe to appointment updates to show notification dialog
    this.appointmentsStore.appointmentUpdated$.subscribe(({ appointment, wasDragDrop }: { appointment: AppointmentResponseDto; wasDragDrop?: boolean }) => {
      if (wasDragDrop && appointment.client) {
        this.showClientNotificationDialog(appointment);
      }
    });
  }

  private setTodayDates(): void {
    const today = new Date();
    // Fecha desde: 7 días atrás a las 00:00:00
    this.selectedDateFrom = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7, 0, 0, 0);
    // Fecha hasta: 7 días adelante a las 23:59:59
    this.selectedDateTo = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7, 23, 59, 59);
    
    // Sincronizar con DateRangePicker
    this.selectedDateRange = {
      start: this.selectedDateFrom,
      end: this.selectedDateTo
    };
  }

  // Métodos para DateRangePicker
  onDateRangeChange(range: DateRange): void {
    if (range.start && range.end) {
      this.selectedDateFrom = range.start;
      this.selectedDateTo = range.end;
      this.selectedDateRange = range;
      // Auto-buscar cuando cambia el rango
      this.performSearch();
    }
  }

  // Configuración dinámica para crear nueva cita
  getNewAppointmentDateConfig(): DateRangePickerConfig {
    const now = new Date();
    return {
      showTime: true,
      showAvailability: true,
      placeholder: 'Fecha y hora del turno',
      minDate: now,
      maxDate: new Date(now.getFullYear() + 1, 11, 31),
      required: true
    };
  }

  openNewAppointmentDialog(): void {
    this.selectedAppointment = null;
    this.dialogInitialDate = new Date().toISOString();
    this.displayAgendaForm = true;
  }

  performSearch(): void {
    // Construir parámetros de filtro usando la nueva API del AppointmentsStore
    const filters: any = {
      startDate: this.selectedDateFrom.toISOString(),
      endDate: this.selectedDateTo.toISOString(),
    };

    // Agregar filtros de usuario si hay selecciones (array)
    if (this.selectedUsers.length > 0) {
      filters.professionalId = this.selectedUsers.map(u => u.id);
    }

    // Agregar filtros de estado si hay selecciones (array)
    if (this.selectedStatuses.length > 0) {
      filters.status = this.selectedStatuses;
    }

    this.appointmentsStore.loadAppointments(filters);
  }

  onDateFromChange(date: Date): void {
    this.selectedDateFrom = date;
  }

  onDateToChange(date: Date): void {
    this.selectedDateTo = date;
  }
  
  onUsersChange(users: any[]): void {
    this.selectedUsers = users;
  }
  
  onStatusesChange(statuses: any[]): void {
    this.selectedStatuses = statuses;
  }

  resetToToday(): void {
    this.setTodayDates();
    this.performSearch();
  }

  // Modern Calendar compatible handlers
  handleDatesSet(dateInfo: AdaptedDatesSetArg): void {
    // Solo actualizar si no es la carga inicial
    if (!this.isInitialLoad(dateInfo)) {
      const filters: any = {
        startDate: dateInfo.start.toISOString(),
        endDate: dateInfo.end.toISOString(),
      };
      if (this.selectedUsers.length > 0) {
        filters.professionalId = this.selectedUsers.map(u => u.id);
      }
      if (this.selectedStatuses.length > 0) {
        filters.status = this.selectedStatuses;
      }
      this.appointmentsStore.loadAppointments(filters);
    }
  }

  private isInitialLoad(dateInfo: AdaptedDatesSetArg): boolean {
    // Verificar si las fechas del calendario coinciden con las fechas de filtro
    const startMatches = Math.abs(dateInfo.start.getTime() - this.selectedDateFrom.getTime()) < 86400000; // 24 horas
    const endMatches = Math.abs(dateInfo.end.getTime() - this.selectedDateTo.getTime()) < 86400000;
    return startMatches && endMatches;
  }

  handleEventClick(eventClickInfo: AdaptedEventClickArg): void {
    // Try both extendedProps and the nested structure
    const extendedProps = eventClickInfo.event.extendedProps || {};
    const originalAppointment = extendedProps['originalAppointment'] || extendedProps.originalAppointment;

    console.log('Event click info:', eventClickInfo);
    console.log('Extended props:', extendedProps);
    console.log('Original appointment:', originalAppointment);

    if (originalAppointment) {
      // Verificar si el usuario tiene permisos de edición de agenda
      const canEditAgenda = this.canUserEditAgenda();

      if (canEditAgenda) {
        // Si tiene permisos, mostrar el formulario de agenda
        this.selectedAppointment = originalAppointment;
        this.dialogInitialDate = null;
        this.displayAgendaForm = true;
      } else {
        // Si no tiene permisos de edición, preguntar si quiere crear consulta
        this.showConsultationDialog(originalAppointment);
      }
    } else {
      console.warn('No original appointment found in event click info');
    }
  }

  private canUserEditAgenda(): boolean {
    // TODO: Implementar lógica de permisos real
    // Por ahora, asumir que todos pueden editar
    return true;
  }

  private showConsultationDialog(appointment: AppointmentResponseDto): void {
    this.confirmationService.confirm({
      header: this.translate.instant('CONSULTATION.TITLE'),
      message: this.translate.instant('CONSULTATION.CONSULTATION_QUESTION'),
      icon: 'fas fa-circle-question',
      acceptButtonStyleClass: 'p-button-primary',
      rejectButtonStyleClass: 'p-button-secondary',
      acceptLabel: this.translate.instant('COMMON.YES'),
      rejectLabel: this.translate.instant('COMMON.NO'),
      accept: () => {
        this.openConsultationModal(appointment);
      }
    });
  }

  private openConsultationModal(appointment: AppointmentResponseDto): void {
    // Implementar la navegación a la modal de consulta
    this.router.navigate(['/consultation/new'], {
      queryParams: {
        appointmentId: appointment.id,
        clientId: appointment.client?.id,
        professionalId: appointment.professional?.id,
        appointmentDate: appointment.start
      }
    });
  }

  handleDateSelect(dateSelectInfo: DateSelectInfo): void {
    const selectedDate = new Date(dateSelectInfo.startStr);
    const dayOfWeek = selectedDate.getDay(); // 0 = domingo, 1 = lunes, etc.

    // Update calendar view date to maintain selected day after creating appointment
    this.calendarViewDate = selectedDate;

    // Por ahora permitir cualquier día (configuración de agenda pendiente de implementar)
    this.openAppointmentForm(dateSelectInfo);
  }

  private openAppointmentForm(dateSelectInfo: DateSelectInfo): void {
    this.selectedAppointment = null;
    this.dialogInitialDate = dateSelectInfo.startStr;
    this.displayAgendaForm = true;
  }

  private showNonWorkingDayDialog(dayOfWeek: number, onConfirm: () => void): void {
    const dayNames = [
      'WORKING_DAYS.SUNDAY',
      'WORKING_DAYS.MONDAY', 
      'WORKING_DAYS.TUESDAY',
      'WORKING_DAYS.WEDNESDAY',
      'WORKING_DAYS.THURSDAY',
      'WORKING_DAYS.FRIDAY',
      'WORKING_DAYS.SATURDAY'
    ];
    
    const dayName = this.translate.instant(dayNames[dayOfWeek]);
    const message = this.translate.instant('WORKING_DAYS.NOT_WORKING_MESSAGE', { day: dayName });
    
    this.confirmationService.confirm({
      header: this.translate.instant('WORKING_DAYS.NOT_WORKING_TITLE'),
      message: message,
      icon: 'fas fa-triangle-exclamation',
      acceptButtonStyleClass: 'p-button-warning',
      rejectButtonStyleClass: 'p-button-secondary',
      acceptLabel: this.translate.instant('COMMON.CONTINUE'),
      rejectLabel: this.translate.instant('COMMON.CANCEL'),
      accept: () => {
        onConfirm();
      }
    });
  }

  handleEventDrop(eventDropInfo: CalendarEventTimesChangedEvent): void {
    const { event, newStart, newEnd } = eventDropInfo;
    if (event.id && newStart && newEnd) {
      const updateDto: UpdateAppointmentDto = {
        startDateTime: newStart.toISOString(),
        endDateTime: newEnd.toISOString(),
      };
      this.appointmentsStore.updateAppointment({ id: Number(event.id), appointmentData: updateDto });
    }
  }

  handleDelete(appointmentId: string): void {
    this.appointmentsStore.deleteAppointment(Number(appointmentId));
    this.onFormClose();
  }

  onFormClose(): void {
    this.displayAgendaForm = false;
    this.selectedAppointment = null;
    this.dialogInitialDate = null;
    // Note: We DON'T reset calendarViewDate here to maintain the selected day
  }

  onCalendarViewDateChange(date: Date): void {
    // Update the calendar view date when user navigates
    this.calendarViewDate = date;
  }

  getKeyAsString(key: unknown): string {
    return key as string;
  }



  getTranslatedStatus(statusKey: string): string {
    // Validación defensiva para claves vacías o undefined
    if (!statusKey || statusKey.trim() === '') {
      return 'Estado no definido';
    }

    // Intentar primero mapear usando SUMMARY_KEY_MAP
    const status = SUMMARY_KEY_MAP[statusKey];
    if (status) {
      return this.getSpanishStatusText(status);
    }

    // Si no está en SUMMARY_KEY_MAP, usar directamente el statusKey
    return this.getSpanishStatusText(statusKey);
  }

  toggleView(view: 'calendar' | 'table'): void {
    this.currentView = view;
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show' | 'rescheduled' {
    const severityMap: { [key: string]: 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show' | 'rescheduled' } = {
      // Handle both uppercase and lowercase formats
      'PENDING': 'pending',
      'pending': 'pending',
      'CONFIRMED': 'confirmed',
      'confirmed': 'confirmed',
      'CHECKED_IN': 'confirmed',
      'checked_in': 'confirmed',
      'IN_PROGRESS': 'in-progress',
      'in_progress': 'in-progress',
      'COMPLETED': 'completed',
      'completed': 'completed',
      'CANCELLED': 'cancelled',
      'cancelled': 'cancelled',
      'NO_SHOW': 'no-show',
      'no_show': 'no-show',
      'RESCHEDULED': 'rescheduled',
      'rescheduled': 'rescheduled'
    };
    return severityMap[status] || 'pending';
  }

  getStatusCssClass(status: string): string {
    const cssClassMap: { [key: string]: string } = {
      // Handle both uppercase and lowercase formats
      'PENDING': 'status-pending',
      'pending': 'status-pending',
      'CONFIRMED': 'status-confirmed',
      'confirmed': 'status-confirmed',
      'CHECKED_IN': 'status-checked-in',
      'checked_in': 'status-checked-in',
      'IN_PROGRESS': 'status-in-progress',
      'in_progress': 'status-in-progress',
      'COMPLETED': 'status-completed',
      'completed': 'status-completed',
      'CANCELLED': 'status-cancelled',
      'cancelled': 'status-cancelled',
      'NO_SHOW': 'status-no-show',
      'no_show': 'status-no-show',
      'RESCHEDULED': 'status-rescheduled',
      'rescheduled': 'status-rescheduled'
    };
    return cssClassMap[status] || 'status-pending';
  }

  /**
   * Traducciones en español para los estados de agenda
   */
  getSpanishStatusText(status: string): string {
    const spanishMap: { [key: string]: string } = {
      // Handle both uppercase and lowercase formats
      'PENDING': 'Pendiente',
      'pending': 'Pendiente',
      'CONFIRMED': 'Confirmado',
      'confirmed': 'Confirmado',
      'CHECKED_IN': 'Llegó',
      'checked_in': 'Llegó',
      'IN_PROGRESS': 'En Progreso',
      'in_progress': 'En Progreso',
      'COMPLETED': 'Completado',
      'completed': 'Completado',
      'CANCELLED': 'Cancelado',
      'cancelled': 'Cancelado',
      'NO_SHOW': 'No Asistió',
      'no_show': 'No Asistió',
      'RESCHEDULED': 'Reprogramado',
      'rescheduled': 'Reprogramado'
    };
    return spanishMap[status] || status || 'Pendiente';
  }

  editAppointment(appointment: AppointmentResponseDto): void {
    this.selectedAppointment = appointment;
    this.dialogInitialDate = null;
    this.displayAgendaForm = true;
  }

  private initializeTranslations(): void {
    this.statusOptions = [
      { label: 'Pendiente', value: 'pending' },
      { label: 'Confirmada', value: 'confirmed' },
      { label: 'Check-in', value: 'checked_in' },
      { label: 'En Proceso', value: 'in_progress' },
      { label: 'Completada', value: 'completed' },
      { label: 'Cancelada', value: 'cancelled' },
      { label: 'No Show', value: 'no_show' },
      { label: 'Reprogramada', value: 'rescheduled' }
    ];

    this.tableColumns = [
      { field: 'startDateTime', header: 'Fecha/Hora', sortable: true },
      { field: 'title', header: 'Título', sortable: true },
      { field: 'clientName', header: 'Cliente', sortable: true },
      { field: 'professionalName', header: 'Profesional', sortable: true },
      { field: 'status', header: 'Estado', sortable: true },
      { field: 'duration', header: 'Duración', sortable: false },
      { field: 'actions', header: 'Acciones', sortable: false, width: '120px' }
    ];
  }

  // Método para calcular la duración en minutos
  getDuration(appointment: AppointmentResponseDto): number {
    if (appointment.start && appointment.end) {
      const startDate = new Date(appointment.start);
      const endDate = new Date(appointment.end);
      const durationMs = endDate.getTime() - startDate.getTime();
      return Math.round(durationMs / (1000 * 60)); // convertir a minutos
    }
    return 0;
  }

  private loadSummaryForCurrentUser(): void {
    const summaryParams = {
      from: this.selectedDateFrom.toISOString(),
      to: this.selectedDateTo.toISOString(),
      professionalId: this.selectedUsers.map(user => user.id),
      status: this.selectedStatuses.length > 0 ? this.selectedStatuses : undefined
    };

    this.appointmentsStore.loadSummary(summaryParams);
  }

  private showClientNotificationDialog(appointment: AppointmentResponseDto): void {
    this.confirmationService.confirm({
      header: 'Notificar cambios al cliente',
      message: `¿Desea notificar a ${appointment.client?.name || 'el cliente'} sobre los cambios en el horario de su turno?`,
      icon: 'fas fa-circle-question',
      acceptButtonStyleClass: 'p-button-primary',
      rejectButtonStyleClass: 'p-button-secondary',
      acceptLabel: 'Sí, notificar',
      rejectLabel: 'No',
      accept: () => {
        this.sendAppointmentChangeNotification(appointment);
      }
    });
  }

  private sendAppointmentChangeNotification(appointment: AppointmentResponseDto): void {
    // TODO: Implement the backend call to notify the client
    // This should trigger an action in the backend to send email/SMS notification
    this.messageService.add({
      severity: 'info',
      summary: 'Notificación enviada',
      detail: `Se ha enviado la notificación de cambio de horario a ${appointment.client?.name || 'el cliente'}.`
    });
  }

  // DevExtreme handlers removed - using Angular Calendar handlers instead
}

