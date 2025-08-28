import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { EmailManagementService } from '../../services/email-management.service';
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
                <h3>{{ metrics()?.totalSent || 0 }}</h3>
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
                <h3>{{ metrics()?.totalDelivered || 0 }}</h3>
                <span>Entregados</span>
                <small>{{ metrics()?.deliveryRate || 0 }}% tasa</small>
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
                <h3>{{ metrics()?.totalFailed || 0 }}</h3>
                <span>Fallidos</span>
                <small>{{ metrics()?.bounceRate || 0 }}% rebote</small>
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
                <h3>{{ metrics()?.totalOpened || 0 }}</h3>
                <span>Abiertos</span>
                <small>{{ metrics()?.openRate || 0 }}% tasa</small>
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
              <div *ngIf="loading()" class="loading-center">
                <i class="fa fa-spinner fa-spin"></i>
                <p>Cargando emails recientes...</p>
              </div>

              <p-table 
                *ngIf="!loading()"
                [value]="recentEmails()" 
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
                [value]="failedEmails()" 
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
                  <div class="status-indicator" [class.active]="emailSystemStatus().smtpConnected">
                    <i [class]="emailSystemStatus().smtpConnected ? 'fa fa-check-circle' : 'fa fa-times-circle'"></i>
                  </div>
                  <div class="status-details">
                    <h4>Conexión SMTP</h4>
                    <p>{{ emailSystemStatus().smtpConnected ? 'Conectado' : 'Desconectado' }}</p>
                  </div>
                </div>

                <div class="status-item">
                  <div class="status-indicator" [class.active]="emailSystemStatus().templatesLoaded">
                    <i [class]="emailSystemStatus().templatesLoaded ? 'fa fa-check-circle' : 'fa fa-times-circle'"></i>
                  </div>
                  <div class="status-details">
                    <h4>Plantillas</h4>
                    <p>{{ emailSystemStatus().templatesCount }} plantillas cargadas</p>
                  </div>
                </div>

                <div class="status-item">
                  <div class="status-indicator" [class.active]="emailSystemStatus().queueHealthy">
                    <i [class]="emailSystemStatus().queueHealthy ? 'fa fa-check-circle' : 'fa fa-times-circle'"></i>
                  </div>
                  <div class="status-details">
                    <h4>Cola de Emails</h4>
                    <p>{{ emailSystemStatus().pendingInQueue }} pendientes en cola</p>
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
  private emailService = inject(EmailManagementService);

  // State signals
  loading = signal(false);
  metrics = signal<EmailMetrics | null>(null);
  recentEmails = signal<EmailLogResponseDto[]>([]);
  failedEmails = signal<EmailLogResponseDto[]>([]);
  emailSystemStatus = signal({
    smtpConnected: true,
    templatesLoaded: true,
    templatesCount: 5,
    queueHealthy: true,
    pendingInQueue: 0
  });

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
    this.loadDashboardData();
    this.emailService.refreshMetrics();
  }

  private async loadDashboardData(): Promise<void> {
    this.loading.set(true);

    try {
      // Load metrics
      const dateFilter = this.dateRange?.length === 2 ? {
        from: this.dateRange[0].toISOString(),
        to: this.dateRange[1].toISOString()
      } : undefined;

      const apiMetrics = await this.emailService.getEmailMetrics().toPromise();
      if (apiMetrics) {
        // Convert API response to frontend model
        const metrics = {
          totalSent: apiMetrics.totalSent || 0,
          totalDelivered: apiMetrics.totalSent || 0,
          totalFailed: apiMetrics.totalFailed || 0,
          totalOpened: 0,
          totalClicked: 0,
          deliveryRate: apiMetrics.successRate || 0,
          openRate: 0,
          clickRate: 0,
          bounceRate: 0
        };
        this.metrics.set(metrics);
        this.updateChartData(metrics);
      }

      // Load recent emails
      const emailLogs = await this.emailService.getEmailLogs({ page: 1, limit: 50 }).toPromise();
      if (emailLogs) {
        this.recentEmails.set(emailLogs || []);
        this.failedEmails.set((emailLogs || []).filter(email => email.status === 'failed'));
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Load mock data for development
      this.loadMockData();
    } finally {
      this.loading.set(false);
    }
  }

  private updateChartData(metrics: EmailMetrics): void {
    // Status chart data
    this.statusChartData = {
      labels: ['Entregados', 'Fallidos', 'Pendientes', 'Abiertos'],
      datasets: [{
        data: [
          metrics.totalDelivered,
          metrics.totalFailed,
          metrics.totalSent - metrics.totalDelivered - metrics.totalFailed,
          metrics.totalOpened
        ],
        backgroundColor: [
          '#10b981', // green
          '#ef4444', // red
          '#f59e0b', // amber
          '#3b82f6'  // blue
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

  private loadMockData(): void {
    // Mock metrics
    this.metrics.set({
      totalSent: 1247,
      totalDelivered: 1189,
      totalFailed: 42,
      totalOpened: 856,
      totalClicked: 234,
      deliveryRate: 95.4,
      openRate: 72.0,
      clickRate: 19.7,
      bounceRate: 3.4
    });

    // Mock recent emails
    const mockEmails: EmailLogResponseDto[] = [
      {
        id: '1',
        to: ['usuario@example.com'],
        subject: 'Bienvenido a Orbyt',
        templateUsed: 'welcome',
        status: 'sent',
        sentAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        to: ['test@example.com'],
        subject: 'Restablece tu contraseña',
        templateUsed: 'password_reset',
        status: 'sent',
        sentAt: new Date(Date.now() - 3600000).toISOString(),
        createdAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: '3',
        to: ['error@example.com'],
        subject: 'Alerta de seguridad',
        templateUsed: 'security_alert',
        status: 'failed',
        errorMessage: 'Mailbox does not exist',
        sentAt: new Date(Date.now() - 7200000).toISOString(),
        createdAt: new Date(Date.now() - 7200000).toISOString()
      }
    ];

    this.recentEmails.set(mockEmails);
    this.failedEmails.set(mockEmails.filter(email => email.status === 'failed'));

    this.updateChartData(this.metrics()!);
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

  async retryEmail(email: EmailLogResponseDto): Promise<void> {
    try {
      const response = await this.emailService.retryFailedEmail(email.id?.toString() || '').toPromise();
      
      if (response?.success) {
        // Refresh the data
        this.loadDashboardData();
      }
    } catch (error) {
      console.error('Error retrying email:', error);
    }
  }
}