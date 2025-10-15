import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollerModule } from 'primeng/scroller';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { AvatarModule } from 'primeng/avatar';

import {
  OrbCardComponent,
  OrbButtonComponent,
  OrbTagComponent
} from '@orb-components';

import { ConsultationResponseDto } from '../../../api/models/consultation-response-dto';
import { ClientResponseDto } from '../../../api/models/client-response-dto';

@Component({
  selector: 'orb-patient-history',
  standalone: true,
  imports: [
    CommonModule,
    ScrollerModule,
    TagModule,
    ButtonModule,
    TooltipModule,
    AvatarModule,
    OrbCardComponent,
    OrbButtonComponent,
    OrbTagComponent
  ],
  templateUrl: './patient-history.component.html',
  styleUrls: ['./patient-history.component.scss']
})
export class PatientHistoryComponent implements OnInit, OnChanges {
  @Input() patient: ClientResponseDto | null = null;
  @Input() consultations: ConsultationResponseDto[] = [];
  @Input() loading = false;
  @Input() showPatientInfo = true;
  @Input() maxHeight = '600px';

  @Output() newConsultation = new EventEmitter<void>();

  selectedConsultationIndex = signal<number>(0);
  consultationsSignal = signal<ConsultationResponseDto[]>([]);

  // Make Array available in template
  Array = Array;

  // Computed properties
  selectedConsultation = computed(() => {
    const index = this.selectedConsultationIndex();
    const consultations = this.consultationsSignal();
    return consultations[index] || null;
  });

  hasConsultations = computed(() => {
    const consultations = this.consultationsSignal();
    return consultations && consultations.length > 0;
  });

  consultationStats = computed(() => {
    const consultations = this.consultationsSignal();
    if (!consultations || consultations.length === 0) return { total: 0, completed: 0, pending: 0 };

    return {
      total: consultations.length,
      completed: consultations.filter(c => c.status === 'completed').length,
      pending: consultations.filter(c => c.status === 'pending' || c.status === 'in_progress').length
    };
  });

  ngOnInit() {
    // Initialize signal with input value
    this.consultationsSignal.set(this.consultations || []);

    // Reset selection when consultations change
    if (this.consultations && this.consultations.length > 0) {
      this.selectedConsultationIndex.set(0);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    // Update signal when input changes
    if (changes['consultations']) {
      this.consultationsSignal.set(this.consultations || []);

      // Reset selection when consultations change
      if (this.consultations && this.consultations.length > 0) {
        this.selectedConsultationIndex.set(0);
      }
    }
  }

  selectConsultation(index: number) {
    this.selectedConsultationIndex.set(index);
  }

  navigateConsultation(direction: 'prev' | 'next') {
    const currentIndex = this.selectedConsultationIndex();
    const consultations = this.consultationsSignal();
    const maxIndex = consultations.length - 1;

    if (direction === 'prev' && currentIndex > 0) {
      this.selectedConsultationIndex.set(currentIndex - 1);
    } else if (direction === 'next' && currentIndex < maxIndex) {
      this.selectedConsultationIndex.set(currentIndex + 1);
    }
  }

  onNewConsultation() {
    this.newConsultation.emit();
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
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
      pending: 'Pendiente',
      in_progress: 'En Progreso',
      completed: 'Completada',
      cancelled: 'Cancelada'
    };
    return statusMap[status] || status;
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' {
    const severityMap: { [key: string]: 'success' | 'info' | 'warning' | 'danger' } = {
      pending: 'warning',
      in_progress: 'info',
      completed: 'success',
      cancelled: 'danger'
    };
    return severityMap[status] || 'info';
  }

  getConsultationTypeIcon(consultation: ConsultationResponseDto): string {
    // Map consultation types to icons based on business type
    const typeIconMap: { [key: string]: string } = {
      'medical': 'fas fa-stethoscope',
      'veterinary': 'fas fa-paw',
      'psychology': 'fas fa-brain',
      'hair_salon': 'fas fa-cut',
      'beauty': 'fas fa-spa',
      'office': 'fas fa-briefcase'
    };

    // Try to get icon from consultation type or default
    return typeIconMap['medical'] || 'fas fa-clipboard-list';
  }

  getPatientAge(): string {
    if (!this.patient?.birthDate) return '';

    const birthDate = new Date(this.patient.birthDate);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return (age - 1).toString();
    }

    return age.toString();
  }

  getDisplayField(consultation: ConsultationResponseDto, fieldName: string): any {
    // Handle dynamic fields from different consultation types
    const field = (consultation as any)[fieldName];

    if (field === null || field === undefined || field === '') {
      return null;
    }

    return field;
  }

  hasField(consultation: ConsultationResponseDto, fieldName: string): boolean {
    const field = this.getDisplayField(consultation, fieldName);
    return field !== null && field !== undefined;
  }

  formatFieldValue(value: any, fieldType?: string): string {
    if (value === null || value === undefined) return '';

    switch (fieldType) {
      case 'temperature':
        return `${value}°C`;
      case 'weight':
        return `${value} kg`;
      case 'height':
        return `${value} cm`;
      case 'bloodPressure':
        return `${value} mmHg`;
      case 'heartRate':
        return `${value} bpm`;
      default:
        return value.toString();
    }
  }
}