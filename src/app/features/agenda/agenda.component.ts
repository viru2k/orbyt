import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgendaStore } from '../../store/agenda/agenda.store';
import { UsersStore } from '../../store/users/users.store';
import { OrbButtonComponent } from '@orb-shared-components/orb-button/orb-button.component';
import { OrbDialogComponent } from '@orb-shared-components/orb-dialog/orb-dialog.component';
import { OrbDatepickerComponent } from '@orb-shared-components/orb-datepicker/orb-datepicker.component';
import { OrbMultiselectComponent } from '@orb-shared-components/orb-multiselect/orb-multiselect.component';
import { AgendaFormComponent } from './components/agenda-form/agenda-form.component';
import { AppointmentResponseDto, UpdateAppointmentDto } from '../../api/model/models';
import { OrbCardComponent } from '@orb-shared-components/application/orb-card/orb-card.component';
import { OrbFullcalendarComponent, CalendarDisplayEvent } from '@orb-shared-components/orb-fullcalendar/orb-fullcalendar.component';
import { DateSelectArg, EventClickArg, DatesSetArg, EventDropArg } from '@fullcalendar/core';

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
    AgendaFormComponent,
    OrbCardComponent,
    OrbFullcalendarComponent,
  ],
  templateUrl: './agenda.component.html',
  styleUrls: ['./agenda.component.scss'],
})
export class AgendaComponent implements OnInit {
  displayAgendaForm = false;
  selectedAppointment: AppointmentResponseDto | null = null;
  dialogInitialDate: string | null = null;
  
  // Filtros de fecha
  selectedDateFrom: Date = new Date();
  selectedDateTo: Date = new Date();
  
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
    public usersStore: UsersStore
  ) {
    // Configurar fechas por defecto (hoy)
    this.setTodayDates();
  }

  ngOnInit(): void {
    // Cargar usuarios para el filtro
    this.usersStore.loadUsers();
    
    // Realizar búsqueda automática con la fecha de hoy al inicializar
    this.performSearch();
  }

  private setTodayDates(): void {
    const today = new Date();
    // Fecha desde: hoy a las 00:00:00
    this.selectedDateFrom = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    // Fecha hasta: hoy a las 23:59:59
    this.selectedDateTo = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
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
      filters.status = this.selectedStatuses.map(s => s.value);
    }
    
    this.agendaStore.loadAppointments(filters);
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

  handleDatesSet(dateInfo: DatesSetArg): void {
    // Solo actualizar si no es la carga inicial
    if (!this.isInitialLoad(dateInfo)) {
      this.agendaStore.loadAppointments({
        from: dateInfo.start.toISOString(),
        to: dateInfo.end.toISOString(),
      });
    }
  }

  private isInitialLoad(dateInfo: DatesSetArg): boolean {
    // Verificar si las fechas del calendario coinciden con las fechas de filtro
    const startMatches = Math.abs(dateInfo.start.getTime() - this.selectedDateFrom.getTime()) < 86400000; // 24 horas
    const endMatches = Math.abs(dateInfo.end.getTime() - this.selectedDateTo.getTime()) < 86400000;
    return startMatches && endMatches;
  }

  handleEventClick(eventClickInfo: EventClickArg): void {
    const originalAppointment = eventClickInfo.event.extendedProps['originalAppointment'];
    if (originalAppointment) {
      this.selectedAppointment = originalAppointment;
      this.dialogInitialDate = null;
      this.displayAgendaForm = true;
    }
  }

  handleDateSelect(dateSelectInfo: DateSelectArg): void {
    this.selectedAppointment = null;
    this.dialogInitialDate = dateSelectInfo.startStr;
    this.displayAgendaForm = true;
  }

  handleEventDrop(eventDropInfo: EventDropArg): void {
    const { event } = eventDropInfo;
    if (event.id && event.start && event.end) {
      const updateDto: UpdateAppointmentDto = {
        startDateTime: event.start.toISOString(),
        endDateTime: event.end.toISOString(),
      };
      this.agendaStore.updateAppointment({ id: event.id, dto: updateDto });
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
}
