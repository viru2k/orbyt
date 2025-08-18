import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AgendaStore } from '../../store/agenda/agenda.store';
import { UsersStore } from '../../store/users/users.store';
import { OrbButtonComponent } from '@orb-shared-components/orb-button/orb-button.component';
import { OrbDialogComponent } from '@orb-shared-components/orb-dialog/orb-dialog.component';
import { OrbDatepickerComponent } from '@orb-shared-components/orb-datepicker/orb-datepicker.component';
import { OrbMultiselectComponent } from '@orb-shared-components/orb-multiselect/orb-multiselect.component';
import { DateRangePickerComponent, DateRange, DateRangePickerConfig } from '../../shared/components/date-range-picker';
import { AgendaFormComponent } from './components/agenda-form/agenda-form.component';
import { AppointmentResponseDto, UpdateAppointmentDto } from '../../api/model/models';
import { OrbCardComponent } from '@orb-shared-components/application/orb-card/orb-card.component';
import { OrbModernCalendarComponent, ModernCalendarEvent, DateSelectInfo, AdaptedEventClickArg, AdaptedDatesSetArg } from '@orb-shared-components/orb-modern-calendar/orb-modern-calendar.component';
// import { OrbDevXSchedulerComponent, DevXSchedulerEvent, DevXEventClickArg, DevXDateSelectInfo, DevXDatesSetArg } from '@orb-shared-components/orb-devx-scheduler/orb-devx-scheduler.component';
import { DateSelectArg, EventClickArg, DatesSetArg, EventDropArg } from '@fullcalendar/core';
import { CalendarEventTimesChangedEvent } from 'angular-calendar';
import { AuthStore } from '../../store/auth/auth.store';
import { STATUS_COLORS } from './constants/status-colors.map';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { StatusLegendComponent } from './components/status-legend/status-legend.component';
import { TagModule } from 'primeng/tag';
import { STATUS_TRANSLATION } from './constants/status-translation.map';
import { SUMMARY_KEY_MAP } from './constants/summary-key.map';
import { STATUS_SEVERITY } from './constants/status-severity.map';

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    OrbButtonComponent,
    OrbDialogComponent,
    OrbDatepickerComponent,
    OrbMultiselectComponent,
    DateRangePickerComponent,
    AgendaFormComponent,
    OrbCardComponent,
    OrbModernCalendarComponent,
    OverlayPanelModule,
    StatusLegendComponent,
    TagModule,
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

  
  // Filtros de fecha
  selectedDateFrom: Date = new Date();
  selectedDateTo: Date = new Date();
  
  // Configuración para DateRangePicker
  dateRangePickerConfig: DateRangePickerConfig = {
    showTime: true,
    showAvailability: true,
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
  statusOptions = [
    { label: 'Pendiente', value: 'pending' },
    { label: 'Confirmada', value: 'confirmed' },
    { label: 'Check-in', value: 'checked_in' },
    { label: 'En Proceso', value: 'in_progress' },
    { label: 'Completada', value: 'completed' },
    { label: 'Cancelada', value: 'cancelled' },
    { label: 'No Show', value: 'no_show' },
    { label: 'Reprogramada', value: 'rescheduled' }
  ];

  constructor(
    public agendaStore: AgendaStore,
    public usersStore: UsersStore,
    private authStore: AuthStore,
    private router: Router
  ) {
    // Configurar fechas por defecto (hoy)
    this.setTodayDates();
  }

  // No transformation needed for Modern Calendar - uses same event format

  ngOnInit(): void {
    // Cargar usuarios para el filtro
    this.usersStore.loadUsers();
    this.authStore.user$.subscribe(user => {
      if (user && user.id) {
        this.agendaStore.loadAgendaConfig(user.id);
        this.usersStore.users$.subscribe(users => {
          const currentUser = users.find(u => u.id === user.id);
          if (currentUser) {
            this.selectedUsers = [currentUser];
          }
        });
      }
    });
    
    // Realizar búsqueda automática con la fecha de hoy al inicializar
    this.performSearch();
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
      this.selectedAppointment = originalAppointment;
      this.dialogInitialDate = null;
      this.displayAgendaForm = true;
    }
  }

  handleDateSelect(dateSelectInfo: DateSelectInfo): void {
    this.selectedAppointment = null;
    this.dialogInitialDate = dateSelectInfo.startStr;
    this.displayAgendaForm = true;
  }

  handleEventDrop(eventDropInfo: CalendarEventTimesChangedEvent): void {
    const { event, newStart, newEnd } = eventDropInfo;
    if (event.id && newStart && newEnd) {
      const updateDto: UpdateAppointmentDto = {
        startDateTime: newStart.toISOString(),
        endDateTime: newEnd.toISOString(),
      };
      this.agendaStore.updateAppointment({ id: event.id.toString(), dto: updateDto });
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
    return STATUS_TRANSLATION[status as keyof typeof STATUS_TRANSLATION];
  }

  // DevExtreme handlers removed - using Angular Calendar handlers instead
}

