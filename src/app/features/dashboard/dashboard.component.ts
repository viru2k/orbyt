import { AuthStore } from '@orb-stores';
import { AgendaStore } from './../../store/agenda/agenda.store';


import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { CardModule } from 'primeng/card';
import { take } from 'rxjs';

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
    const today = new Date();
    const from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const to = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
    this.authStore.user$.pipe(take(1)).subscribe((user) => {
      console.log('user', user);  
          this.agendaStore.loadAgendaConfig(user?.id || 0 );
          this.agendaStore.loadAgendaHolidays(user?.id || 0 );

          this.agendaStore.loadSummary({ from, to, professionalId: user?.id || 0 });
          this.agendaStore.loadAppointments({ startDate: new Date(from), endDate: new Date(to), professionalId: user?.id || 0 });
    })

    this.summary$.subscribe((summary:any) => {
      if (summary) {
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
