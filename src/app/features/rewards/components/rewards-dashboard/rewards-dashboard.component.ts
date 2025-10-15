import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Components
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { OrbTableComponent } from '@orb-shared-components/orb-table/orb-table.component';
import { DatePickerModule } from 'primeng/datepicker';
import { DropdownModule } from 'primeng/dropdown';

// Orb Components
import { OrbCardComponent, OrbButtonComponent, OrbMainHeaderComponent } from '@orb-components';

// Services and Models
import { RewardsManagementService } from '../../services/rewards-management.service';
import { RewardMetrics, RewardActivity, TopRewardProgram } from '../../models/reward.models';
import { TableColumn, OrbTableFeatures } from '@orb-models';

@Component({
  selector: 'app-rewards-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ChartModule,
    ButtonModule,
    TagModule,
    ProgressBarModule,
    OrbTableComponent,
    DatePickerModule,
    DropdownModule,
    OrbCardComponent,
    OrbButtonComponent,
    OrbMainHeaderComponent,
  ],
  template: `
    <!-- Dashboard Header -->
    <orb-main-header
      title="Dashboard de Recompensas"
      icon="fa fa-chart-line"
      subtitle="Análisis y métricas del sistema de fidelización"
    >
    </orb-main-header>

    <div class="header-actions">
      <p-datePicker
        [(ngModel)]="dateRange"
        selectionMode="range"
        [readonlyInput]="true"
        placeholder="Seleccionar período"
        (onSelect)="onDateRangeChange()"
      >
      </p-datePicker>

      <orb-button        
        severity="secondary"
        variant="outlined"
        size="small"
        (clicked)="refreshData()"
      >
      <i class="fa fa-refresh"> </i>
      </orb-button>
    </div>

    <!-- Metrics Cards -->
    <div class="metrics-grid" *ngIf="metrics()">
      <orb-card class="metric-card total">
        <div class="metric-content">
          <div class="metric-icon">
            <i class="fa fa-gift"></i>
          </div>
          <div class="metric-details">
            <h3>{{ metrics()?.totalPrograms || 0 }}</h3>
            <span>Programas Totales</span>
            <small>{{ metrics()?.activePrograms || 0 }} activos</small>
          </div>
        </div>
      </orb-card>

      <orb-card class="metric-card rewards">
        <div class="metric-content">
          <div class="metric-icon">
            <i class="fa fa-star"></i>
          </div>
          <div class="metric-details">
            <h3>{{ metrics()?.totalRewards || 0 | number }}</h3>
            <span>Recompensas Otorgadas</span>
            <small>{{ metrics()?.redeemedRewards || 0 }} canjeadas</small>
          </div>
        </div>
      </orb-card>

      <orb-card class="metric-card points">
        <div class="metric-content">
          <div class="metric-icon">
            <i class="fa fa-coins"></i>
          </div>
          <div class="metric-details">
            <h3>{{ metrics()?.totalPoints || 0 | number }}</h3>
            <span>Puntos Acumulados</span>
            <small>{{ metrics()?.averagePointsPerClient || 0 }} promedio/cliente</small>
          </div>
        </div>
      </orb-card>

      <orb-card class="metric-card redemption">
        <div class="metric-content">
          <div class="metric-icon">
            <i class="fa fa-percentage"></i>
          </div>
          <div class="metric-details">
            <h3>{{ getRedemptionRate() }}%</h3>
            <span>Tasa de Canje</span>
            <small
              >{{ metrics()?.redeemedRewards || 0 }} de {{ metrics()?.totalRewards || 0 }}</small
            >
          </div>
        </div>
      </orb-card>
    </div>

    <!-- Charts Section -->
    <div class="charts-section">
      <div class="charts-grid">
        <!-- Rewards Distribution Chart -->
        <orb-card>
          <div orbHeader>
            <h3>Distribución de Recompensas</h3>
          </div>
          <div orbBody>
            <p-chart
              type="doughnut"
              [data]="rewardsDistributionData"
              [options]="doughnutChartOptions"
              [width]="'300'"
              [height]="'300'"
            >
            </p-chart>
          </div>
        </orb-card>

        <!-- Points Trend Chart -->
        <orb-card>
          <div orbHeader>
            <h3>Tendencia de Puntos</h3>
          </div>
          <div orbBody>
            <p-chart
              type="line"
              [data]="pointsTrendData"
              [options]="lineChartOptions"
              [height]="'300'"
            >
            </p-chart>
          </div>
        </orb-card>
      </div>

      <!-- Top Programs Chart -->
      <orb-card>
        <div orbHeader>
          <h3>Programas Más Populares</h3>
        </div>
        <div orbBody>
          <p-chart type="bar" [data]="topProgramsData" [options]="barChartOptions" [height]="'250'">
          </p-chart>
        </div>
      </orb-card>
    </div>

    <!-- Activity Tables -->
    <div class="activity-section">
      <div class="activity-grid">
        <!-- Top Programs Table -->
        <orb-card>
          <div orbHeader>
            <h3><i class="fa fa-trophy"></i> Programas Destacados</h3>
          </div>
          <div orbBody>
            <orb-table
              [value]="metrics()?.topPrograms || []"
              [columns]="topProgramsColumns"
              [loading]="loading()"
              [tableFeatures]="topProgramsTableFeatures"
              [paginator]="false"
              dataKey="name"
            >
              <ng-template pTemplate="body" let-program let-i="rowIndex" let-columns="columns">
                <tr>
                  <td *ngFor="let col of columns">
                    <ng-container [ngSwitch]="col.field">
                      <ng-container *ngSwitchCase="'program'">
                        <div class="program-rank">
                          <span class="rank-badge">{{ i + 1 }}</span>
                          {{ program.name }}
                        </div>
                      </ng-container>

                      <ng-container *ngSwitchCase="'totalRedemptions'">
                        <strong>{{ program.totalRedemptions | number }}</strong>
                      </ng-container>

                      <ng-container *ngSwitchCase="'totalPoints'">
                        <span class="points-value">{{ program.totalPoints | number }}</span>
                      </ng-container>

                      <ng-container *ngSwitchDefault>
                        {{ program[col.field] }}
                      </ng-container>
                    </ng-container>
                  </td>
                </tr>
              </ng-template>

              <ng-template pTemplate="emptymessage">
                <tr>
                  <td colspan="3" class="empty-message">No hay datos disponibles</td>
                </tr>
              </ng-template>
            </orb-table>
          </div>
        </orb-card>

        <!-- Recent Activity Table -->
        <orb-card>
          <div orbHeader>
            <h3><i class="fa fa-clock"></i> Actividad Reciente</h3>
          </div>
          <div orbBody>
            <orb-table
              [value]="metrics()?.recentActivity || []"
              [columns]="recentActivityColumns"
              [loading]="loading()"
              [tableFeatures]="recentActivityTableFeatures"
              [rows]="5"
              [globalFilterFields]="['clientName', 'programName']"
              dataKey="id"
            >
              <ng-template pTemplate="body" let-activity let-columns="columns">
                <tr>
                  <td *ngFor="let col of columns">
                    <ng-container [ngSwitch]="col.field">
                      <ng-container *ngSwitchCase="'clientName'">
                        {{ activity.clientName }}
                      </ng-container>

                      <ng-container *ngSwitchCase="'activity'">
                        <div class="activity-info">
                          <p-tag
                            [value]="getActivityLabel(activity.type)"
                            [severity]="getActivitySeverity(activity.type)"
                          >
                          </p-tag>
                          <small>{{ activity.programName }}</small>
                        </div>
                      </ng-container>

                      <ng-container *ngSwitchCase="'points'">
                        <span [class]="'points-' + activity.type">
                          {{ activity.type === 'earned' ? '+' : '-' }}{{ activity.points }}
                        </span>
                      </ng-container>

                      <ng-container *ngSwitchCase="'date'">
                        <small>{{ formatDate(activity.date) }}</small>
                      </ng-container>

                      <ng-container *ngSwitchDefault>
                        {{ activity[col.field] }}
                      </ng-container>
                    </ng-container>
                  </td>
                </tr>
              </ng-template>

              <ng-template pTemplate="emptymessage">
                <tr>
                  <td colspan="4" class="empty-message">No hay actividad reciente</td>
                </tr>
              </ng-template>
            </orb-table>
          </div>
        </orb-card>
      </div>
    </div>
  `,
  styleUrls: ['./rewards-dashboard.component.scss'],
})
export class RewardsDashboardComponent implements OnInit {
  private rewardsService = inject(RewardsManagementService);

  // State signals
  metrics = signal<RewardMetrics | null>(null);
  loading = signal(false);
  dateRange: Date[] = [];

  // Chart data
  rewardsDistributionData: any;
  pointsTrendData: any;
  topProgramsData: any;

  // Chart options
  doughnutChartOptions: any;
  lineChartOptions: any;
  barChartOptions: any;

  // Table columns and features - These properties were missing but referenced in template
  topProgramsColumns: TableColumn[] = [
    { field: 'program', header: 'Programa' },
    { field: 'totalRedemptions', header: 'Canjes' },
    { field: 'totalPoints', header: 'Puntos' },
  ];

  recentActivityColumns: TableColumn[] = [
    { field: 'clientName', header: 'Cliente' },
    { field: 'activity', header: 'Acción' },
    { field: 'points', header: 'Puntos' },
    { field: 'date', header: 'Fecha' },
  ];

  topProgramsTableFeatures: OrbTableFeatures = {
    showGlobalSearch: false,
  };

  recentActivityTableFeatures: OrbTableFeatures = {
    showGlobalSearch: true,
    globalSearchPlaceholder: 'Buscar actividad...',
  };

  ngOnInit(): void {
    this.initializeChartOptions();
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading.set(true);

    this.rewardsService.loadMetrics().subscribe({
      next: (metrics) => {
        this.metrics.set(metrics);
        this.updateChartData();
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading rewards metrics:', error);
        this.loading.set(false);
      },
    });
  }

  private initializeChartOptions(): void {
    const textColor = '#6b7280';
    const surfaceBorder = '#e5e7eb';

    this.doughnutChartOptions = {
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: textColor,
          },
        },
      },
      maintainAspectRatio: false,
    };

    this.lineChartOptions = {
      plugins: {
        legend: {
          labels: {
            color: textColor,
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: textColor,
          },
          grid: {
            color: surfaceBorder,
          },
        },
        y: {
          ticks: {
            color: textColor,
          },
          grid: {
            color: surfaceBorder,
          },
        },
      },
      maintainAspectRatio: false,
    };

    this.barChartOptions = {
      indexAxis: 'y',
      plugins: {
        legend: {
          labels: {
            color: textColor,
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: textColor,
          },
          grid: {
            color: surfaceBorder,
          },
        },
        y: {
          ticks: {
            color: textColor,
          },
          grid: {
            color: surfaceBorder,
          },
        },
      },
      maintainAspectRatio: false,
    };
  }

  private updateChartData(): void {
    const metrics = this.metrics();
    if (!metrics) return;

    // Rewards Distribution Chart
    this.rewardsDistributionData = {
      labels: ['Canjeadas', 'Pendientes', 'Expiradas'],
      datasets: [
        {
          data: [
            metrics.redeemedRewards,
            metrics.totalRewards - metrics.redeemedRewards,
            Math.floor(metrics.totalRewards * 0.05), // Mock expired
          ],
          backgroundColor: ['#10b981', '#3b82f6', '#ef4444'],
          borderColor: ['#059669', '#2563eb', '#dc2626'],
          borderWidth: 2,
        },
      ],
    };

    // Points Trend Chart
    this.pointsTrendData = {
      labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Puntos Otorgados',
          data: [2500, 3200, 2800, 4100, 3600, 4200],
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true,
        },
        {
          label: 'Puntos Canjeados',
          data: [1800, 2100, 2400, 2800, 3100, 3400],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true,
        },
      ],
    };

    // Top Programs Chart
    this.topProgramsData = {
      labels: metrics.topPrograms.map((p) => p.name),
      datasets: [
        {
          label: 'Total de Canjes',
          data: metrics.topPrograms.map((p) => p.totalRedemptions),
          backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
          borderColor: ['#2563eb', '#059669', '#d97706'],
          borderWidth: 1,
        },
      ],
    };
  }

  onDateRangeChange(): void {
    if (this.dateRange && this.dateRange.length === 2) {
      this.loadDashboardData();
    }
  }

  refreshData(): void {
    this.loadDashboardData();
  }

  getRedemptionRate(): number {
    const metrics = this.metrics();
    if (!metrics || metrics.totalRewards === 0) return 0;
    return Math.round((metrics.redeemedRewards / metrics.totalRewards) * 100);
  }

  getActivityLabel(type: string): string {
    switch (type) {
      case 'earned':
        return 'Ganó';
      case 'redeemed':
        return 'Canjeó';
      default:
        return type;
    }
  }

  getActivitySeverity(type: string): string {
    switch (type) {
      case 'earned':
        return 'success';
      case 'redeemed':
        return 'info';
      default:
        return 'secondary';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
