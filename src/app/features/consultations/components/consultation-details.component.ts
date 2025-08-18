import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

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
import { MessageService } from 'primeng/api';

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
    OrbDialogComponent
  ],
  providers: [MessageService],
  template: `
    <orb-dialog
      [(visible)]="visible"
      header="📋 Detalles de la Consulta"
      size="xl"
      (onHide)="onHide()">
      
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
              [rounded]="true">
            </p-tag>
          </div>
          <div class="header-actions">
            <orb-button
              *ngIf="consultation.status !== 'completed' && consultation.status !== 'cancelled'"
              label="Editar"
              icon="fa fa-edit"
              (clicked)="onEdit()"
              variant="secondary">
            </orb-button>
            <orb-button
              *ngIf="consultation.status === 'completed'"
              label="Generar Factura"
              icon="fa fa-file-invoice"
              (clicked)="onGenerateInvoice()"
              variant="success">
            </orb-button>
            <orb-button
              label="Imprimir"
              icon="fa fa-print"
              (clicked)="onPrint()"
              variant="info">
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
      </div>

      <p-toast></p-toast>
    </orb-dialog>
  `,
  styleUrls: ['./consultation-details.component.scss']
})
export class ConsultationDetailsComponent {
  @Input() visible = false;
  @Input() consultation?: ConsultationResponseDto;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() edit = new EventEmitter<ConsultationResponseDto>();
  @Output() generateInvoice = new EventEmitter<ConsultationResponseDto>();

  private messageService = inject(MessageService);

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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

  hasVitalSigns(): boolean {
    if (!this.consultation) return false;
    return !!(this.consultation.temperature || 
              this.consultation.bloodPressure || 
              this.consultation.heartRate || 
              this.consultation.weight || 
              this.consultation.height);
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
        detail: `Generando factura para consulta ${this.consultation.consultationNumber}...`
      });
    }
  }

  onPrint(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Imprimiendo',
      detail: 'Preparando consulta para impresión...'
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
}