import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgendaStore } from '../../store/agenda/agenda.store';
import { OrbButtonComponent } from '@orb-shared-components/orb-button/orb-button.component';
import { OrbDialogComponent } from '@orb-shared-components/orb-dialog/orb-dialog.component';
import { AgendaFormComponent } from './components/agenda-form/agenda-form.component';
import { AppointmentResponseDto } from '../../api/model/models';
import { OrbCardComponent } from '@orb-shared-components/application/orb-card/orb-card.component';
import { AgendaListComponent } from './components/agenda-list/agenda-list.component';

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [
    CommonModule,
    OrbButtonComponent,
    OrbDialogComponent,
    AgendaFormComponent,
    OrbCardComponent,
    AgendaListComponent
  ],
  templateUrl: './agenda.component.html',
  styleUrls: ['./agenda.component.scss'],
  // AgendaStore is providedIn: 'root', so no need to provide it here
})
export class AgendaComponent implements OnInit {
  displayAgendaForm = false;
  selectedAppointment: AppointmentResponseDto | null = null;

  constructor(public agendaStore: AgendaStore) {}

  ngOnInit(): void {
    // Load appointments for a default range, e.g., current month
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    this.agendaStore.loadAppointments({ startDate: startOfMonth, endDate: endOfMonth });
  }

  openNewAppointmentForm(): void {
    this.selectedAppointment = null;
    this.displayAgendaForm = true;
  }

  editAppointment(appointment: AppointmentResponseDto): void {
    this.selectedAppointment = appointment;
    this.displayAgendaForm = true;
  }

  deleteAppointment(id: number): void {
    if (confirm('¿Está seguro de que desea eliminar esta cita?')) {
      this.agendaStore.deleteAppointment(id);
    }
  }

  onFormClose(): void {
    this.displayAgendaForm = false;
    this.selectedAppointment = null;
  }
}
