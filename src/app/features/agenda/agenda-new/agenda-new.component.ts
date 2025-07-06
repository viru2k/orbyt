import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';

// src/app/features/crm/client/client-list/client-list.component.ts
import { Component} from '@angular/core';
import { CommonModule } from '@angular/common';



// Componentes Orb y PrimeNG
import {  OrbCardComponent, OrbTableComponent, OrbDialogComponent, OrbToolbarComponent, OrbButtonComponent } from '@orb-components';

import { ConfirmationService } from 'primeng/api'; // SortEvent de PrimeNG
import { ConfirmDialogModule } from 'primeng/confirmdialog';



// Servicios
import { FullCalendarModule } from '@fullcalendar/angular';



@Component({
  selector: 'app-client-new', // Cambiado de 'orb-clients' para seguir un patrón de feature
  standalone: true,
  imports: [
    CommonModule,
    OrbCardComponent,
    ConfirmDialogModule,
    OrbToolbarComponent,
    FullCalendarModule 
  ],
  templateUrl: './agenda-new.component.html',
  styleUrls: ['./agenda-new.component.scss'],
  providers: [ConfirmationService],
})
export class AgendaNewComponent   {

 calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin],
    initialView: 'dayGridMonth',
    weekends: false,
    events: [
      { title: 'Meeting', start: new Date() }
    ]
  };


}