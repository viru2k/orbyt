import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ChartModule } from 'primeng/chart';
import { MessageService, ConfirmationService } from 'primeng/api';

import {
  OrbCardComponent,
  OrbButtonComponent,
  OrbDialogComponent,
  OrbMainHeaderComponent
} from '@orb-components';

import { PatientHistoryComponent } from '../../shared/components/patient-history/patient-history.component';

import { ConsultationsService } from '../../api/services/consultations.service';
import { AgendaService } from '../../api/services/agenda.service';
import { ConsultationResponseDto } from '../../api/models/consultation-response-dto';
import { ClientResponseDto } from '../../api/models/client-response-dto';
import { AppointmentResponseDto } from '../../api/models/appointment-response-dto';
import { ConsultationFormComponent } from './components/consultation-form/consultation-form.component';
import { ConsultationDetailsComponent } from './components/consultation-details.component';
import { ConsultationsStore } from '../../store/consultations/consultations.store';
import { ClientSearchModalComponent } from '../../shared/components/client-search-modal/client-search-modal.component';

@Component({
  selector: 'app-consultations-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SelectModule,
    TagModule,
    DialogModule,
    ToastModule,
    ConfirmDialogModule,
    ChartModule,
    OrbCardComponent,
    OrbButtonComponent,
    OrbDialogComponent,
    ConsultationFormComponent,
    ConsultationDetailsComponent,
    OrbMainHeaderComponent,
    PatientHistoryComponent,
    ClientSearchModalComponent,
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <!-- Header Section -->
    <orb-main-header
      title="Historia Clínica de Pacientes"
      icon="fa fa-user-md"
      subtitle="Buscar pacientes y ver su historia clínica completa"
    >
    </orb-main-header>

    <!-- Search Patient Section -->
    <orb-card>
      <div orbBody>
        <div class="search-section" [class.has-patient]="selectedPatient()">
          @if (!selectedPatient()) {
            <div class="search-header">
              <h3>
                <i class="fas fa-search"></i>
                Buscar Paciente
              </h3>
              <p>Busca un paciente para ver su historia clínica completa</p>
            </div>

            <div class="search-actions">
              <orb-button
                label="Buscar Paciente"
                icon="fas fa-search"
                severity="info"
                [outlined]="true"
                size="lg"
                (clicked)="openClientSearchModal()"
              ></orb-button>
            </div>
          } @else {
            <div class="selected-patient-card">
              <div class="selected-patient-info">
                <div class="patient-details">
                  <h4>{{ getSelectedPatientName() }}</h4>
                  @if (selectedPatient()?.email) {
                    <p><i class="fas fa-envelope"></i> {{ selectedPatient()?.email }}</p>
                  }
                  @if (selectedPatient()?.phone) {
                    <p><i class="fas fa-phone"></i> {{ selectedPatient()?.phone }}</p>
                  }
                </div>
                <div class="patient-actions">
                  <orb-button
                    label="Cambiar"
                    icon="fas fa-exchange-alt"
                    severity="secondary"
                    [outlined]="true"
                    (clicked)="openClientSearchModal()"
                  ></orb-button>
                  <orb-button
                    label="Limpiar"
                    icon="fas fa-times"
                    severity="danger"
                    [outlined]="true"
                    (clicked)="clearPatientSelection()"
                  ></orb-button>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </orb-card>

    <!-- Patient History -->
    @if (selectedPatient()) {
      <orb-patient-history
        [patient]="selectedPatient()"
        [consultations]="patientConsultations()"
        [loading]="loadingPatientHistory()"
        [showPatientInfo]="false"
        [maxHeight]="'70vh'"
        (newConsultation)="openNewConsultationDialog()"
      ></orb-patient-history>
    }

    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>

    <!-- Client Search Modal -->
    <orb-client-search-modal
      [visible]="showClientSearchModal()"
      (visibleChange)="showClientSearchModal.set($event)"
      (clientSelected)="onClientSelected($event)"
      (cancel)="onClientSearchModalClose()"
      title="Buscar Paciente para Historia Clínica"
    ></orb-client-search-modal>

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
              <h3>{{ (consultationsStore.totalConsultations$ | async) ?? 0 }}</h3>
              <p>Total Consultas</p>
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-icon">⏰</div>
            <div class="summary-details">
              <h3>{{ (consultationsStore.pendingConsultations$ | async) ?? 0 }}</h3>
              <p>Pendientes</p>
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-icon">✅</div>
            <div class="summary-details">
              <h3>{{ (consultationsStore.completedConsultations$ | async) ?? 0 }}</h3>
              <p>Completadas</p>
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-icon">📋</div>
            <div class="summary-details">
              <h3>{{ (consultationsStore.consultationsWithFollowUp$ | async) ?? 0 }}</h3>
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
              height="300"
            >
            </p-chart>
          </div>

          <div class="chart-container">
            <h4>Consultas por Mes</h4>
            <p-chart
              type="bar"
              [data]="monthlyChartData"
              [options]="barChartOptions"
              [width]="'400'"
              [height]="'300'"
            >
            </p-chart>
          </div>
        </div>

        <!-- Additional Stats -->
        <div class="additional-stats">
          <div class="stat-row">
            <span class="stat-label">Duración Promedio:</span>
            <span class="stat-value"
              >{{ (consultationsStore.averageConsultationDuration$ | async) ?? 0 }} minutos</span
            >
          </div>
          <div class="stat-row">
            <span class="stat-label">Consultas Hoy:</span>
            <span class="stat-value">{{ (consultationsStore.todayConsultations$ | async) ?? 0 }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">En Progreso:</span>
            <span class="stat-value">{{ (consultationsStore.inProgressConsultations$ | async) ?? 0 }}</span>
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
        [preSelectedClient]="selectedPatient()"
        [preSelectedAppointment]="preSelectedAppointment()"
        (consultationSaved)="onConsultationSaved($event)"
        (visibleChange)="onFormModalClose()"
      >
      </app-consultation-form>
    </orb-dialog>

    <!-- Consultation Details Modal -->
    <app-consultation-details
      [visible]="displayDetailsModal()"
      (visibleChange)="displayDetailsModal.set($event)"
      [consultation]="selectedConsultationForView"
      (edit)="onEditFromDetails($event)"
      (generateInvoice)="onGenerateInvoiceFromDetails($event)"
    >
    </app-consultation-details>
  `,
  styleUrls: ['./consultations-list.component.scss'],
})
export class ConsultationsListComponent implements OnInit {
  selectedStatus: string | null = null;

  // Modal states
  displayStatsModal = signal(false);
  displayFormModal = signal(false);
  displayDetailsModal = signal(false);
  showClientSearchModal = signal(false);

  // Selected data
  selectedConsultationForEdit: ConsultationResponseDto | undefined;
  selectedConsultationForView: ConsultationResponseDto | undefined;
  selectedPatient = signal<ClientResponseDto | null>(null);
  patientConsultations = signal<ConsultationResponseDto[]>([]);
  loadingPatientHistory = signal(false);
  preSelectedAppointment = signal<AppointmentResponseDto | null>(null);
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
    { label: 'Cancelada', value: 'cancelled' },
  ];

  constructor(
    private consultationsService: ConsultationsService,
    private agendaService: AgendaService,
    private route: ActivatedRoute,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    public consultationsStore: ConsultationsStore,
  ) {}

  ngOnInit() {
    this.initializeChartOptions();
    this.handleAgendaIntegration();
  }

  /**
   * Handle integration from agenda when navigating to /consultation/new
   */
  private handleAgendaIntegration() {
    this.route.queryParams.subscribe(params => {
      if (params['appointmentId']) {
        this.loadAppointmentFromAgenda(params['appointmentId']);
      }
    });
  }

  /**
   * Load appointment data from agenda and pre-fill consultation form
   */
  private loadAppointmentFromAgenda(appointmentId: string) {
    // Get appointments and filter by ID since there's no getById method
    this.agendaService.agendaControllerGetAppointments().subscribe({
      next: (appointments: AppointmentResponseDto[]) => {
        const appointment = appointments.find(apt => apt.id === appointmentId);

        if (appointment) {
          this.preSelectedAppointment.set(appointment);

          // If appointment has client data, set it as selected patient
          if (appointment.client) {
            // Convert AppointmentClientResponseDto to ClientResponseDto
            const clientData = {
              ...appointment.client,
              createdAt: new Date().toISOString(), // Add missing properties
              updatedAt: new Date().toISOString(),
              isActive: true,
              status: 'ACTIVE' as const
            } as any as ClientResponseDto;

            this.selectedPatient.set(clientData);
          }

          // Auto-open the consultation form
          this.openNewConsultationDialog();
        } else {
          this.messageService.add({
            severity: 'warn',
            summary: 'Cita no encontrada',
            detail: 'No se pudo encontrar la cita en la agenda'
          });
        }
      },
      error: (error: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar la información de la cita desde agenda'
        });
        console.error('Error loading appointment from agenda:', error);
      }
    });
  }

  onStatusChange() {
    // Handle status filter change if needed
  }

  openClientSearchModal() {
    this.showClientSearchModal.set(true);
  }

  onClientSelected(client: ClientResponseDto) {
    this.selectedPatient.set(client);
    this.showClientSearchModal.set(false);
    this.loadPatientConsultations(client.id);
  }

  onClientSearchModalClose() {
    this.showClientSearchModal.set(false);
  }

  loadPatientConsultations(clientId: number) {
    this.loadingPatientHistory.set(true);
    this.consultationsService.consultationControllerFindAll({
      clientId: clientId
    }).subscribe({
      next: (response: any) => {
        // Backend returns { data: [...], total, page, limit }
        const consultations = response?.data || response || [];
        this.patientConsultations.set(consultations);
        this.loadingPatientHistory.set(false);
      },
      error: (error) => {
        console.error('Error loading patient consultations:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al cargar las consultas del paciente'
        });
        this.loadingPatientHistory.set(false);
      }
    });
  }

  clearPatientSelection() {
    this.selectedPatient.set(null);
    this.patientConsultations.set([]);
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
      detail: `Preparando factura para consulta ${consultation.consultationNumber}...`,
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
          detail: `Consulta ${consultation.consultationNumber} cancelada exitosamente`,
        });
      },
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
    // Reload patient consultations if we have a selected patient
    if (this.selectedPatient()) {
      this.loadPatientConsultations(this.selectedPatient()!.id);
    }
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: this.isEditMode
        ? 'Consulta actualizada exitosamente'
        : 'Consulta creada exitosamente',
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
      day: 'numeric',
    });
  }

  formatTime(timeString: string): string {
    if (!timeString) return '';
    return new Date(timeString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      pending: 'Pendiente',
      in_progress: 'En Progreso',
      completed: 'Completada',
      cancelled: 'Cancelada',
    };
    return statusMap[status] || status;
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' {
    const severityMap: { [key: string]: 'success' | 'info' | 'warning' | 'danger' } = {
      pending: 'warning',
      in_progress: 'info',
      completed: 'success',
      cancelled: 'danger',
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
          position: 'bottom',
        },
      },
      responsive: true,
      maintainAspectRatio: false,
    };

    this.barChartOptions = {
      plugins: {
        legend: {
          display: false,
        },
      },
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value: any) {
              return value + ' consultas';
            },
          },
        },
      },
    };
  }

  updateChartData(): void {
    // Update chart data using reactive approach
    this.consultationsStore.consultations$.subscribe(consultations => {
      if (!consultations) return;

      // Status Chart Data
      this.consultationsStore.pendingConsultations$.subscribe(pending => {
        this.consultationsStore.inProgressConsultations$.subscribe(inProgress => {
          this.consultationsStore.completedConsultations$.subscribe(completed => {
            this.consultationsStore.cancelledConsultations$.subscribe(cancelled => {
              this.statusChartData = {
                labels: ['Pendientes', 'En Progreso', 'Completadas', 'Canceladas'],
                datasets: [
                  {
                    data: [pending || 0, inProgress || 0, completed || 0, cancelled || 0],
                    backgroundColor: [
                      '#f59e0b', // amber
                      '#3b82f6', // blue
                      '#10b981', // emerald
                      '#ef4444', // red
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff',
                  },
                ],
              };
            });
          });
        });
      });

      // Monthly Chart Data
      const monthlyStats = this.consultationsStore.getMonthlyConsultationStats(6);
      this.monthlyChartData = {
        labels: monthlyStats.labels,
        datasets: [
          {
            label: 'Consultas',
            data: monthlyStats.data,
            backgroundColor: '#3b82f6',
            borderColor: '#1d4ed8',
            borderWidth: 2,
          },
        ],
      };
    });
  }

  // Helper methods for client data
  getSelectedPatientName(): string {
    const patient = this.selectedPatient();
    if (!patient) return '';
    return patient.name || patient.fullname || 'Paciente';
  }
}
