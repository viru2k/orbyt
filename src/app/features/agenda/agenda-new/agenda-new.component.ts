import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AgendaStore } from '../../../store/agenda/agenda.store';
import { OrbCardComponent } from '@orb-shared-components/application/orb-card/orb-card.component';
import { OrbButtonComponent } from '@orb-shared-components/orb-button/orb-button.component';
import { AgendaFormComponent } from '../components/agenda-form/agenda-form.component';



@Component({
  selector: 'app-agenda-new',
  standalone: true,
  imports: [
    CommonModule,
    OrbCardComponent,
    OrbButtonComponent,
    AgendaFormComponent
  ],
  templateUrl: './agenda-new.component.html',
  styleUrls: ['./agenda-new.component.scss'],
})
export class AgendaNewComponent implements OnInit {

  constructor(
    private router: Router,
    private agendaStore: AgendaStore
  ) {}

  ngOnInit(): void {
    // Inicializar cualquier dato necesario para el formulario
  }

  onFormClose(): void {
    // Navegar de vuelta a la agenda principal
    this.router.navigate(['/agenda']);
  }

  onAppointmentCreated(): void {
    // Después de crear exitosamente, regresar a la agenda
    this.router.navigate(['/agenda']);
  }
}