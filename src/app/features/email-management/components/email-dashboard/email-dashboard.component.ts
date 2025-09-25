import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Components
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { TabViewModule } from 'primeng/tabview';
import { TableModule } from 'primeng/table';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';

// Orb Components
import { 
  OrbCardComponent, 
  OrbButtonComponent 
} from '@orb-components';

// Services and Models
import { EmailManagementStore } from '../../../../store/email-management/email-management.store';
import { 
  EmailMetrics, 
  EmailStatus,
  EmailTemplateType 
} from '../../models/email.models';
import { EmailLogResponseDto, EmailMetricsResponseDto } from 'src/app/api/models';

@Component({
  selector: 'app-email-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    AsyncPipe,
    FormsModule,
    CardModule,
    ChartModule,
    ButtonModule,
    TagModule,
    ProgressBarModule,
    TabViewModule,
    TableModule,
    CalendarModule,
    DropdownModule,
    OrbCardComponent,
    OrbButtonComponent
  ],
  template: `
    <div class="email-dashboard-container">
      <!-- Header -->
      <div class="dashboard-header">
        <h1><i class="fa fa-chart-line"></i> Dashboard de Emails</h1>
        <p>Monitoreo y análisis del sistema de correos electrónicos</p>
        
        <!-- Date Range Filter -->
        <div class="date-filter">
          <label>Período:</label>
          <p-calendar 
            [(ngModel)]="dateRange"
            selectionMode="range" 
            [readonlyInput]="true"            
            (onSelect)="onDateRangeChange($event)">
          </p-calendar>
          <button 
            type="button" 
            class="btn-refresh"
            (click)="refreshData()"
            title="Actualizar datos">
            <i class="fa fa-refresh"></i>
          </button>
        </div>
      </div>

      <!-- Metrics Overview -->
      <div class="metrics-grid">
        <orb-card class="metric-card total">
          <div orbBody>
            <div class="metric-content">
              <div class="metric-icon">
                <i class="fa fa-envelope"></i>
              </div>
              <div class="metric-details">
                <h3>{{ (metrics | async)?.totalSent || 0 }}</h3>
                <span>Emails Enviados</span>
              </div>
            </div>
          </div>
        </orb-card>

        <orb-card class="metric-card delivered">
          <div orbBody>
            <div class="metric-content">
              <div class="metric-icon">
                <i class="fa fa-check-circle"></i>
              </div>
              <div class="metric-details">
                <h3>{{ ((metrics | async)?.totalSent || 0) - ((metrics | async)?.totalFailed || 0) }}</h3>
                <span>Entregados</span>
                <small>{{ (metrics | async)?.successRate || 0 }}% tasa</small>
              </div>
            </div>
          </div>
        </orb-card>

        <orb-card class="metric-card failed">
          <div orbBody>
            <div class="metric-content">
              <div class="metric-icon">
                <i class="fa fa-times-circle"></i>
              </div>
              <div class="metric-details">
                <h3>{{ (metrics | async)?.totalFailed || 0 }}</h3>
                <span>Fallidos</span>
                <small>{{ (100 - ((metrics | async)?.successRate || 0)) }}% rebote</small>
              </div>
            </div>
          </div>
        </orb-card>

        <orb-card class="metric-card opened">
          <div orbBody>
            <div class="metric-content">
              <div class="metric-icon">
                <i class="fa fa-eye"></i>
              </div>
              <div class="metric-details">
                <h3>{{ (metrics | async)?.totalPending || 0 }}</h3>
                <span>Pendientes</span>
                <small>En cola</small>
              </div>
            </div>
          </div>
        </orb-card>
      </div>

      <!-- Charts Section -->
      <div class="charts-section">
        <div class="charts-grid">
          <!-- Email Status Chart -->
          <orb-card>
            <div orbHeader>
              <h3>Estado de Emails</h3>
            </div>
            <div orbBody>
              <p-chart 
                type="doughnut" 
                [data]="statusChartData" 
                [options]="doughnutChartOptions"
                [width]="'300'"
                [height]="'300'">
              </p-chart>
            </div>
          </orb-card>

          <!-- Email Types Chart -->
          <orb-card>
            <div orbHeader>
              <h3>Tipos de Email</h3>
            </div>
            <div orbBody>
              <p-chart 
                type="bar" 
                [data]="typesChartData" 
                [options]="barChartOptions"
                [height]="'300'">
              </p-chart>
            </div>
          </orb-card>
        </div>

        <!-- Timeline Chart -->
        <orb-card>
          <div orbHeader>
            <h3>Evolución de Emails</h3>
          </div>
          <div orbBody>
            <p-chart 
              type="line" 
              [data]="timelineChartData" 
              [options]="lineChartOptions"
              [height]="'250'">
            </p-chart>
          </div>
        </orb-card>
      </div>

      <!-- Recent Activity -->
      <p-tabView>
        <!-- Recent Emails Tab -->
        <p-tabPanel header="Emails Recientes" leftIcon="pi pi-clock">
          <orb-card>
            <div orbBody>
              <div *ngIf="loading | async" class="loading-center">
                <i class="fa fa-spinner fa-spin"></i>
                <p>Cargando emails recientes...</p>
              </div>

              <p-table 
*ngIf="!(loading | async)"
[value]="(recentEmails | async) || []" 
                [paginator]="true" 
                [rows]="10"
                [rowsPerPageOptions]="[10, 25, 50]"
                [sortField]="'sentAt'" 
                [sortOrder]="-1">
                
                <ng-template pTemplate="header">
                  <tr>
                    <th pSortableColumn="to">
                      Destinatario 
                      <p-sortIcon field="to"></p-sortIcon>
                    </th>
                    <th pSortableColumn="subject">
                      Asunto
                      <p-sortIcon field="subject"></p-sortIcon>
                    </th>
                    <th pSortableColumn="templateType">
                      Tipo
                      <p-sortIcon field="templateType"></p-sortIcon>
                    </th>
                    <th pSortableColumn="status">
                      Estado
                      <p-sortIcon field="status"></p-sortIcon>
                    </th>
                    <th pSortableColumn="sentAt">
                      Enviado
                      <p-sortIcon field="sentAt"></p-sortIcon>
                    </th>
                  </tr>
                </ng-template>
                
                <ng-template pTemplate="body" let-email>
                  <tr>
                    <td>{{ email.to }}</td>
                    <td>{{ email.subject }}</td>
                    <td>
                      <p-tag [value]="getTemplateTypeLabel(email.templateUsed)" severity="info"></p-tag>
                    </td>
                    <td>
                      <p-tag 
                        [value]="getStatusLabel(email.status)" 
                        [severity]="getStatusSeverity(email.status)">
                      </p-tag>
                    </td>
                    <td>{{ formatDate(email.sentAt) }}</td>
                  </tr>
                </ng-template>
                
                <ng-template pTemplate="emptymessage">
                  <tr>
                    <td colspan="5" class="empty-message">
                      No hay emails recientes para mostrar
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            </div>
          </orb-card>
        </p-tabPanel>

        <!-- Failed Emails Tab -->
        <p-tabPanel header="Emails Fallidos" leftIcon="pi pi-times-circle">
          <orb-card>
            <div orbBody>
              <p-table 
[value]="(failedEmails | async) || []" 
                [paginator]="true" 
                [rows]="10"
                [sortField]="'sentAt'" 
                [sortOrder]="-1">
                
                <ng-template pTemplate="header">
                  <tr>
                    <th>Destinatario</th>
                    <th>Asunto</th>
                    <th>Error</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                  </tr>
                </ng-template>
                
                <ng-template pTemplate="body" let-email>
                  <tr>
                    <td>{{ email.to }}</td>
                    <td>{{ email.subject }}</td>
                    <td class="error-cell">{{ email.error }}</td>
                    <td>{{ formatDate(email.sentAt) }}</td>
                    <td>
                      <orb-button
                        label="Reintentar"
                        icon="fa fa-redo"
                        size="small"
                        variant="secondary"
                        (clicked)="retryEmail(email)">
                      </orb-button>
                    </td>
                  </tr>
                </ng-template>
                
                <ng-template pTemplate="emptymessage">
                  <tr>
                    <td colspan="5" class="empty-message">
                      No hay emails fallidos 🎉
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            </div>
          </orb-card>
        </p-tabPanel>

        <!-- System Status Tab -->
        <p-tabPanel header="Estado del Sistema" leftIcon="pi pi-cog">
          <orb-card>
            <div orbBody>
              <div class="system-status">
                <div class="status-item">
                  <div class="status-indicator" [class.active]="(emailSystemStatus | async)?.smtpConnected">
                    <i [class]="(emailSystemStatus | async)?.smtpConnected ? 'fa fa-check-circle' : 'fa fa-times-circle'"></i>
                  </div>
                  <div class="status-details">
                    <h4>Conexión SMTP</h4>
                    <p>{{ (emailSystemStatus | async)?.smtpConnected ? 'Conectado' : 'Desconectado' }}</p>
                  </div>
                </div>

                <div class="status-item">
                  <div class="status-indicator" [class.active]="(emailSystemStatus | async)?.templatesLoaded">
                    <i [class]="(emailSystemStatus | async)?.templatesLoaded ? 'fa fa-check-circle' : 'fa fa-times-circle'"></i>
                  </div>
                  <div class="status-details">
                    <h4>Plantillas</h4>
                    <p>{{ (emailSystemStatus | async)?.templatesCount }} plantillas cargadas</p>
                  </div>
                </div>

                <div class="status-item">
                  <div class="status-indicator" [class.active]="(emailSystemStatus | async)?.queueHealthy">
                    <i [class]="(emailSystemStatus | async)?.queueHealthy ? 'fa fa-check-circle' : 'fa fa-times-circle'"></i>
                  </div>
                  <div class="status-details">
                    <h4>Cola de Emails</h4>
                    <p>{{ (emailSystemStatus | async)?.pendingInQueue }} pendientes en cola</p>
                  </div>
                </div>
              </div>
            </div>
          </orb-card>
        </p-tabPanel>
      </p-tabView>
    </div>
  `,
  styleUrls: ['./email-dashboard.component.scss']
})
export class EmailDashboardComponent implements OnInit {
  private emailStore = inject(EmailManagementStore);

  // Store selectors
  loading = this.emailStore.loading$;
  metrics = this.emailStore.metrics$;
  recentEmails = this.emailStore.recentEmails$;
  failedEmails = this.emailStore.failedEmails$;
  emailSystemStatus = this.emailStore.systemStatus$;

  // Date filter
  dateRange: Date[] = [];

  // Chart data
  statusChartData: any = {};
  typesChartData: any = {};
  timelineChartData: any = {};
  
  // Chart options
  doughnutChartOptions: any = {};
  barChartOptions: any = {};
  lineChartOptions: any = {};

  ngOnInit(): void {
    this.initializeChartOptions();
    this.setDefaultDateRange();
    this.loadDashboardData();
    this.updateChartData();
  }

  private setDefaultDateRange(): void {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Last 30 days
    this.dateRange = [startDate, endDate];
  }

  private initializeChartOptions(): void {
    // Doughnut chart options
    this.doughnutChartOptions = {
      plugins: {
        legend: {
          position: 'bottom'
        }
      },
      responsive: true,
      maintainAspectRatio: false
    };

    // Bar chart options
    this.barChartOptions = {
      plugins: {
        legend: {
          display: false
        }
      },
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    };

    // Line chart options
    this.lineChartOptions = {
      plugins: {
        legend: {
          position: 'top'
        }
      },
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'day'
          }
        },
        y: {
          beginAtZero: true
        }
      }
    };
  }

  onDateRangeChange(event?: any): void {
    if (this.dateRange && this.dateRange.length === 2) {
      this.loadDashboardData();
    }
  }

  refreshData(): void {
    this.emailStore.refreshDashboard();
  }

  private loadDashboardData(): void {
    const dateFilter = this.dateRange?.length === 2 ? {
      from: this.dateRange[0].toISOString(),
      to: this.dateRange[1].toISOString()
    } : undefined;

    this.emailStore.loadEmailMetrics(dateFilter || {});
    this.emailStore.loadEmailLogs({ page: 1, limit: 50 });
  }

  private updateChartData(): void {
    // Chart data will be handled by subscribing to store metrics
    this.metrics.subscribe(metrics => {
      if (metrics) {
        // Status chart data
        this.statusChartData = {
          labels: ['Entregados', 'Fallidos', 'Pendientes'],
          datasets: [{
            data: [
              (metrics.totalSent || 0) - (metrics.totalFailed || 0),
              metrics.totalFailed || 0,
              metrics.totalPending || 0
            ],
            backgroundColor: [
              '#10b981', // green
              '#ef4444', // red
              '#f59e0b'  // amber
            ],
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        };

        // Types chart data - mock data for now
        this.typesChartData = {
          labels: ['Bienvenida', 'Reset Password', 'Seguridad', 'Prueba'],
          datasets: [{
            label: 'Emails por Tipo',
            data: [45, 30, 15, 25],
            backgroundColor: '#3b82f6',
            borderColor: '#1d4ed8',
            borderWidth: 2
          }]
        };

        // Timeline chart data - mock data for now
        this.timelineChartData = {
          labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sab', 'Dom'],
          datasets: [
            {
              label: 'Enviados',
              data: [12, 19, 15, 25, 22, 8, 5],
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.4
            },
            {
              label: 'Entregados',
              data: [11, 18, 14, 23, 21, 7, 4],
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              tension: 0.4
            }
          ]
        };
      }
    });
  }

  private loadMockData(): void {
    // Mock data loading is now handled by the store
    // This method is kept for compatibility but doesn't do anything
  }

  // Helper methods
  getStatusLabel(status: EmailStatus): string {
    const statusMap: { [key: string]: string } = {
      [EmailStatus.PENDING]: 'Pendiente',
      [EmailStatus.SENT]: 'Enviado',
      [EmailStatus.DELIVERED]: 'Entregado',
      [EmailStatus.FAILED]: 'Fallido',
      [EmailStatus.BOUNCED]: 'Rebotado',
      [EmailStatus.OPENED]: 'Abierto',
      [EmailStatus.CLICKED]: 'Clickeado'
    };
    return statusMap[status] || status;
  }

  getStatusSeverity(status: EmailStatus): 'success' | 'info' | 'warning' | 'danger' {
    const severityMap: { [key: string]: 'success' | 'info' | 'warning' | 'danger' } = {
      [EmailStatus.PENDING]: 'warning',
      [EmailStatus.SENT]: 'info',
      [EmailStatus.DELIVERED]: 'success',
      [EmailStatus.FAILED]: 'danger',
      [EmailStatus.BOUNCED]: 'danger',
      [EmailStatus.OPENED]: 'success',
      [EmailStatus.CLICKED]: 'success'
    };
    return severityMap[status] || 'info';
  }

  getTemplateTypeLabel(type?: string): string {
    if (!type) return 'Sin plantilla';
    
    const typeMap: { [key: string]: string } = {
      'welcome': 'Bienvenida',
      'password_reset': 'Reset Password',
      'security_alert': 'Alerta Seguridad',
      'password_changed': 'Password Cambiado',
      'account_lockout': 'Cuenta Bloqueada',
      'test': 'Prueba'
    };
    return typeMap[type] || type;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  retryEmail(email: EmailLogResponseDto): void {
    if (email.id) {
      this.emailStore.retryFailedEmail(email.id);
    }
  }
}