import { AuthStore } from '@orb-stores';
import { AgendaStore } from './../../store/agenda/agenda.store';


import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { CardModule } from 'primeng/card';
import { take, filter } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ChartModule, CardModule],
  templateUrl: './dashboard.component.html',
  // AgendaStore is providedIn: 'root', so no need to provide it here
})
export class DashboardComponent implements OnInit {
  summary$ = this.agendaStore.summary$; // Corrected to summary$
  data: any;
  options: any;

  constructor(private readonly agendaStore: AgendaStore, private readonly authStore: AuthStore) {}

  ngOnInit() {
    // Rango de fechas para HOY desde 00:00 hasta 23:59
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const date = today.getDate();
    
    // Crear fechas en UTC para evitar problemas de timezone
    const from = new Date(Date.UTC(year, month, date, 0, 0, 0, 0)).toISOString();
    const to = new Date(Date.UTC(year, month, date, 23, 59, 59, 999)).toISOString();
    
    this.authStore.user$.pipe(
      filter(user => !!user && !!user.id),
      take(1)
    ).subscribe((user) => {
      console.log('user', user);  
      const professionalId = user!.id;
      
      this.agendaStore.loadAgendaConfig(professionalId);
      this.agendaStore.loadAgendaHolidays(professionalId);
      this.agendaStore.loadSummary({ from, to, professionalId });
      this.agendaStore.loadAppointments({ from, to, professionalId: [professionalId] });
    })

    this.summary$.subscribe((summary:any) => {
      if (summary && summary.dailySummary && Array.isArray(summary.dailySummary)) {
        this.data = {
          labels: summary.dailySummary.map((d:any) => d.date),
          datasets: [
            {
              label: 'Completed Appointments',
              data: summary.dailySummary.map((d:any) => d.totalCompleted),
              fill: false,
              borderColor: '#42A5F5',
              tension: .4
            },
            {
              label: 'Cancelled Appointments',
              data: summary.dailySummary.map((d:any) => d.totalCancelled),
              fill: false,
              borderColor: '#FFA726',
              tension: .4
            }
          ]
        };
      }
    });

    this.options = {
      maintainAspectRatio: false,
      aspectRatio: 0.6,
      plugins: {
        legend: {
          labels: {
            color: '#495057'
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#495057'
          },
          grid: {
            color: '#ebedef'
          }
        },
        y: {
          ticks: {
            color: '#495057'
          },
          grid: {
            color: '#ebedef'
          }
        }
      }
    };
  }
}
