import { Component, EventEmitter, Input, Output, inject, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { of } from 'rxjs';

// PrimeNG Components
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';

// Orb Components
import { OrbButtonComponent, OrbCardComponent, OrbDialogComponent } from '@orb-components';

// Services and Models
import { ConsultationResponseDto } from '../../../api/models/consultation-response-dto';
import { ConsultationTokenResponseDto } from '../../../api/models/consultation-token-response-dto';

// Extended interface to handle missing properties
interface ExtendedConsultationToken extends ConsultationTokenResponseDto {
  id?: string;
  token?: string;
  status?: string;
  expiresAt?: string;
  usedAt?: string;
  usageCount?: number;
  maxUses?: number;
}
import { MessageService } from 'primeng/api';
import { ConsultationsService } from '../../../api/services/consultations.service';

// Import consultation tokens store
import { Store } from '@ngrx/store';
// Disabled until consultation tokens store is implemented
// import { ConsultationTokensActions } from '../../../store/consultation-tokens/consultation-tokens.actions';
// import { ConsultationTokensSelectors } from '../../../store/consultation-tokens/consultation-tokens.selectors';

@Component({
  selector: 'app-consultation-details',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    TagModule,
    DividerModule,
    ToastModule,
    CardModule,
    OrbButtonComponent,
    OrbCardComponent,
    OrbDialogComponent,
  ],
  providers: [MessageService],
  template: `
    <orb-dialog
      [(visible)]="visible"
      header="📋 Detalles de la Consulta"
      size="xl"
      (onHide)="onHide()"
    >
      <div class="consultation-details-container" *ngIf="consultation">
        <!-- Header Section -->
        <div class="consultation-header">
          <div class="header-left">
            <h2>
              <i class="fa fa-stethoscope"></i>
              {{ consultation.consultationNumber }}
            </h2>
            <p-tag
              [value]="getStatusLabel(consultation.status)"
              [severity]="getStatusSeverity(consultation.status)"
              [rounded]="true"
            >
            </p-tag>
          </div>
          <div class="header-actions">
            <orb-button
              *ngIf="consultation.status !== 'completed' && consultation.status !== 'cancelled'"
              label="Editar"
              icon="fa fa-edit"
              (clicked)="onEdit()"
              severity="secondary"
              variant="outlined"
            >
            </orb-button>
            <orb-button
              *ngIf="consultation.status === 'completed'"
              label="Generar Token"
              icon="fa fa-key"
              (clicked)="onGenerateToken()"
              severity="info"
              variant="outlined"
            >
            </orb-button>
            <orb-button
              *ngIf="consultation.status === 'completed'"
              label="Ver Tokens"
              icon="fa fa-list"
              (clicked)="onViewTokens()"
              severity="secondary"
              variant="outlined"
            >
            </orb-button>
            <orb-button
              *ngIf="consultation.status === 'completed'"
              label="Generar Factura"
              icon="fa fa-file-invoice"
              (clicked)="onGenerateInvoice()"
              severity="success"
              variant="outlined"
            >
            </orb-button>
            <orb-button
              label="Imprimir"
              icon="fa fa-print"
              (clicked)="onPrint()"
              severity="info"
              variant="outlined"
            >
            </orb-button>
          </div>
        </div>

        <!-- Client and Consultation Info -->
        <div class="info-grid">
          <orb-card>
            <div orbHeader>
              <h3><i class="fa fa-user"></i> Información del Paciente</h3>
            </div>
            <div orbBody>
              <div class="info-content">
                <div class="info-row">
                  <span class="label">Nombre:</span>
                  <span class="value">{{ getClientName(consultation) }}</span>
                </div>
                <div class="info-row" *ngIf="getClientEmail(consultation)">
                  <span class="label">Email:</span>
                  <span class="value">{{ getClientEmail(consultation) }}</span>
                </div>
                <div class="info-row" *ngIf="getClientPhone(consultation)">
                  <span class="label">Teléfono:</span>
                  <span class="value">{{ getClientPhone(consultation) }}</span>
                </div>
                <div class="info-row" *ngIf="getClientBirthDate(consultation)">
                  <span class="label">Fecha de Nacimiento:</span>
                  <span class="value">{{ formatDate(getClientBirthDate(consultation)) }}</span>
                </div>
              </div>
            </div>
          </orb-card>

          <orb-card>
            <div orbHeader>
              <h3><i class="fa fa-calendar"></i> Información de la Consulta</h3>
            </div>
            <div orbBody>
              <div class="info-content">
                <div class="info-row">
                  <span class="label">Fecha de Creación:</span>
                  <span class="value">{{ formatDate(consultation.createdAt) }}</span>
                </div>
                <div class="info-row" *ngIf="consultation.startTime">
                  <span class="label">Hora de Inicio:</span>
                  <span class="value">{{ consultation.startTime }}</span>
                </div>
                <div class="info-row" *ngIf="consultation.endTime">
                  <span class="label">Hora de Fin:</span>
                  <span class="value">{{ consultation.endTime }}</span>
                </div>
                <div class="info-row" *ngIf="getDuration()">
                  <span class="label">Duración:</span>
                  <span class="value">{{ getDuration() }} minutos</span>
                </div>
              </div>
            </div>
          </orb-card>
        </div>

        <!-- Symptoms and Diagnosis -->
        <orb-card *ngIf="consultation.symptoms || consultation.diagnosis">
          <div orbHeader>
            <h3><i class="fa fa-clipboard-list"></i> Síntomas y Diagnóstico</h3>
          </div>
          <div orbBody>
            <div class="symptoms-diagnosis-grid">
              <div class="section" *ngIf="consultation.symptoms">
                <h4>Síntomas Reportados</h4>
                <p class="content">{{ consultation.symptoms }}</p>
              </div>
              <div class="section" *ngIf="consultation.diagnosis">
                <h4>Diagnóstico</h4>
                <p class="content">{{ consultation.diagnosis }}</p>
              </div>
            </div>
          </div>
        </orb-card>

        <!-- Vital Signs -->
        <orb-card *ngIf="hasVitalSigns()">
          <div orbHeader>
            <h3><i class="fa fa-heartbeat"></i> Signos Vitales</h3>
          </div>
          <div orbBody>
            <div class="vital-signs-grid">
              <div class="vital-sign" *ngIf="consultation.temperature">
                <div class="vital-icon">
                  <i class="fa fa-thermometer-half"></i>
                </div>
                <div class="vital-info">
                  <span class="vital-label">Temperatura</span>
                  <span class="vital-value">{{ consultation.temperature }}°C</span>
                </div>
              </div>
              <div class="vital-sign" *ngIf="consultation.bloodPressure">
                <div class="vital-icon">
                  <i class="fa fa-tint"></i>
                </div>
                <div class="vital-info">
                  <span class="vital-label">Presión Arterial</span>
                  <span class="vital-value">{{ consultation.bloodPressure }}</span>
                </div>
              </div>
              <div class="vital-sign" *ngIf="consultation.heartRate">
                <div class="vital-icon">
                  <i class="fa fa-heartbeat"></i>
                </div>
                <div class="vital-info">
                  <span class="vital-label">Frecuencia Cardíaca</span>
                  <span class="vital-value">{{ consultation.heartRate }} bpm</span>
                </div>
              </div>
              <div class="vital-sign" *ngIf="consultation.weight">
                <div class="vital-icon">
                  <i class="fa fa-weight"></i>
                </div>
                <div class="vital-info">
                  <span class="vital-label">Peso</span>
                  <span class="vital-value">{{ consultation.weight }} kg</span>
                </div>
              </div>
              <div class="vital-sign" *ngIf="consultation.height">
                <div class="vital-icon">
                  <i class="fa fa-ruler-vertical"></i>
                </div>
                <div class="vital-info">
                  <span class="vital-label">Altura</span>
                  <span class="vital-value">{{ consultation.height }} cm</span>
                </div>
              </div>
            </div>
          </div>
        </orb-card>

        <!-- Treatment and Recommendations -->
        <orb-card *ngIf="consultation.treatment || consultation.recommendations">
          <div orbHeader>
            <h3><i class="fa fa-notes-medical"></i> Tratamiento y Recomendaciones</h3>
          </div>
          <div orbBody>
            <div class="treatment-section">
              <div class="section" *ngIf="consultation.treatment">
                <h4>Tratamiento Prescrito</h4>
                <p class="content">{{ consultation.treatment }}</p>
              </div>
              <div class="section" *ngIf="consultation.recommendations">
                <h4>Recomendaciones</h4>
                <p class="content">{{ consultation.recommendations }}</p>
              </div>
            </div>
          </div>
        </orb-card>

        <!-- Medications and Allergies -->
        <orb-card *ngIf="hasMedicationsOrAllergies()">
          <div orbHeader>
            <h3><i class="fa fa-pills"></i> Medicamentos y Alergias</h3>
          </div>
          <div orbBody>
            <div class="medications-allergies-grid">
              <div class="section" *ngIf="getMedications().length > 0">
                <h4>Medicamentos</h4>
                <ul class="medication-list">
                  <li *ngFor="let medication of getMedications()" class="medication-item">
                    <i class="fa fa-pill"></i>
                    {{ medication }}
                  </li>
                </ul>
              </div>
              <div class="section" *ngIf="getAllergies().length > 0">
                <h4>Alergias</h4>
                <ul class="allergy-list">
                  <li *ngFor="let allergy of getAllergies()" class="allergy-item">
                    <i class="fa fa-exclamation-triangle"></i>
                    {{ allergy }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </orb-card>

        <!-- Follow-up -->
        <orb-card *ngIf="consultation.followUpRequired">
          <div orbHeader>
            <h3><i class="fa fa-calendar-check"></i> Seguimiento</h3>
          </div>
          <div orbBody>
            <div class="followup-content">
              <div class="followup-indicator">
                <i class="fa fa-check-circle text-success"></i>
                <span>Se requiere seguimiento</span>
              </div>
              <div class="followup-date" *ngIf="consultation.followUpDate">
                <span class="label">Fecha programada:</span>
                <span class="value">{{ formatDate(consultation.followUpDate) }}</span>
              </div>
            </div>
          </div>
        </orb-card>

        <!-- Additional Notes -->
        <orb-card *ngIf="consultation.notes">
          <div orbHeader>
            <h3><i class="fa fa-sticky-note"></i> Notas Adicionales</h3>
          </div>
          <div orbBody>
            <p class="notes-content">{{ consultation.notes }}</p>
          </div>
        </orb-card>

        <!-- Active Tokens Section -->
        <orb-card *ngIf="consultation.status === 'completed' && activeTokens.length > 0">
          <div orbHeader>
            <h3><i class="fa fa-key"></i> Tokens Activos</h3>
          </div>
          <div orbBody>
            <div class="tokens-list">
              <div class="token-item" *ngFor="let token of activeTokens">
                <div class="token-info">
                  <div class="token-header">
                    <span class="token-code">{{ token.token }}</span>
                    <span class="token-status" [class]="'status-' + token.status">{{
                      getTokenStatusLabel(token.status || '')
                    }}</span>
                  </div>
                  <div class="token-details">
                    <span class="token-detail">
                      <i class="fa fa-calendar"></i>
                      Expira: {{ formatDate(token.expiresAt || '') }}
                    </span>
                    <span class="token-detail" *ngIf="token.usedAt">
                      <i class="fa fa-check"></i>
                      Usado: {{ formatDate(token.usedAt || '') }}
                    </span>
                    <span class="token-detail">
                      <i class="fa fa-eye"></i>
                      Usos: {{ token.usageCount || 0 }} / {{ token.maxUses || 0 }}
                    </span>
                  </div>
                </div>
                <div class="token-actions">
                  <orb-button
                    *ngIf="token.status === 'active'"
                    label="Copiar Link"
                    icon="fa fa-copy"
                    size="small"
                    severity="info"
                    variant="outlined"
                    (clicked)="copyTokenLink(token)"
                  >
                  </orb-button>
                  <orb-button
                    *ngIf="token.status === 'active'"
                    label="Revocar"
                    icon="fa fa-ban"
                    size="small"
                    severity="danger"
                    variant="outlined"
                    (clicked)="revokeToken(token)"
                  >
                  </orb-button>
                </div>
              </div>
            </div>
          </div>
        </orb-card>
      </div>

      <p-toast></p-toast>
    </orb-dialog>
  `,
  styleUrls: ['./consultation-details.component.scss'],
})
export class ConsultationDetailsComponent implements OnInit, OnChanges {
  @Input() visible = false;
  @Input() consultation?: ConsultationResponseDto;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() edit = new EventEmitter<ConsultationResponseDto>();
  @Output() generateInvoice = new EventEmitter<ConsultationResponseDto>();

  private messageService = inject(MessageService);
  private store = inject(Store);
  private consultationsService = inject(ConsultationsService);

  activeTokens: ExtendedConsultationToken[] = [];
  showTokenDialog = false;

  ngOnInit(): void {
    // Load tokens for the consultation when visible
    if (this.visible && this.consultation?.id) {
      this.loadConsultationTokens();
    }

    // Subscribe to tokens loading events
    // TODO: Replace with actual consultation tokens selector when available
    // this.store.select(ConsultationTokensSelectors.selectConsultationTokensForConsultation(this.consultation?.id || 0))
    of([]).subscribe((tokens) => {
      this.activeTokens = tokens;
    });
  }

  ngOnChanges(): void {
    if (this.visible && this.consultation?.id) {
      this.loadConsultationTokens();
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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

  hasVitalSigns(): boolean {
    if (!this.consultation) return false;
    return !!(
      this.consultation.temperature ||
      this.consultation.bloodPressure ||
      this.consultation.heartRate ||
      this.consultation.weight ||
      this.consultation.height
    );
  }

  hasMedicationsOrAllergies(): boolean {
    return this.getMedications().length > 0 || this.getAllergies().length > 0;
  }

  getMedications(): string[] {
    if (!this.consultation?.medications) return [];
    return Array.isArray(this.consultation.medications)
      ? this.consultation.medications
      : [this.consultation.medications];
  }

  getAllergies(): string[] {
    if (!this.consultation?.allergies) return [];
    return Array.isArray(this.consultation.allergies)
      ? this.consultation.allergies
      : [this.consultation.allergies];
  }

  getDuration(): number | null {
    if (!this.consultation?.startTime || !this.consultation?.endTime) return null;

    const start = new Date(`2000-01-01 ${this.consultation.startTime}`);
    const end = new Date(`2000-01-01 ${this.consultation.endTime}`);

    const diffMs = end.getTime() - start.getTime();
    return Math.round(diffMs / (1000 * 60)); // Convert to minutes
  }

  onHide(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  onEdit(): void {
    if (this.consultation) {
      this.edit.emit(this.consultation);
    }
  }

  onGenerateInvoice(): void {
    if (this.consultation) {
      this.generateInvoice.emit(this.consultation);
      this.messageService.add({
        severity: 'info',
        summary: 'Generando Factura',
        detail: `Generando factura para consulta ${this.consultation.consultationNumber}...`,
      });
    }
  }

  onPrint(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Imprimiendo',
      detail: 'Preparando consulta para impresión...',
    });
    // TODO: Implementar funcionalidad de impresión
    window.print();
  }

  // Helper methods for client data
  getClientName(consultation: ConsultationResponseDto): string {
    return (consultation.client as any)?.name || 'Cliente no encontrado';
  }

  getClientEmail(consultation: ConsultationResponseDto): string {
    return (consultation.client as any)?.email || '';
  }

  getClientPhone(consultation: ConsultationResponseDto): string {
    return (consultation.client as any)?.phone || '';
  }

  getClientBirthDate(consultation: ConsultationResponseDto): string {
    return (consultation.client as any)?.birthDate || '';
  }

  // Token management methods
  loadConsultationTokens(): void {
    if (this.consultation?.id) {
      // TODO: Replace with actual store dispatch when available
      // this.store.dispatch(ConsultationTokensActions.loadTokensForConsultation({
      //   consultationId: this.consultation.id
      // }));
    }
  }

  onGenerateToken(): void {
    if (!this.consultation?.id) return;

    const tokenData = {
      consultationId: this.consultation.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      maxUses: 5,
      scenario: 'client_access',
    };

    // TODO: Replace with actual store dispatch when available
    // this.store.dispatch(ConsultationTokensActions.createToken({ tokenData }));
    this.messageService.add({
      severity: 'success',
      summary: 'Token Generado',
      detail: 'Token de acceso creado exitosamente',
    });
  }

  onViewTokens(): void {
    this.showTokenDialog = true;
    this.loadConsultationTokens();
  }

  copyTokenLink(token: ExtendedConsultationToken): void {
    const baseUrl = window.location.origin;
    const tokenLink = `${baseUrl}/consultation/public/${token.token || ''}`;

    navigator.clipboard
      .writeText(tokenLink)
      .then(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Link Copiado',
          detail: 'El enlace del token ha sido copiado al portapapeles',
        });
      })
      .catch(() => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo copiar el enlace',
        });
      });
  }

  revokeToken(token: ExtendedConsultationToken): void {
    if (token.id) {
      // TODO: Replace with actual store action when available
      // this.store.dispatch(ConsultationTokensActions.revokeToken({ tokenId: token.id }));
      this.messageService.add({
        severity: 'info',
        summary: 'Token Revocado',
        detail: 'El token ha sido revocado exitosamente',
      });
    }
  }

  getTokenStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      active: 'Activo',
      used: 'Usado',
      expired: 'Expirado',
      revoked: 'Revocado',
    };
    return statusMap[status] || status;
  }
}
