import { AuthStore } from '@orb-stores';
import { DashboardService } from '../../api/services/dashboard.service';
import { DashboardMetricsDto, AppointmentMetricsDto, ConsultationMetricsDto, ClientMetricsDto, RevenueMetricsDto } from '../../api/models';

import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { take, filter, catchError, of } from 'rxjs';
import { NotificationService, WebSocketNotificationService, WebSocketService } from '@orb-services';

import { 
  OrbCardComponent, 
  OrbButtonComponent, 
  OrbChartComponent, 
  OrbProgressBarComponent, 
  OrbTagComponent,
  OrbTableComponent
} from '@orb-components';

import { TableColumn } from '@orb-models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    OrbCardComponent,
    OrbButtonComponent,
    OrbChartComponent,
    OrbProgressBarComponent,
    OrbTagComponent,
    OrbTableComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  // Signals for reactive data
  currentPeriod = signal('today');
  isLoading = signal(false);
  
  // Dashboard data signals
  dashboardMetrics = signal<DashboardMetricsDto | null>(null);
  quickStats = signal<any>(null);
  recentActivity = signal<any[]>([]);
  
  // Chart data
  revenueChartData: any = {};
  consultationsChartData: any = {};
  appointmentsChartData: any = {};
  performanceChartData: any = {};
  
  // Chart options
  chartOptions: any = {};
  doughnutOptions: any = {};
  barOptions: any = {};
  
  // Computed statistics from API data
  totalRevenue = computed(() => this.dashboardMetrics()?.revenue?.totalRevenue || 0);
  totalConsultations = computed(() => this.dashboardMetrics()?.consultations?.total || 0);
  pendingAppointments = computed(() => this.dashboardMetrics()?.appointments?.pending || 0);
  todayConsultations = computed(() => this.dashboardMetrics()?.consultations?.today || 0);
  todayAppointments = computed(() => this.dashboardMetrics()?.appointments?.today || 0);
  activeClients = computed(() => this.dashboardMetrics()?.clients?.active || 0);
  pendingPayments = computed(() => this.dashboardMetrics()?.revenue?.pendingPayments || 0);
  
  // Performance metrics
  revenueGrowth = signal(12.5);
  consultationGrowth = signal(8.3);
  clientSatisfaction = signal(94);
  
  // Recent activity data
  recentItems = computed(() => this.recentActivity().slice(0, 5));
  
  // Backwards compatibility for template
  recentInvoices = computed(() => this.recentItems().filter(item => item.type === 'invoice'));
  recentConsultations = computed(() => this.recentItems().filter(item => item.type === 'consultation'));
  pendingInvoices = computed(() => this.pendingPayments());
  averageConsultationTime = signal(25);
  
  // Table columns for backwards compatibility
  invoiceColumns: TableColumn[] = [
    { field: 'invoiceNumber', header: 'Número', sortable: false },
    { field: 'client', header: 'Cliente', sortable: false },
    { field: 'total', header: 'Importe', sortable: false },
    { field: 'status', header: 'Estado', sortable: false }
  ];

  consultationColumns: TableColumn[] = [
    { field: 'consultationNumber', header: 'Número', sortable: false },
    { field: 'client', header: 'Cliente', sortable: false },
    { field: 'createdAt', header: 'Fecha', sortable: false },
    { field: 'status', header: 'Estado', sortable: false }
  ];
  
  // Goals and targets
  monthlyRevenueGoal = signal(25000);
  monthlyConsultationsGoal = signal(100);
  currentMonth = new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  // Table columns for recent activity
  activityColumns: TableColumn[] = [
    { field: 'type', header: 'Tipo', sortable: false },
    { field: 'title', header: 'Descripción', sortable: false },
    { field: 'client', header: 'Cliente', sortable: false },
    { field: 'date', header: 'Fecha', sortable: false },
    { field: 'status', header: 'Estado', sortable: false }
  ];

  private readonly dashboardService = inject(DashboardService);
  private readonly authStore = inject(AuthStore);
  private readonly notificationService = inject(NotificationService);
  private readonly webSocketNotificationService = inject(WebSocketNotificationService);
  private readonly webSocketService = inject(WebSocketService);

  constructor() {}

  ngOnInit() {
    this.initializeCharts();
    this.loadDashboardData();
    this.setupPeriodicUpdates();
  }

  private loadDashboardData(): void {
    this.isLoading.set(true);
    
    // Load complete dashboard metrics
    this.dashboardService.dashboardControllerGetMetrics().pipe(
      catchError(error => {
        console.error('Error loading dashboard metrics:', error);
        return of(null);
      })
    ).subscribe(metrics => {
      if (metrics) {
        this.dashboardMetrics.set(metrics);
        this.updateChartData();
      }
    });
    
    // Load quick stats
    this.dashboardService.dashboardControllerGetQuickStats().pipe(
      catchError(error => {
        console.error('Error loading quick stats:', error);
        return of(null);
      })
    ).subscribe(stats => {
      if (stats) {
        this.quickStats.set(stats);
      }
    });
    
    // Load recent activity
    this.dashboardService.dashboardControllerGetRecentActivity().pipe(
      catchError(error => {
        console.error('Error loading recent activity:', error);
        return of([]);
      })
    ).subscribe(activities => {
      this.recentActivity.set(activities || []);
      this.isLoading.set(false);
    });
  }

  private initializeCharts(): void {
    // Base chart options
    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true,
            color: '#64748b'
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: '#64748b'
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: '#f1f5f9'
          },
          ticks: {
            color: '#64748b'
          }
        }
      }
    };

    this.doughnutOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true,
            color: '#64748b'
          }
        }
      },
      cutout: '60%'
    };

    this.barOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: '#64748b'
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: '#f1f5f9'
          },
          ticks: {
            color: '#64748b',
            callback: function(value: any) {
              return '€' + value.toLocaleString();
            }
          }
        }
      }
    };

    this.updateChartData();
  }

  private updateChartData(): void {
    const metrics = this.dashboardMetrics();
    if (!metrics) return;

    // Revenue Chart (simplified for now - last 6 months mock data)
    this.revenueChartData = {
      labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
      datasets: [{
        label: 'Ingresos',
        data: [
          metrics.revenue.totalRevenue * 0.7,
          metrics.revenue.totalRevenue * 0.8,
          metrics.revenue.totalRevenue * 0.9,
          metrics.revenue.totalRevenue * 0.85,
          metrics.revenue.totalRevenue * 0.95,
          metrics.revenue.totalRevenue
        ],
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: '#3b82f6',
        borderWidth: 3,
        fill: true,
        tension: 0.4
      }]
    };

    // Consultations Chart (status distribution)
    this.consultationsChartData = {
      labels: ['Completadas', 'Pendientes', 'En Progreso', 'Canceladas'],
      datasets: [{
        data: [
          metrics.consultations.completed,
          metrics.consultations.pending,
          metrics.consultations.inProgress,
          metrics.consultations.cancelled
        ],
        backgroundColor: [
          '#10b981',
          '#f59e0b', 
          '#3b82f6',
          '#ef4444'
        ],
        borderWidth: 0
      }]
    };

    // Appointments Chart (status distribution)
    this.appointmentsChartData = {
      labels: ['Confirmadas', 'Pendientes', 'Completadas', 'Canceladas'],
      datasets: [{
        data: [
          metrics.appointments.confirmed,
          metrics.appointments.pending,
          metrics.appointments.completed,
          metrics.appointments.cancelled
        ],
        backgroundColor: [
          '#10b981',
          '#f59e0b', 
          '#3b82f6',
          '#ef4444'
        ],
        borderWidth: 0
      }]
    };

    // Performance metrics chart
    this.performanceChartData = {
      labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Satisfacción (%)',
          data: [89, 91, 88, 94, 92, 95],
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          borderColor: '#10b981',
          borderWidth: 2
        },
        {
          label: 'Retención (%)',
          data: [85, 87, 89, 88, 91, 93],
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: '#3b82f6',
          borderWidth: 2
        }
      ]
    };
  }

  private setupPeriodicUpdates(): void {
    // Update data every 5 minutes
    setInterval(() => {
      this.loadDashboardData();
    }, 5 * 60 * 1000);
  }

  // Helper methods
  getRevenueProgress(): number {
    const current = this.totalRevenue();
    const goal = this.monthlyRevenueGoal();
    return Math.min((current / goal) * 100, 100);
  }

  getConsultationsProgress(): number {
    const current = this.totalConsultations();
    const goal = this.monthlyConsultationsGoal();
    return Math.min((current / goal) * 100, 100);
  }

  getTodayRevenue(): number {
    return this.dashboardMetrics()?.revenue?.todayRevenue || 0;
  }

  getThisWeekRevenue(): number {
    return this.dashboardMetrics()?.revenue?.thisWeekRevenue || 0;
  }

  getThisMonthRevenue(): number {
    return this.dashboardMetrics()?.revenue?.thisMonthRevenue || 0;
  }

  getBusinessTypeMetrics() {
    return this.dashboardMetrics()?.businessTypes || [];
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' {
    const severityMap: { [key: string]: 'success' | 'info' | 'warning' | 'danger' } = {
      'paid': 'success',
      'pending': 'warning',
      'draft': 'info',
      'cancelled': 'danger',
      'completed': 'success',
      'in_progress': 'info'
    };
    return severityMap[status] || 'info';
  }

  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      'paid': 'Pagada',
      'pending': 'Pendiente',
      'draft': 'Borrador',
      'cancelled': 'Cancelada',
      'completed': 'Completada',
      'in_progress': 'En Progreso'
    };
    return statusMap[status] || status;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Helper methods for activity data
  getClientName(item: any): string {
    return item.client || 'Cliente no encontrado';
  }

  getActivityTypeLabel(type: string): string {
    const typeMap: { [key: string]: string } = {
      'consultation': 'Consulta',
      'appointment': 'Cita'
    };
    return typeMap[type] || type;
  }

  // Quick actions
  navigateToAppointments(): void {
    // TODO: Navigate to appointments
    console.log('Navigate to appointments');
  }

  navigateToConsultations(): void {
    // TODO: Navigate to consultations
    console.log('Navigate to consultations');
  }

  navigateToClients(): void {
    // TODO: Navigate to clients
    console.log('Navigate to clients');
  }

  navigateToRevenue(): void {
    // TODO: Navigate to revenue/invoices
    console.log('Navigate to revenue');
  }

  // Backwards compatibility methods
  navigateToInvoices(): void {
    this.navigateToRevenue();
  }

  navigateToAgenda(): void {
    this.navigateToAppointments();
  }

  createNewInvoice(): void {
    // TODO: Open new invoice modal
    console.log('Create new invoice');
  }

  refreshData(): void {
    this.loadDashboardData();
  }

}
