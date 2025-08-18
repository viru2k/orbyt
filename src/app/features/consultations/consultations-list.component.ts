import { OrbTextInputGroupComponent } from './../../../../shared/components/orb-text-input-group/orb-text-input-group.component';
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ChartModule } from 'primeng/chart';
import { MessageService, ConfirmationService } from 'primeng/api';

import { OrbActionsPopoverComponent, OrbTableComponent, OrbCardComponent, OrbButtonComponent, OrbDialogComponent } from '@orb-components';

import { ConsultationsService } from '../../api/services/consultations.service';
import { ConsultationResponseDto } from '../../api/models/consultation-response-dto';
import { TableColumn, OrbActionItem } from '@orb-models';
import { ConsultationFormComponent } from './components/consultation-form.component';
import { ConsultationDetailsComponent } from './components/consultation-details.component';
import { ConsultationStore } from './store/consultation.store';

@Component({
  selector: 'app-consultations-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TagModule,
    DialogModule,
    ToastModule,
    ConfirmDialogModule,
    ChartModule,
    OrbActionsPopoverComponent,
    OrbTableComponent,
    OrbCardComponent,
    OrbButtonComponent,
    OrbDialogComponent,
    ConsultationFormComponent,
    ConsultationDetailsComponent,
    OrbTextInputGroupComponent
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <orb-card>
      <div orbHeader>
        <h2><i class="fa fa-stethoscope"></i> Gestión de Consultas Médicas</h2>
        <div class="header-actions">
          <orb-button 
            label="Nueva Consulta" 
            icon="fa fa-plus" 
            (clicked)="openNewConsultationDialog()"
            variant="success">
          </orb-button>
          <orb-button 
            label="Estadísticas" 
            icon="fa fa-chart-line" 
            (clicked)="viewStats()"
            variant="secondary">
          </orb-button>
        </div>
      </div>

      <div orbBody>
        <div class="stats-cards">
          <div class="stat-card">
            <div class="stat-content">
              <div class="stat-icon">
                <i class="fa fa-stethoscope"></i>
              </div>
              <div class="stat-details">
                <h3>{{ consultationStore.totalConsultations() }}</h3>
                <p>Total Consultas</p>
              </div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-content">
              <div class="stat-icon pending">
                <i class="fa fa-clock"></i>
              </div>
              <div class="stat-details">
                <h3>{{ consultationStore.pendingConsultations() }}</h3>
                <p>Pendientes</p>
              </div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-content">
              <div class="stat-icon completed">
                <i class="fa fa-check-circle"></i>
              </div>
              <div class="stat-details">
                <h3>{{ consultationStore.completedConsultations() }}</h3>
                <p>Completadas</p>
              </div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-content">
              <div class="stat-icon today">
                <i class="fa fa-calendar-day"></i>
              </div>
              <div class="stat-details">
                <h3>{{ consultationStore.consultationsToday() }}</h3>
                <p>Hoy</p>
              </div>
            </div>
          </div>
        </div>

        <div class="filters-section">
          <div class="filters-grid">
            <div class="filter-item">
              <label>Estado:</label>
              <p-select 
                [options]="statusOptions" 
                [(ngModel)]="selectedStatus"
                placeholder="Todos los estados"
                optionLabel="label"
                optionValue="value"
                [showClear]="true"
                (onChange)="loadConsultations()">
              </p-select>
            </div>
            <div class="filter-item">
              <label>Búsqueda:</label>
              <orb-text-input-group 
                [icon]="'fa fa-search'"   
                type="text" 
                [(ngModel)]="searchTerm"
                placeholder="Buscar por cliente, síntomas..."
                (input)="onSearch()">
              </orb-text-input-group>
            </div>
          </div>
        </div>

        <orb-table
          [value]="consultationStore.filteredConsultations()"
          [columns]="columns"
          [loading]="consultationStore.loading()"
          [rowActions]="actions"
          [paginator]="true"
          [rows]="10"
          [rowsPerPageOptions]="[10, 25, 50]"
        >
          <ng-template pTemplate="body" let-consultation let-columns="columns">
            <tr>
              <td *ngFor="let col of columns">
                <ng-container [ngSwitch]="col.field">
                  <ng-container *ngSwitchCase="'actions'">
                    <orb-actions-popover
                      [actions]="actions"
                      [itemData]="consultation">
                    </orb-actions-popover>
                  </ng-container>
                  
                  <ng-container *ngSwitchCase="'consultationNumber'">
                    <strong>{{ consultation.consultationNumber }}</strong>
                  </ng-container>
                  
                  <ng-container *ngSwitchCase="'client'">
                    <div class="client-info">
                      <strong>{{ getClientName(consultation) }}</strong>
                      <small>{{ getClientEmail(consultation) }}</small>
                    </div>
                  </ng-container>
                  
                  <ng-container *ngSwitchCase="'createdAt'">
                    <div class="date-info">
                      <div>{{ formatDate(consultation.createdAt) }}</div>
                      <small *ngIf="consultation.startTime">
                        {{ formatTime(consultation.startTime) }} - {{ formatTime(consultation.endTime) }}
                      </small>
                    </div>
                  </ng-container>
                  
                  <ng-container *ngSwitchCase="'symptoms'">
                    <div class="symptoms-preview">
                      {{ consultation.symptoms || 'Sin síntomas especificados' }}
                    </div>
                  </ng-container>
                  
                  <ng-container *ngSwitchCase="'status'">
                    <p-tag 
                      [value]="getStatusLabel(consultation.status)" 
                      [severity]="getStatusSeverity(consultation.status)">
                    </p-tag>
                  </ng-container>
                  
                  <ng-container *ngSwitchDefault>
                    {{ consultation[col.field] }}
                  </ng-container>
                </ng-container>
              </td>
            </tr>
          </ng-template>
        </orb-table>
      </div>
    </orb-card>

    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>

    <!-- Statistics Modal -->
    <orb-dialog
      [visible]="displayStatsModal()"
      (visibleChange)="displayStatsModal.set($event)"
      header="📊 Estadísticas de Consultas"
      size="xl"
      (onHide)="onStatsModalClose()"
    >
      <div class="stats-modal-content">
        <!-- Summary Cards -->
        <div class="stats-summary-grid">
          <div class="summary-card">
            <div class="summary-icon">🩺</div>
            <div class="summary-details">
              <h3>{{ consultationStore.totalConsultations() }}</h3>
              <p>Total Consultas</p>
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-icon">⏰</div>
            <div class="summary-details">
              <h3>{{ consultationStore.pendingConsultations() }}</h3>
              <p>Pendientes</p>
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-icon">✅</div>
            <div class="summary-details">
              <h3>{{ consultationStore.completedConsultations() }}</h3>
              <p>Completadas</p>
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-icon">📋</div>
            <div class="summary-details">
              <h3>{{ consultationStore.consultationsNeedingFollowUp() }}</h3>
              <p>Seguimiento</p>
            </div>
          </div>
        </div>

        <!-- Charts Section -->
        <div class="charts-section">
          <div class="chart-container">
            <h4>Estado de Consultas</h4>
            <p-chart 
              type="doughnut" 
              [data]="statusChartData" 
              [options]="chartOptions"
              width="300"
              height="300">
            </p-chart>
          </div>
          
          <div class="chart-container">
            <h4>Consultas por Mes</h4>
            <p-chart 
              type="bar" 
              [data]="monthlyChartData" 
              [options]="barChartOptions"
              [width]="'400'"
              [height]="'300'">
            </p-chart>
          </div>
        </div>

        <!-- Additional Stats -->
        <div class="additional-stats">
          <div class="stat-row">
            <span class="stat-label">Duración Promedio:</span>
            <span class="stat-value">{{ consultationStore.averageConsultationDuration() }} minutos</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Consultas Hoy:</span>
            <span class="stat-value">{{ consultationStore.consultationsToday() }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">En Progreso:</span>
            <span class="stat-value">{{ consultationStore.inProgressConsultations() }}</span>
          </div>
        </div>
      </div>
    </orb-dialog>

    <!-- Consultation Form Modal -->
    <orb-dialog
      [visible]="displayFormModal()"
      (visibleChange)="displayFormModal.set($event)"
      [header]="isEditMode ? '✏️ Editar Consulta' : '➕ Nueva Consulta'"
      size="xl"
      (onHide)="onFormModalClose()"
    >
      <app-consultation-form
        [visible]="displayFormModal()"
        [consultation]="selectedConsultationForEdit || null"
        (consultationSaved)="onConsultationSaved($event)"
        (visibleChange)="onFormModalClose()">
      </app-consultation-form>
    </orb-dialog>

    <!-- Consultation Details Modal -->
    <app-consultation-details
      [visible]="displayDetailsModal()"
      (visibleChange)="displayDetailsModal.set($event)"
      [consultation]="selectedConsultationForView"
      (edit)="onEditFromDetails($event)"
      (generateInvoice)="onGenerateInvoiceFromDetails($event)">
    </app-consultation-details>
  `,
  styleUrls: ['./consultations-list.component.scss']
})
export class ConsultationsListComponent implements OnInit {
  selectedStatus: string | null = null;
  searchTerm = '';

  // Modal states
  displayStatsModal = signal(false);
  displayFormModal = signal(false);
  displayDetailsModal = signal(false);

  // Selected consultations for modals
  selectedConsultationForEdit: ConsultationResponseDto | undefined;
  selectedConsultationForView: ConsultationResponseDto | undefined;
  isEditMode = false;

  // Chart Data
  statusChartData: any = {};
  monthlyChartData: any = {};
  chartOptions: any = {};
  barChartOptions: any = {};

  statusOptions = [
    { label: 'Pendiente', value: 'pending' },
    { label: 'En Progreso', value: 'in_progress' },
    { label: 'Completada', value: 'completed' },
    { label: 'Cancelada', value: 'cancelled' }
  ];

  // Table columns
  columns: TableColumn[] = [
    { field: 'consultationNumber', header: 'Número', sortable: true },
    { field: 'client', header: 'Cliente', sortable: true },
    { field: 'createdAt', header: 'Fecha/Hora', sortable: true },
    { field: 'symptoms', header: 'Síntomas', sortable: false },
    { field: 'status', header: 'Estado', sortable: true },
    { field: 'actions', header: 'Acciones', sortable: false, width: '10px' }
  ];

  // Action items for popover
  actions: OrbActionItem<ConsultationResponseDto>[] = [
    {
      label: 'Ver Detalles',
      icon: 'fas fa-eye',
      action: (item?: ConsultationResponseDto) => item && this.viewConsultation(item)
    },
    {
      label: 'Editar',
      icon: 'fas fa-edit',
      action: (item?: ConsultationResponseDto) => item && this.editConsultation(item),
      visible: (item?: ConsultationResponseDto) => item?.status !== 'completed' && item?.status !== 'cancelled'
    },
    {
      label: 'Generar Factura',
      icon: 'fas fa-file-invoice',
      action: (item?: ConsultationResponseDto) => item && this.generateInvoice(item),
      visible: (item?: ConsultationResponseDto) => item?.status === 'completed'
    },
    {
      label: 'Cancelar',
      icon: 'fas fa-times-circle',
      action: (item?: ConsultationResponseDto) => item && this.confirmCancelConsultation(item),
      visible: (item?: ConsultationResponseDto) => item?.status !== 'completed' && item?.status !== 'cancelled'
    }
  ];

  constructor(
    private consultationsService: ConsultationsService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    public consultationStore: ConsultationStore
  ) {}

  ngOnInit() {
    this.loadConsultations();
    this.initializeChartOptions();
  }

  loadConsultations() {
    const params: any = {};
    if (this.selectedStatus) {
      params.status = this.selectedStatus;
    }
    if (this.searchTerm) {
      params.search = this.searchTerm;
    }

    this.consultationStore.setFilters({ 
      status: this.selectedStatus || undefined, 
      search: this.searchTerm || undefined 
    });
    this.consultationStore.loadConsultations(params);
  }

  onSearch() {
    this.consultationStore.setFilters({ search: this.searchTerm || undefined });
    setTimeout(() => {
      this.loadConsultations();
    }, 300);
  }

  performSearch() {
    this.loadConsultations();
  }

  openNewConsultationDialog() {
    this.isEditMode = false;
    this.selectedConsultationForEdit = undefined;
    this.displayFormModal.set(true);
  }

  viewStats() {
    this.updateChartData();
    this.displayStatsModal.set(true);
  }

  viewConsultation(consultation: ConsultationResponseDto) {
    this.selectedConsultationForView = consultation;
    this.displayDetailsModal.set(true);
  }

  editConsultation(consultation: ConsultationResponseDto) {
    this.isEditMode = true;
    this.selectedConsultationForEdit = consultation;
    this.displayFormModal.set(true);
  }

  generateInvoice(consultation: ConsultationResponseDto) {
    this.messageService.add({
      severity: 'info',
      summary: 'Generando Factura',
      detail: `Preparando factura para consulta ${consultation.consultationNumber}...`
    });
    // TODO: Implementar navegación a facturas con datos pre-populados
  }

  confirmCancelConsultation(consultation: ConsultationResponseDto): void {
    this.confirmationService.confirm({
      message: `¿Estás seguro de que quieres cancelar la consulta ${consultation.consultationNumber}?`,
      header: 'Confirmar Cancelación',
      icon: 'fa fa-exclamation-triangle',
      acceptLabel: 'Sí, Cancelar',
      rejectLabel: 'No',
      accept: async () => {
        // TODO: Implement cancel consultation in store
        this.messageService.add({
          severity: 'success',
          summary: 'Cancelado',
          detail: `Consulta ${consultation.consultationNumber} cancelada exitosamente`
        });
      }
    });
  }

  // Modal event handlers
  onFormModalClose(): void {
    this.displayFormModal.set(false);
    this.selectedConsultationForEdit = undefined;
    this.isEditMode = false;
  }

  onDetailsModalClose(): void {
    this.displayDetailsModal.set(false);
    this.selectedConsultationForView = undefined;
  }

  onConsultationSaved(consultation: ConsultationResponseDto): void {
    this.onFormModalClose();
    this.loadConsultations();
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: this.isEditMode ? 'Consulta actualizada exitosamente' : 'Consulta creada exitosamente'
    });
  }

  onEditFromDetails(consultation: ConsultationResponseDto): void {
    this.onDetailsModalClose();
    this.editConsultation(consultation);
  }

  onGenerateInvoiceFromDetails(consultation: ConsultationResponseDto): void {
    this.onDetailsModalClose();
    this.generateInvoice(consultation);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatTime(timeString: string): string {
    if (!timeString) return '';
    return new Date(timeString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pendiente',
      'in_progress': 'En Progreso',
      'completed': 'Completada',
      'cancelled': 'Cancelada'
    };
    return statusMap[status] || status;
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' {
    const severityMap: { [key: string]: 'success' | 'info' | 'warning' | 'danger' } = {
      'pending': 'warning',
      'in_progress': 'info',
      'completed': 'success',
      'cancelled': 'danger'
    };
    return severityMap[status] || 'info';
  }

  // Statistics Modal Methods
  onStatsModalClose(): void {
    this.displayStatsModal.set(false);
  }

  initializeChartOptions(): void {
    this.chartOptions = {
      plugins: {
        legend: {
          position: 'bottom'
        }
      },
      responsive: true,
      maintainAspectRatio: false
    };

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
          beginAtZero: true,
          ticks: {
            callback: function(value: any) {
              return value + ' consultas';
            }
          }
        }
      }
    };
  }

  updateChartData(): void {
    const consultations = this.consultationStore.consultations();
    
    // Status Chart Data
    const statusCounts = {
      pending: this.consultationStore.pendingConsultations(),
      in_progress: this.consultationStore.inProgressConsultations(),
      completed: this.consultationStore.completedConsultations(),
      cancelled: this.consultationStore.cancelledConsultations()
    };

    this.statusChartData = {
      labels: ['Pendientes', 'En Progreso', 'Completadas', 'Canceladas'],
      datasets: [{
        data: [statusCounts.pending, statusCounts.in_progress, statusCounts.completed, statusCounts.cancelled],
        backgroundColor: [
          '#f59e0b', // amber
          '#3b82f6', // blue
          '#10b981', // emerald
          '#ef4444'  // red
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };

    // Monthly Chart Data
    const monthlyStats = this.consultationStore.getMonthlyConsultationStats(6);
    this.monthlyChartData = {
      labels: monthlyStats.labels,
      datasets: [{
        label: 'Consultas',
        data: monthlyStats.data,
        backgroundColor: '#3b82f6',
        borderColor: '#1d4ed8',
        borderWidth: 2
      }]
    };
  }

  // Helper methods for client data
  getClientName(consultation: ConsultationResponseDto): string {
    return (consultation.client as any)?.name || 'Cliente no encontrado';
  }

  getClientEmail(consultation: ConsultationResponseDto): string {
    return (consultation.client as any)?.email || '';
  }
}