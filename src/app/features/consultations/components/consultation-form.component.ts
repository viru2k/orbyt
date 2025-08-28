import { Component, Input, Output, EventEmitter, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';

import { ConsultationsService } from '../../../api/services/consultations.service';
import { ClientsService } from '../../../api/services/clients.service';
import { BusinessTypesService } from '../../../api/services/business-types.service';
import { ConsultationResponseDto } from '../../../api/models/consultation-response-dto';
import { ClientResponseDto } from '../../../api/models/client-response-dto';
import { CreateConsultationDto } from '../../../api/models/create-consultation-dto';
import { BusinessTypeResponseDto } from '../../../api/models/business-type-response-dto';
import { ConsultationTypeResponseDto } from '../../../api/models/consultation-type-response-dto';

// Interfaces para configuraciones específicas por tipo de negocio
interface FormField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'time' | 'select' | 'checkbox';
  required: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
  suffix?: string;
  min?: number;
  max?: number;
}

interface FormSection {
  key: string;
  title: string;
  icon: string;
  fields: FormField[];
}

interface BusinessTypeFormConfig {
  businessTypeCode: string;
  sections: FormSection[];
}

// Configuraciones específicas por tipo de negocio
const BUSINESS_TYPE_CONFIGS: BusinessTypeFormConfig[] = [
  {
    businessTypeCode: 'medical',
    sections: [
      {
        key: 'patient_info',
        title: 'Información del Paciente',
        icon: 'fa fa-user-md',
        fields: []
      },
      {
        key: 'consultation_info',
        title: 'Información de la Consulta',
        icon: 'fa fa-calendar-clock',
        fields: [
          { key: 'startTime', label: 'Hora de Inicio', type: 'time', required: false },
          { key: 'endTime', label: 'Hora de Fin', type: 'time', required: false }
        ]
      },
      {
        key: 'symptoms',
        title: 'Síntomas y Motivo de Consulta',
        icon: 'fa fa-clipboard-list',
        fields: [
          { key: 'symptoms', label: 'Síntomas', type: 'textarea', required: false, placeholder: 'Describe los síntomas del paciente...' }
        ]
      },
      {
        key: 'vital_signs',
        title: 'Examen Físico y Signos Vitales',
        icon: 'fa fa-heartbeat',
        fields: [
          { key: 'temperature', label: 'Temperatura', type: 'number', required: false, suffix: '°C', min: 30, max: 45 },
          { key: 'bloodPressure', label: 'Presión Arterial', type: 'text', required: false, placeholder: 'ej: 120/80' },
          { key: 'heartRate', label: 'Frecuencia Cardíaca', type: 'number', required: false, suffix: 'bpm', min: 30, max: 200 },
          { key: 'weight', label: 'Peso', type: 'number', required: false, suffix: 'kg', min: 0, max: 300 },
          { key: 'height', label: 'Altura', type: 'number', required: false, suffix: 'm', min: 0, max: 3 }
        ]
      },
      {
        key: 'diagnosis_treatment',
        title: 'Diagnóstico y Tratamiento',
        icon: 'fa fa-stethoscope',
        fields: [
          { key: 'diagnosis', label: 'Diagnóstico', type: 'textarea', required: false, placeholder: 'Diagnóstico médico...' },
          { key: 'treatment', label: 'Tratamiento', type: 'textarea', required: false, placeholder: 'Plan de tratamiento...' },
          { key: 'recommendations', label: 'Recomendaciones', type: 'textarea', required: false, placeholder: 'Recomendaciones para el paciente...' }
        ]
      },
      {
        key: 'medications_allergies',
        title: 'Medicamentos y Alergias',
        icon: 'fa fa-pills',
        fields: [
          { key: 'medications', label: 'Medicamentos Actuales', type: 'textarea', required: false, placeholder: 'Lista de medicamentos...' },
          { key: 'allergies', label: 'Alergias Conocidas', type: 'textarea', required: false, placeholder: 'Alergias del paciente...' }
        ]
      },
      {
        key: 'follow_up',
        title: 'Seguimiento',
        icon: 'fa fa-calendar-check',
        fields: [
          { key: 'followUpRequired', label: 'Requiere Seguimiento', type: 'checkbox', required: false },
          { key: 'followUpDate', label: 'Fecha de Seguimiento', type: 'time', required: false },
          { key: 'notes', label: 'Notas Adicionales', type: 'textarea', required: false, placeholder: 'Observaciones generales...' }
        ]
      }
    ]
  },
  {
    businessTypeCode: 'veterinary',
    sections: [
      {
        key: 'pet_owner_info',
        title: 'Información de la Mascota y Propietario',
        icon: 'fa fa-paw',
        fields: []
      },
      {
        key: 'appointment_info',
        title: 'Información de la Cita',
        icon: 'fa fa-calendar',
        fields: [
          { key: 'startTime', label: 'Hora de Inicio', type: 'time', required: false },
          { key: 'endTime', label: 'Hora de Fin', type: 'time', required: false }
        ]
      },
      {
        key: 'symptoms_behavior',
        title: 'Síntomas y Comportamiento',
        icon: 'fa fa-eye',
        fields: [
          { key: 'symptoms', label: 'Síntomas Observados', type: 'textarea', required: false, placeholder: 'Comportamiento, síntomas físicos, cambios observados...' }
        ]
      },
      {
        key: 'veterinary_exam',
        title: 'Examen Veterinario',
        icon: 'fa fa-stethoscope',
        fields: [
          { key: 'temperature', label: 'Temperatura Corporal', type: 'number', required: false, suffix: '°C', min: 35, max: 42 },
          { key: 'heartRate', label: 'Frecuencia Cardíaca', type: 'number', required: false, suffix: 'bpm', min: 60, max: 220 },
          { key: 'weight', label: 'Peso de la Mascota', type: 'number', required: false, suffix: 'kg', min: 0, max: 100 }
        ]
      },
      {
        key: 'diagnosis_treatment',
        title: 'Diagnóstico Veterinario y Tratamiento',
        icon: 'fa fa-user-md',
        fields: [
          { key: 'diagnosis', label: 'Diagnóstico Veterinario', type: 'textarea', required: false, placeholder: 'Diagnóstico profesional...' },
          { key: 'treatment', label: 'Tratamiento Prescrito', type: 'textarea', required: false, placeholder: 'Medicación y cuidados...' },
          { key: 'recommendations', label: 'Recomendaciones al Propietario', type: 'textarea', required: false, placeholder: 'Cuidados en casa...' }
        ]
      },
      {
        key: 'medications_follow_up',
        title: 'Medicamentos y Seguimiento',
        icon: 'fa fa-calendar-check',
        fields: [
          { key: 'medications', label: 'Medicamentos Prescritos', type: 'textarea', required: false, placeholder: 'Medicación veterinaria...' },
          { key: 'followUpRequired', label: 'Requiere Control', type: 'checkbox', required: false },
          { key: 'followUpDate', label: 'Fecha de Control', type: 'time', required: false },
          { key: 'notes', label: 'Observaciones Veterinarias', type: 'textarea', required: false, placeholder: 'Notas del veterinario...' }
        ]
      }
    ]
  },
  {
    businessTypeCode: 'beauty',
    sections: [
      {
        key: 'client_info',
        title: 'Información del Cliente',
        icon: 'fa fa-user',
        fields: []
      },
      {
        key: 'appointment_info',
        title: 'Información de la Cita',
        icon: 'fa fa-calendar',
        fields: [
          { key: 'startTime', label: 'Hora de Inicio', type: 'time', required: false },
          { key: 'endTime', label: 'Hora de Fin', type: 'time', required: false }
        ]
      },
      {
        key: 'desired_treatment',
        title: 'Tipo de Tratamiento Deseado',
        icon: 'fa fa-spa',
        fields: [
          { key: 'symptoms', label: 'Tratamiento Solicitado', type: 'textarea', required: false, placeholder: 'Facial, masajes, tratamientos corporales...' }
        ]
      },
      {
        key: 'skin_evaluation',
        title: 'Evaluación de Piel/Estado Actual',
        icon: 'fa fa-search',
        fields: [
          { key: 'diagnosis', label: 'Evaluación de la Piel', type: 'textarea', required: false, placeholder: 'Tipo de piel, estado actual, problemas observados...' }
        ]
      },
      {
        key: 'treatment_plan',
        title: 'Plan de Tratamiento y Cuidados',
        icon: 'fa fa-list-check',
        fields: [
          { key: 'treatment', label: 'Tratamiento Realizado', type: 'textarea', required: false, placeholder: 'Productos utilizados, técnicas aplicadas...' },
          { key: 'recommendations', label: 'Cuidados Post-Tratamiento', type: 'textarea', required: false, placeholder: 'Recomendaciones de cuidado en casa...' },
          { key: 'followUpRequired', label: 'Requiere Seguimiento', type: 'checkbox', required: false },
          { key: 'followUpDate', label: 'Próxima Cita Sugerida', type: 'time', required: false },
          { key: 'notes', label: 'Notas del Tratamiento', type: 'textarea', required: false, placeholder: 'Observaciones generales...' }
        ]
      }
    ]
  },
  {
    businessTypeCode: 'hair_salon',
    sections: [
      {
        key: 'client_info',
        title: 'Información del Cliente',
        icon: 'fa fa-user',
        fields: []
      },
      {
        key: 'appointment_info',
        title: 'Información de la Cita',
        icon: 'fa fa-calendar',
        fields: [
          { key: 'startTime', label: 'Hora de Inicio', type: 'time', required: false },
          { key: 'endTime', label: 'Hora de Fin', type: 'time', required: false }
        ]
      },
      {
        key: 'hair_service',
        title: 'Servicio de Peluquería',
        icon: 'fa fa-cut',
        fields: [
          { key: 'symptoms', label: 'Servicio Solicitado', type: 'textarea', required: false, placeholder: 'Corte, color, peinado, tratamiento capilar...' }
        ]
      },
      {
        key: 'hair_condition',
        title: 'Estado y Tipo de Cabello',
        icon: 'fa fa-eye',
        fields: [
          { key: 'diagnosis', label: 'Análisis del Cabello', type: 'textarea', required: false, placeholder: 'Tipo de cabello, estado, tratamientos previos...' }
        ]
      },
      {
        key: 'treatment_result',
        title: 'Tratamiento Realizado',
        icon: 'fa fa-magic',
        fields: [
          { key: 'treatment', label: 'Servicio Realizado', type: 'textarea', required: false, placeholder: 'Productos utilizados, técnicas aplicadas...' },
          { key: 'recommendations', label: 'Cuidados del Cabello', type: 'textarea', required: false, placeholder: 'Productos recomendados para el hogar...' },
          { key: 'followUpRequired', label: 'Requiere Mantenimiento', type: 'checkbox', required: false },
          { key: 'followUpDate', label: 'Próxima Cita Sugerida', type: 'time', required: false },
          { key: 'notes', label: 'Observaciones', type: 'textarea', required: false, placeholder: 'Notas del estilista...' }
        ]
      }
    ]
  },
  {
    businessTypeCode: 'psychology',
    sections: [
      {
        key: 'patient_info',
        title: 'Información del Paciente',
        icon: 'fa fa-user',
        fields: []
      },
      {
        key: 'session_info',
        title: 'Información de la Sesión',
        icon: 'fa fa-calendar',
        fields: [
          { key: 'startTime', label: 'Hora de Inicio', type: 'time', required: false },
          { key: 'endTime', label: 'Hora de Fin', type: 'time', required: false }
        ]
      },
      {
        key: 'consultation_reason',
        title: 'Motivo de Consulta Psicológica',
        icon: 'fa fa-comments',
        fields: [
          { key: 'symptoms', label: 'Motivo de Consulta', type: 'textarea', required: false, placeholder: 'Situación actual, síntomas, problemas presentados...' }
        ]
      },
      {
        key: 'psychological_evaluation',
        title: 'Evaluación Psicológica',
        icon: 'fa fa-brain',
        fields: [
          { key: 'diagnosis', label: 'Observaciones Clínicas', type: 'textarea', required: false, placeholder: 'Estado mental, comportamiento, evaluación profesional...' }
        ]
      },
      {
        key: 'therapeutic_plan',
        title: 'Plan Terapéutico',
        icon: 'fa fa-route',
        fields: [
          { key: 'treatment', label: 'Intervención Terapéutica', type: 'textarea', required: false, placeholder: 'Técnicas aplicadas, ejercicios, estrategias...' },
          { key: 'recommendations', label: 'Recomendaciones', type: 'textarea', required: false, placeholder: 'Tareas, ejercicios para casa...' },
          { key: 'followUpRequired', label: 'Requiere Seguimiento', type: 'checkbox', required: false },
          { key: 'followUpDate', label: 'Próxima Sesión', type: 'time', required: false },
          { key: 'notes', label: 'Notas de la Sesión', type: 'textarea', required: false, placeholder: 'Observaciones profesionales confidenciales...' }
        ]
      }
    ]
  }
];

@Component({
  selector: 'app-consultation-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputTextarea,
    DropdownModule,
    CalendarModule,
    InputNumberModule,
    CheckboxModule
  ],
  template: `
      <form [formGroup]="consultationForm" (ngSubmit)="onSubmit()">
        <div class="form-grid">
          <!-- Cliente y Tipo de Consulta (Siempre visible) -->
          <div class="form-section">
            <h4><i class="fa fa-user"></i> Información del Cliente</h4>
            <div class="form-row">
              <div class="form-field">
                <label>Cliente *</label>
                <p-dropdown
                  formControlName="clientId"
                  [options]="clients()"
                  optionLabel="name"
                  optionValue="id"
                  [filter]="true"
                  filterBy="name,email"
                  [showClear]="true"
                  class="w-full">
                  <ng-template pTemplate="selectedItem" let-client>
                    <div *ngIf="client">
                      <strong>{{ client.name }}</strong>
                      <small class="block">{{ client.email }}</small>
                    </div>
                  </ng-template>
                  <ng-template pTemplate="item" let-client>
                    <div>
                      <strong>{{ client.name }}</strong>
                      <small class="block">{{ client.email }}</small>
                    </div>
                  </ng-template>
                </p-dropdown>
              </div>
              <div class="form-field">
                <label>Tipo de Consulta *</label>
                <p-dropdown
                  formControlName="consultationTypeId"
                  [options]="consultationTypes()"
                  optionLabel="name"
                  optionValue="id"                  
                  [showClear]="false"
                  class="w-full"
                  (onChange)="onConsultationTypeChange($event)">
                  <ng-template pTemplate="selectedItem" let-type>
                    <div *ngIf="type">
                      <strong>{{ type.name }}</strong>
                      <small class="block">{{ type.description }}</small>
                    </div>
                  </ng-template>
                  <ng-template pTemplate="item" let-type>
                    <div>
                      <strong>{{ type.name }}</strong>
                      <small class="block">{{ type.description }}</small>
                    </div>
                  </ng-template>
                </p-dropdown>
              </div>
            </div>
          </div>

          <!-- Secciones dinámicas basadas en el tipo de negocio -->
          @if (currentFormConfig()) {
            @for (section of currentFormConfig()!.sections; track section.key) {
              <div class="form-section">
                <h4><i class="{{ section.icon }}"></i> {{ section.title }}</h4>
                @if (section.fields.length > 0) {
                  <div class="form-row">
                    @for (field of section.fields; track field.key) {
                      <div class="form-field" [class.full-width]="field.type === 'textarea'">
                        <label>{{ field.label }}@if (field.required) { * }</label>
                        
                        @switch (field.type) {
                          @case ('text') {
                            <input 
                              type="text" 
                              pInputText 
                              [formControlName]="field.key"                              
                              class="w-full">
                          }
                          @case ('textarea') {
                            <textarea 
                              pInputTextarea 
                              [formControlName]="field.key"                              
                              rows="3"
                              class="w-full">
                            </textarea>
                          }
                          @case ('number') {
                            <p-inputNumber
                              [formControlName]="field.key"
                              [minFractionDigits]="field.key === 'temperature' ? 1 : 0"
                              [maxFractionDigits]="field.key === 'temperature' ? 1 : 0"
                              [min]="field.min || 0"
                              [max]="field.max"
                              [suffix]="field.suffix ? ' ' + field.suffix : ''"
                              class="w-full">
                            </p-inputNumber>
                          }
                          @case ('time') {
                            <input 
                              type="time" 
                              pInputText 
                              [formControlName]="field.key"
                              class="w-full">
                          }
                          @case ('checkbox') {
                            <p-checkbox
                              [formControlName]="field.key"
                              [binary]="true">
                            </p-checkbox>
                          }
                        }
                      </div>
                    }
                  </div>
                }
              </div>
            }
          }
        </div>
          <div class="form-section">
            <h4><i class="fa fa-clipboard-list"></i> Información de la Consulta</h4>
            <div class="form-row">
              <div class="form-field">
                <label>Hora de Inicio</label>
                <input 
                  type="time" 
                  pInputText 
                  formControlName="startTime"
                  class="w-full">
              </div>
              <div class="form-field">
                <label>Hora de Fin</label>
                <input 
                  type="time" 
                  pInputText 
                  formControlName="endTime"
                  class="w-full">
              </div>
            </div>
            <div class="form-row">
              <div class="form-field full-width">
                <label>Síntomas</label>
                <textarea 
                  pInputTextarea 
                  formControlName="symptoms"                  
                  rows="3"
                  class="w-full">
                </textarea>
              </div>
            </div>
          </div>

          <!-- Signos Vitales -->
          <div class="form-section">
            <h4><i class="fa fa-heartbeat"></i> Signos Vitales</h4>
            <div class="form-row">
              <div class="form-field">
                <label>Temperatura (°C)</label>
                <p-inputNumber
                  formControlName="temperature"
                  [minFractionDigits]="1"
                  [maxFractionDigits]="1"
                  [min]="30"
                  [max]="45"
                  suffix=" °C"
                  class="w-full">
                </p-inputNumber>
              </div>
              <div class="form-field">
                <label>Presión Arterial</label>
                <input 
                  type="text" 
                  pInputText 
                  formControlName="bloodPressure"                  
                  class="w-full">
              </div>
            </div>
            <div class="form-row">
              <div class="form-field">
                <label>Frecuencia Cardíaca (bpm)</label>
                <p-inputNumber
                  formControlName="heartRate"
                  [min]="40"
                  [max]="200"
                  suffix=" bpm"
                  class="w-full">
                </p-inputNumber>
              </div>
              <div class="form-field">
                <label>Peso (kg)</label>
                <p-inputNumber
                  formControlName="weight"
                  [minFractionDigits]="1"
                  [maxFractionDigits]="1"
                  [min]="0"
                  [max]="300"
                  suffix=" kg"
                  class="w-full">
                </p-inputNumber>
              </div>
            </div>
            <div class="form-row">
              <div class="form-field">
                <label>Altura (cm)</label>
                <p-inputNumber
                  formControlName="height"
                  [min]="50"
                  [max]="250"
                  suffix=" cm"
                  class="w-full">
                </p-inputNumber>
              </div>
            </div>
          </div>

          <!-- Diagnóstico y Tratamiento -->
          <div class="form-section">
            <h4><i class="fa fa-notes-medical"></i> Diagnóstico y Tratamiento</h4>
            <div class="form-row">
              <div class="form-field full-width">
                <label>Diagnóstico</label>
                <textarea 
                  pInputTextarea 
                  formControlName="diagnosis"                  
                  rows="3"
                  class="w-full">
                </textarea>
              </div>
            </div>
            <div class="form-row">
              <div class="form-field full-width">
                <label>Tratamiento</label>
                <textarea 
                  pInputTextarea 
                  formControlName="treatment"                  
                  rows="3"
                  class="w-full">
                </textarea>
              </div>
            </div>
            <div class="form-row">
              <div class="form-field full-width">
                <label>Recomendaciones</label>
                <textarea 
                  pInputTextarea 
                  formControlName="recommendations"                  
                  rows="2"
                  class="w-full">
                </textarea>
              </div>
            </div>
          </div>

          <!-- Medicamentos y Alergias -->
          <div class="form-section">
            <h4><i class="fa fa-pills"></i> Medicamentos y Alergias</h4>
            <div class="form-row">
              <div class="form-field full-width">
                <label>Medicamentos</label>
                <textarea 
                  pInputTextarea 
                  formControlName="medications"                  
                  rows="3"
                  class="w-full">
                </textarea>
              </div>
            </div>
            <div class="form-row">
              <div class="form-field full-width">
                <label>Alergias</label>
                <textarea 
                  pInputTextarea 
                  formControlName="allergies"                  
                  rows="2"
                  class="w-full">
                </textarea>
              </div>
            </div>
          </div>

          <!-- Seguimiento -->
          <div class="form-section">
            <h4><i class="fa fa-calendar-check"></i> Seguimiento</h4>
            <div class="form-row">
              <div class="form-field">
                <p-checkbox 
                  formControlName="followUpRequired"
                  label="Requiere seguimiento"
                  [binary]="true">
                </p-checkbox>
              </div>
            </div>
            <div class="form-row" *ngIf="consultationForm.get('followUpRequired')?.value">
              <div class="form-field">
                <label>Fecha para próxima cita</label>
                <p-calendar
                  formControlName="followUpDate"
                  [showIcon]="true"
                  [showButtonBar]="true"
                  dateFormat="dd/mm/yy"
                  
                  class="w-full">
                </p-calendar>
              </div>
            </div>
          </div>

          <!-- Notas Adicionales -->
          <div class="form-section">
            <h4><i class="fa fa-sticky-note"></i> Notas Adicionales</h4>
            <div class="form-row">
              <div class="form-field full-width">
                <label>Notas adicionales sobre la consulta</label>
                <textarea 
                  pInputTextarea 
                  formControlName="notes"                  
                  rows="3"
                  class="w-full">
                </textarea>
              </div>
            </div>
          </div>
      </form>

      <div class="dialog-footer">
        <p-button 
          label="Cancelar" 
          icon="fa fa-times" 
          [text]="true"
          (onClick)="onCancel()"
          class="p-button-secondary">
        </p-button>
        <p-button 
          label="Guardar" 
          icon="fa fa-save"
          (onClick)="onSubmit()"
          [loading]="saving()"
          [disabled]="consultationForm.invalid">
        </p-button>
      </div>
  `,
  styleUrls: ['./consultation-form.component.scss']
})
export class ConsultationFormComponent implements OnInit {
  @Input() visible = false;
  @Input() consultation: ConsultationResponseDto | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() consultationSaved = new EventEmitter<ConsultationResponseDto>();

  consultationForm: FormGroup;
  clients = signal<ClientResponseDto[]>([]);
  consultationTypes = signal<ConsultationTypeResponseDto[]>([]);
  selectedConsultationType = signal<ConsultationTypeResponseDto | null>(null);
  saving = signal(false);
  isEdit = false;

  // Computed para obtener la configuración dinámica basada en el tipo seleccionado
  currentFormConfig = computed(() => {
    const selectedType = this.selectedConsultationType();
    if (!selectedType) return null;
    
    // Obtener el business type code desde el tipo de consulta
    const businessTypes = this.businessTypesService;
    // Por ahora usaremos una configuración por defecto (medical)
    // TODO: Obtener el business type real desde la consulta
    return BUSINESS_TYPE_CONFIGS.find(config => config.businessTypeCode === 'medical') || null;
  });

  constructor(
    private fb: FormBuilder,
    private consultationsService: ConsultationsService,
    private clientsService: ClientsService,
    private businessTypesService: BusinessTypesService,
    private messageService: MessageService
  ) {
    this.consultationForm = this.createForm();
  }

  ngOnInit() {
    this.loadClients();
    this.loadConsultationTypes();
    if (this.consultation) {
      this.isEdit = true;
      this.populateForm();
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      clientId: [null, Validators.required],
      consultationTypeId: [null, Validators.required],
      startTime: [''],
      endTime: [''],
      symptoms: [''],
      temperature: [null],
      bloodPressure: [''],
      heartRate: [null],
      weight: [null],
      height: [null],
      diagnosis: [''],
      treatment: [''],
      recommendations: [''],
      medications: [''],
      allergies: [''],
      followUpRequired: [false],
      followUpDate: [null],
      notes: ['']
    });
  }

  loadClients() {
    this.clientsService.clientControllerFindAll().subscribe({
      next: (clients) => {
        this.clients.set(clients);
      },
      error: (error) => {
        console.error('Error loading clients:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al cargar la lista de clientes'
        });
      }
    });
  }

  loadConsultationTypes() {
    // Cargar todos los tipos de consulta disponibles
    this.businessTypesService.businessTypeControllerFindAllBusinessTypes().subscribe({
      next: (businessTypes) => {
        const allTypes: ConsultationTypeResponseDto[] = [];
        businessTypes.forEach(bt => {
          if (bt.consultationTypes) {
            allTypes.push(...bt.consultationTypes);
          }
        });
        this.consultationTypes.set(allTypes);
      },
      error: (error) => {
        console.error('Error loading consultation types:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al cargar los tipos de consulta'
        });
      }
    });
  }

  onConsultationTypeChange(event: any) {
    const selectedType = this.consultationTypes().find(t => t.id === event.value);
    this.selectedConsultationType.set(selectedType || null);
    
    // Aquí podríamos aplicar validaciones específicas basadas en el tipo
    if (selectedType) {
      this.applyTypeSpecificValidations(selectedType);
    }
  }

  private applyTypeSpecificValidations(type: ConsultationTypeResponseDto) {
    // Implementar validaciones específicas según el tipo de consulta
    // Por ejemplo, para veterinaria podrían ser obligatorios ciertos campos
    
    const formControls = this.consultationForm.controls;
    
    // Reset all validations first
    Object.keys(formControls).forEach(key => {
      if (key !== 'clientId' && key !== 'consultationTypeId') {
        formControls[key].clearValidators();
        formControls[key].updateValueAndValidity();
      }
    });
    
    // Apply specific validations based on required fields
    if (type.requiredFields) {
      type.requiredFields.forEach(fieldName => {
        if (formControls[fieldName]) {
          formControls[fieldName].setValidators([Validators.required]);
          formControls[fieldName].updateValueAndValidity();
        }
      });
    }
  }

  populateForm() {
    if (this.consultation) {
      // Convertir arrays de strings a strings separados por líneas
      const medications = Array.isArray(this.consultation.medications) 
        ? this.consultation.medications.join('\n') 
        : this.consultation.medications || '';
      
      const allergies = Array.isArray(this.consultation.allergies)
        ? this.consultation.allergies.join('\n')
        : this.consultation.allergies || '';

      this.consultationForm.patchValue({
        clientId: this.consultation.clientId,
        startTime: this.consultation.startTime,
        endTime: this.consultation.endTime,
        symptoms: this.consultation.symptoms,
        temperature: this.consultation.temperature,
        bloodPressure: this.consultation.bloodPressure,
        heartRate: this.consultation.heartRate,
        weight: this.consultation.weight,
        height: this.consultation.height,
        diagnosis: this.consultation.diagnosis,
        treatment: this.consultation.treatment,
        recommendations: this.consultation.recommendations,
        medications: medications,
        allergies: allergies,
        followUpRequired: this.consultation.followUpRequired,
        followUpDate: this.consultation.followUpDate ? new Date(this.consultation.followUpDate) : null,
        notes: this.consultation.notes
      });
    }
  }

  onSubmit() {
    if (this.consultationForm.valid) {
      this.saving.set(true);
      
      const formValue = this.consultationForm.value;
      
      // Convertir strings de líneas a arrays
      const medications = formValue.medications 
        ? formValue.medications.split('\n').filter((m: string) => m.trim()) 
        : [];
      
      const allergies = formValue.allergies
        ? formValue.allergies.split('\n').filter((a: string) => a.trim())
        : [];

      const consultationData: CreateConsultationDto = {
        ...formValue,
        medications,
        allergies,
        followUpDate: formValue.followUpDate ? formValue.followUpDate.toISOString() : undefined
      };

      const operation = this.isEdit && this.consultation
        ? this.consultationsService.consultationControllerUpdate({
            id: this.consultation.id,
            body: consultationData
          })
        : this.consultationsService.consultationControllerCreate({ body: consultationData });

      operation.subscribe({
        next: (result) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: `Consulta ${this.isEdit ? 'actualizada' : 'creada'} correctamente`
          });
          this.consultationSaved.emit(result);
          this.onCancel();
          this.saving.set(false);
        },
        error: (error) => {
          console.error('Error saving consultation:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: `Error al ${this.isEdit ? 'actualizar' : 'crear'} la consulta`
          });
          this.saving.set(false);
        }
      });
    }
  }

  onCancel() {
    this.visible = false;
    this.visibleChange.emit(false);
    this.consultationForm.reset();
    this.isEdit = false;
    this.consultation = null;
  }
}