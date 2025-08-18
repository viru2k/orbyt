import { Component, Input, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
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
import { ConsultationResponseDto } from '../../../api/models/consultation-response-dto';
import { ClientResponseDto } from '../../../api/models/client-response-dto';
import { CreateConsultationDto } from '../../../api/models/create-consultation-dto';

@Component({
  selector: 'app-consultation-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    InputTextarea,
    DropdownModule,
    CalendarModule,
    InputNumberModule,
    CheckboxModule
  ],
  template: `
    <p-dialog 
      [(visible)]="visible" 
      [header]="isEdit ? 'Editar Consulta' : 'Nueva Consulta'"
      [modal]="true"
      [style]="{width: '900px'}"
      [maximizable]="true"
      [closable]="true"
      (onHide)="onCancel()">
      
      <form [formGroup]="consultationForm" (ngSubmit)="onSubmit()">
        <div class="form-grid">
          <!-- Cliente -->
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
                  placeholder="Buscar paciente por nombre o email"
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
            </div>
          </div>

          <!-- Información de la Consulta -->
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
                  placeholder="Describe los síntomas del paciente..."
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
                  placeholder="120/80"
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
                  placeholder="Diagnóstico médico..."
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
                  placeholder="Tratamiento prescrito..."
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
                  placeholder="Recomendaciones para el paciente..."
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
                  placeholder="Lista de medicamentos (uno por línea)..."
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
                  placeholder="Lista de alergias conocidas (una por línea)..."
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
                <label>Fecha de Seguimiento</label>
                <p-calendar
                  formControlName="followUpDate"
                  [showIcon]="true"
                  [showButtonBar]="true"
                  dateFormat="dd/mm/yy"
                  placeholder="Fecha para próxima cita"
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
                <label>Notas</label>
                <textarea 
                  pInputTextarea 
                  formControlName="notes"
                  placeholder="Notas adicionales sobre la consulta..."
                  rows="3"
                  class="w-full">
                </textarea>
              </div>
            </div>
          </div>
        </div>
      </form>

      <ng-template pTemplate="footer">
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
      </ng-template>
    </p-dialog>
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
  saving = signal(false);
  isEdit = false;

  constructor(
    private fb: FormBuilder,
    private consultationsService: ConsultationsService,
    private clientsService: ClientsService,
    private messageService: MessageService
  ) {
    this.consultationForm = this.createForm();
  }

  ngOnInit() {
    this.loadClients();
    if (this.consultation) {
      this.isEdit = true;
      this.populateForm();
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      clientId: [null, Validators.required],
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