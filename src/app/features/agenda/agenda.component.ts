import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { AgendaStore } from '../../store/agenda/agenda.store';
import { UsersStore } from '../../store/users/users.store';
import { OrbButtonComponent } from '@orb-shared-components/orb-button/orb-button.component';
import { OrbBreadcrumbComponent } from '@orb-shared-components/orb-breadcrumb/orb-breadcrumb.component';
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
import { ButtonGroupModule } from 'primeng/buttongroup';
import { TooltipModule } from 'primeng/tooltip';
import { STATUS_TRANSLATION } from './constants/status-translation.map';
import { SUMMARY_KEY_MAP } from './constants/summary-key.map';
import { STATUS_SEVERITY } from './constants/status-severity.map';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    OrbButtonComponent,
    OrbBreadcrumbComponent,
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
    ButtonGroupModule,
    TooltipModule,
  ],
  providers: [
    ConfirmationService,
    MessageService
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

  breadcrumbItems: any[] = [];

  // Make CalendarView available in template
  CalendarView = CalendarView;

  // Vista actual (calendario o tabla)
  currentView: 'calendar' | 'table' = 'calendar';
  
  // Filtros de fecha
  selectedDateFrom: Date = new Date();
  selectedDateTo: Date = new Date();
  
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
    public agendaStore: AgendaStore,
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
    this.usersStore.loadUsers();
    
    // Subscribirse a cambios del usuario actual
    this.authStore.user$.subscribe(user => {
      if (user && user.id) {       
        
        // Cargar configuración de agenda del usuario actual
        this.agendaStore.loadAgendaConfig(user.id);
        
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
        this.usersStore.loadUsers();
      }
    });

    // Subscribe to appointment updates to show notification dialog
    this.agendaStore.appointmentUpdated$.subscribe(({ appointment, wasDragDrop }) => {
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
    // Construir parámetros de filtro usando la nueva API
    const filters: any = {
      from: this.selectedDateFrom.toISOString(),
      to: this.selectedDateTo.toISOString(),
    };
    
    // Agregar filtros de usuario si hay selecciones (array)
    if (this.selectedUsers.length > 0) {
      filters.professionalId = this.selectedUsers.map(u => u.id);
    }
    
    // Agregar filtros de estado si hay selecciones (array)  
    if (this.selectedStatuses.length > 0) {
      filters.status = this.selectedStatuses;
    }
       

    
    this.agendaStore.loadAppointments(filters);
    this.agendaStore.loadSummary({ 
      from: filters.from, 
      to: filters.to, 
      professionalId: filters.professionalId,
      status: filters.status
    });
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
        from: dateInfo.start.toISOString(),
        to: dateInfo.end.toISOString(),
      };
      if (this.selectedUsers.length > 0) {
        filters.professionalId = this.selectedUsers.map(u => u.id);
      }
      if (this.selectedStatuses.length > 0) {
        filters.status = this.selectedStatuses;
      }
      this.agendaStore.loadAppointments(filters);
      this.agendaStore.loadSummary({ 
        from: filters.from, 
        to: filters.to, 
        professionalId: filters.professionalId,
        status: filters.status
      });
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
      icon: 'pi pi-question-circle',
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
    
    // Verificar días laborales desde la configuración de agenda
    this.agendaStore.agendaConfig$.subscribe(config => {
      if (config && config.workingDays && config.workingDays.length > 0) {
        const isWorkingDay = config.workingDays.includes(dayOfWeek);
        
        if (!isWorkingDay && !config.allowBookingOnBlockedDays) {
          // Mostrar modal de confirmación para días no laborales
          this.showNonWorkingDayDialog(dayOfWeek, () => {
            this.openAppointmentForm(dateSelectInfo);
          });
        } else {
          // Día laboral normal o permitido booking en días bloqueados
          this.openAppointmentForm(dateSelectInfo);
        }
      } else {
        // Si no hay configuración, permitir cualquier día
        this.openAppointmentForm(dateSelectInfo);
      }
    }).unsubscribe(); // Unsubscribe inmediatamente ya que solo necesitamos el valor actual
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
      icon: 'pi pi-exclamation-triangle',
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
      this.agendaStore.updateAppointment({ id: event.id.toString(), dto: updateDto, wasDragDrop: true });
    }
  }

  handleDelete(appointmentId: string): void {
    this.agendaStore.deleteAppointment(appointmentId);
    this.onFormClose();
  }

  onFormClose(): void {
    this.displayAgendaForm = false;
    this.selectedAppointment = null;
    this.dialogInitialDate = null;
  }

  getKeyAsString(key: unknown): string {
    return key as string;
  }

  getColor(statusKey: string): string {
    const status = SUMMARY_KEY_MAP[statusKey];
    return this.statusColors[status as keyof typeof this.statusColors].primary;
  }

  getTranslatedStatus(statusKey: string): string {
    const status = SUMMARY_KEY_MAP[statusKey];
    const translationKey = STATUS_TRANSLATION[status as keyof typeof STATUS_TRANSLATION];
    const translation = this.translate.instant(translationKey);
    // Si la traducción no se encontró, devolver la clave sin el prefijo
    return translation === translationKey ? status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) : translation;
  }

  toggleView(view: 'calendar' | 'table'): void {
    this.currentView = view;
  }

  getStatusSeverity(status: string): any {
    const severityMap: { [key: string]: any } = {
      'pending': 'pending',
      'confirmed': 'confirmed', 
      'checked_in': 'info',
      'in_progress': 'in-progress',
      'completed': 'completed',
      'cancelled': 'cancelled',
      'no_show': 'no-show',
      'rescheduled': 'rescheduled'
    };
    return severityMap[status] || 'secondary';
  }

  editAppointment(appointment: AppointmentResponseDto): void {
    this.selectedAppointment = appointment;
    this.dialogInitialDate = null;
    this.displayAgendaForm = true;
  }

  private initializeTranslations(): void {
    this.breadcrumbItems = [
      { label: 'Agenda' }
    ];

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

    this.agendaStore.loadSummary(summaryParams);
  }

  private showClientNotificationDialog(appointment: AppointmentResponseDto): void {
    this.confirmationService.confirm({
      header: 'Notificar cambios al cliente',
      message: `¿Desea notificar a ${appointment.client?.name || 'el cliente'} sobre los cambios en el horario de su turno?`,
      icon: 'pi pi-question-circle',
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

