import { AuthStore } from '@orb-stores';
import { DashboardStore } from '../../store/dashboard/dashboard.store';
import { DashboardMetricsDto, AppointmentMetricsDto, ConsultationMetricsDto, ClientMetricsDto, RevenueMetricsDto } from '../../api/models';

import { Component, OnInit, signal, computed, inject, effect, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { take, filter, catchError, of } from 'rxjs';
import { NotificationService, WebSocketNotificationService, WebSocketService } from '@orb-services';

import { 
  OrbCardComponent, 
  OrbButtonComponent, 
  OrbChartComponent, 
  OrbProgressBarComponent, 
  OrbTagComponent,
  OrbTableComponent,
  OrbMainHeaderComponent
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
    OrbTableComponent,
    OrbMainHeaderComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  @ViewChildren(OrbChartComponent) charts!: QueryList<OrbChartComponent>;

  // Inject stores first
  private readonly dashboardStore = inject(DashboardStore);
  private readonly authStore = inject(AuthStore);
  private readonly notificationService = inject(NotificationService);
  private readonly webSocketNotificationService = inject(WebSocketNotificationService);
  private readonly webSocketService = inject(WebSocketService);

  // Store observables
  readonly metrics$ = this.dashboardStore.metrics$;
  readonly quickStats$ = this.dashboardStore.quickStats$;
  readonly recentActivities$ = this.dashboardStore.recentActivities$;
  readonly loading$ = this.dashboardStore.loading$;
  readonly currentPeriod$ = this.dashboardStore.currentPeriod$;

  // Derived observables from store
  readonly totalRevenue$ = this.dashboardStore.totalRevenue$;
  readonly todayRevenue$ = this.dashboardStore.todayRevenue$;
  readonly thisWeekRevenue$ = this.dashboardStore.thisWeekRevenue$;
  readonly thisMonthRevenue$ = this.dashboardStore.thisMonthRevenue$;
  readonly totalConsultations$ = this.dashboardStore.totalConsultations$;
  readonly todayConsultations$ = this.dashboardStore.todayConsultations$;
  readonly pendingAppointments$ = this.dashboardStore.pendingAppointments$;
  readonly todayAppointments$ = this.dashboardStore.todayAppointments$;
  readonly activeClients$ = this.dashboardStore.activeClients$;

  // Local signals for UI state
  currentPeriod = signal('current'); // current, 6months, 1year
  isLoading = signal(false);
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
  
  // Computed statistics from local signals (for compatibility)
  totalRevenue = computed(() => this.dashboardMetrics()?.revenue?.totalRevenue || 0);
  totalConsultations = computed(() => this.dashboardMetrics()?.consultations?.total || 0);
  pendingAppointments = computed(() => this.dashboardMetrics()?.appointments?.pending || 0);
  todayConsultations = computed(() => this.dashboardMetrics()?.consultations?.today || 0);
  todayAppointments = computed(() => this.dashboardMetrics()?.appointments?.today || 0);
  activeClients = computed(() => this.dashboardMetrics()?.clients?.active || 0);
  pendingPayments = computed(() => this.dashboardMetrics()?.revenue?.pendingPayments || 0);
  
  // Performance metrics computed from actual data
  revenueGrowth = computed(() => {
    const metrics = this.dashboardMetrics();
    if (!metrics?.revenue) return 0;
    // Calculate growth from thisWeekRevenue vs previous week (approximation)
    const thisWeek = metrics.revenue.thisWeekRevenue;
    const previousWeek = (metrics.revenue.totalRevenue - thisWeek) / 4; // rough estimate
    return previousWeek > 0 ? ((thisWeek - previousWeek) / previousWeek) * 100 : 0;
  });
  
  consultationGrowth = computed(() => {
    const metrics = this.dashboardMetrics();
    if (!metrics?.consultations) return 0;
    // Calculate growth from thisWeek vs previous weeks (approximation)
    const thisWeek = metrics.consultations.thisWeek;
    const previousWeek = (metrics.consultations.total - thisWeek) / 4; // rough estimate
    return previousWeek > 0 ? ((thisWeek - previousWeek) / previousWeek) * 100 : 0;
  });
  
  clientSatisfaction = computed(() => {
    // This should come from a separate satisfaction metrics endpoint when available
    // For now, return a calculated value based on completed vs cancelled consultations
    const metrics = this.dashboardMetrics();
    if (!metrics?.consultations) return 0;
    const total = metrics.consultations.completed + metrics.consultations.cancelled;
    return total > 0 ? (metrics.consultations.completed / total) * 100 : 0;
  });
  
  averageConsultationTime = computed(() => {
    // This should come from consultation time tracking when available
    // For now, return 0 as we don't have this data from backend
    return 0;
  });
  
  // Recent activity data
  recentItems = computed(() => this.recentActivity().slice(0, 5));
  
  // Backwards compatibility for template
  recentInvoices = computed(() => this.recentItems().filter(item => item.type === 'invoice'));
  recentConsultations = computed(() => this.recentItems().filter(item => item.type === 'consultation'));
  pendingInvoices = computed(() => this.pendingPayments());
  
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

  constructor() {
    // Subscribe to store changes and update local signals for compatibility
    effect(() => {
      this.metrics$.pipe(take(1)).subscribe(metrics => {
        if (metrics) {
          this.dashboardMetrics.set(metrics);
          setTimeout(() => this.updateChartComponents(), 0);
        }
      });
    });

    effect(() => {
      this.quickStats$.pipe(take(1)).subscribe(stats => {
        if (stats) {
          this.quickStats.set(stats);
        }
      });
    });

    effect(() => {
      this.recentActivities$.pipe(take(1)).subscribe(activities => {
        this.recentActivity.set(activities || []);
      });
    });

    // Sync store loading state with local signal
    effect(() => {
      this.loading$.pipe(take(1)).subscribe(loading => {
        this.isLoading.set(loading);
      });
    });

    // Effect to update charts when period changes
    effect(() => {
      const period = this.currentPeriod();
      const metrics = this.dashboardMetrics();
      if (metrics && period) {
        this.updateChartData();
        setTimeout(() => this.updateChartComponents(), 0);
      }
    });
  }

  ngOnInit() {
    this.initializeCharts();
    this.loadDashboardData();
    this.setupPeriodicUpdates();
  }

  private loadDashboardData(): void {
    // Use store to load all dashboard data
    this.dashboardStore.refreshDashboard();
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

    // Revenue Chart - Use actual backend data based on selected period
    const period = this.currentPeriod();
    
    if (period === '6months') {
      // For 6 months view, show monthly breakdown (mock data since backend doesn't provide this yet)
      this.revenueChartData = {
        labels: ['Hace 6m', 'Hace 5m', 'Hace 4m', 'Hace 3m', 'Hace 2m', 'Este mes'],
        datasets: [{
          label: 'Ingresos Mensuales',
          data: [
            metrics.revenue.thisMonthRevenue * 0.6,
            metrics.revenue.thisMonthRevenue * 0.7,
            metrics.revenue.thisMonthRevenue * 0.8,
            metrics.revenue.thisMonthRevenue * 0.9,
            metrics.revenue.thisMonthRevenue * 0.95,
            metrics.revenue.thisMonthRevenue || 0
          ],
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderColor: '#3b82f6',
          borderWidth: 3,
          fill: true,
          tension: 0.4
        }]
      };
    } else if (period === '1year') {
      // For 1 year view, show quarterly breakdown
      this.revenueChartData = {
        labels: ['T1', 'T2', 'T3', 'T4'],
        datasets: [{
          label: 'Ingresos Trimestrales',
          data: [
            metrics.revenue.totalRevenue * 0.2,
            metrics.revenue.totalRevenue * 0.25,
            metrics.revenue.totalRevenue * 0.3,
            metrics.revenue.totalRevenue * 0.25
          ],
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderColor: '#3b82f6',
          borderWidth: 3,
          fill: true,
          tension: 0.4
        }]
      };
    } else {
      // Default current period view
      this.revenueChartData = {
        labels: ['Hoy', 'Esta Semana', 'Este Mes', 'Total'],
        datasets: [{
          label: 'Ingresos',
          data: [
            metrics.revenue.todayRevenue || 0,
            metrics.revenue.thisWeekRevenue || 0,
            metrics.revenue.thisMonthRevenue || 0,
            metrics.revenue.totalRevenue || 0
          ],
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderColor: '#3b82f6',
          borderWidth: 3,
          fill: true,
          tension: 0.4
        }]
      };
    }

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

    // Performance metrics chart - Use computed metrics
    const satisfactionRate = this.clientSatisfaction();
    const completionRate = metrics.consultations.total > 0 
      ? (metrics.consultations.completed / metrics.consultations.total) * 100 
      : 0;
    
    this.performanceChartData = {
      labels: ['Satisfacción Cliente', 'Tasa Completado', 'Consultas Activas'],
      datasets: [
        {
          label: 'Métricas (%)',
          data: [
            satisfactionRate,
            completionRate,
            metrics.consultations.inProgress
          ],
          backgroundColor: ['rgba(16, 185, 129, 0.2)', 'rgba(59, 130, 246, 0.2)', 'rgba(245, 158, 11, 0.2)'],
          borderColor: ['#10b981', '#3b82f6', '#f59e0b'],
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
    this.dashboardStore.refreshDashboard();
  }

  private updateChartComponents(): void {
    if (this.charts) {
      this.charts.forEach((chart, index) => {
        let chartData;
        switch (index) {
          case 0: // Revenue chart
            chartData = this.revenueChartData;
            break;
          case 1: // Consultations chart
            chartData = this.consultationsChartData;
            break;
          case 2: // Performance chart
            chartData = this.performanceChartData;
            break;
          default:
            return;
        }
        if (chartData && Object.keys(chartData).length > 0) {
          chart.updateChart(chartData);
        }
      });
    }
  }

}
