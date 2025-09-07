import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputSwitchModule } from 'primeng/inputswitch';
import { DropdownModule } from 'primeng/dropdown';
import { MessageModule } from 'primeng/message';

import { DateRangePickerComponent } from './date-range-picker.component';
import { DateRangePickerConfig, DateRange, CalendarAvailability } from './date-range-picker.interfaces';

@Component({
  selector: 'orb-date-range-picker-example',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputSwitchModule,
    DropdownModule,
    MessageModule,
    DateRangePickerComponent
  ],
  template: `
    <div class="date-range-picker-examples">
      <h2>DateRangePicker - Ejemplos de Uso</h2>
      
      <!-- Configuración -->
      <p-card header="Configuración">
        <form [formGroup]="configForm" class="config-form">
          <div class="config-row">
            <label>
              <p-inputSwitch formControlName="showTime"></p-inputSwitch>
              Mostrar hora
            </label>
            
            <label>
              <p-inputSwitch formControlName="showAvailability"></p-inputSwitch>
              Mostrar disponibilidad
            </label>
            
            <label>
              <p-inputSwitch formControlName="disabled"></p-inputSwitch>
              Deshabilitado
            </label>
          </div>
          
          <div class="config-row">
            <label>
              Profesional:
              <p-dropdown 
                formControlName="professionalId"
                [options]="professionalOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Seleccionar profesional">
              </p-dropdown>
            </label>
          </div>
        </form>
      </p-card>

      <!-- Ejemplo básico -->
      <p-card header="Ejemplo Básico">
        <p>Selector de rango de fechas básico:</p>
        <orb-date-range-picker
          [config]="basicConfig()"
          [(ngModel)]="basicRange"
          (dateRangeChange)="onBasicRangeChange($event)">
        </orb-date-range-picker>
        
        <div class="result" *ngIf="basicRange">
          <strong>Rango seleccionado:</strong>
          <p>Inicio: {{ basicRange.start | date:'dd/MM/yyyy' }}</p>
          <p>Fin: {{ basicRange.end | date:'dd/MM/yyyy' }}</p>
        </div>
      </p-card>

      <!-- Ejemplo con disponibilidad -->
      <p-card header="Ejemplo con Disponibilidad de Agenda">
        <p>Selector que muestra la disponibilidad de la agenda:</p>
        <orb-date-range-picker
          [config]="availabilityConfig()"
          [(ngModel)]="availabilityRange"
          (dateRangeChange)="onAvailabilityRangeChange($event)"
          (availabilityLoaded)="onAvailabilityLoaded($event)">
        </orb-date-range-picker>
        
        <div class="availability-stats" *ngIf="lastAvailability()">
          <h4>Estadísticas del mes:</h4>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">Días laborables:</span>
              <span class="stat-value">{{ lastAvailability()?.totalWorkingDays }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Slots disponibles:</span>
              <span class="stat-value">{{ lastAvailability()?.totalAvailableSlots }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Citas reservadas:</span>
              <span class="stat-value">{{ lastAvailability()?.totalBookedAppointments }}</span>
            </div>
          </div>
        </div>
      </p-card>

      <!-- Ejemplo con hora -->
      <p-card header="Ejemplo con Selección de Hora">
        <p>Selector de rango con hora incluida:</p>
        <orb-date-range-picker
          [config]="timeConfig()"
          [(ngModel)]="timeRange"
          (dateRangeChange)="onTimeRangeChange($event)">
        </orb-date-range-picker>
        
        <div class="result" *ngIf="timeRange">
          <strong>Rango con hora seleccionado:</strong>
          <p>Inicio: {{ timeRange.start | date:'dd/MM/yyyy HH:mm' }}</p>
          <p>Fin: {{ timeRange.end | date:'dd/MM/yyyy HH:mm' }}</p>
        </div>
      </p-card>

      <!-- Ejemplo con formulario reactivo -->
      <p-card header="Ejemplo en Formulario Reactivo">
        <form [formGroup]="reactiveForm" class="reactive-form">
          <label>
            Rango de fechas para reporte:
            <orb-date-range-picker
              formControlName="dateRange"
              [config]="formConfig()">
            </orb-date-range-picker>
          </label>
          
          <div class="form-actions">
            <p-button 
              label="Generar Reporte"
              [disabled]="reactiveForm.invalid"
              (onClick)="generateReport()">
            </p-button>
            
            <p-button 
              label="Limpiar"
              styleClass="p-button-secondary"
              (onClick)="clearForm()">
            </p-button>
          </div>
        </form>
        
        <div class="form-state">
          <p><strong>Estado del formulario:</strong></p>
          <p>Válido: {{ reactiveForm.valid ? 'Sí' : 'No' }}</p>
          <p>Valor: {{ reactiveForm.value.dateRange | json }}</p>
        </div>
      </p-card>

      <!-- Leyenda de colores -->
      <p-card header="Leyenda de Estados de Disponibilidad">
        <div class="legend-grid">
          <div class="legend-item">
            <span class="legend-color available"></span>
            <div>
              <strong>Disponible</strong>
              <p>Día con citas disponibles</p>
            </div>
          </div>
          
          <div class="legend-item">
            <span class="legend-color limited"></span>
            <div>
              <strong>Limitado</strong>
              <p>Pocas citas disponibles</p>
            </div>
          </div>
          
          <div class="legend-item">
            <span class="legend-color full"></span>
            <div>
              <strong>Completo</strong>
              <p>Agenda llena</p>
            </div>
          </div>
          
          <div class="legend-item">
            <span class="legend-color blocked"></span>
            <div>
              <strong>Bloqueado</strong>
              <p>Día inhabilitado</p>
            </div>
          </div>
          
          <div class="legend-item">
            <span class="legend-color holiday"></span>
            <div>
              <strong>Feriado</strong>
              <p>Día festivo</p>
            </div>
          </div>
          
          <div class="legend-item">
            <span class="legend-color past"></span>
            <div>
              <strong>Pasado</strong>
              <p>Día anterior a hoy</p>
            </div>
          </div>
        </div>
      </p-card>
    </div>
  `,
  styleUrls: ['./date-range-picker-example.component.scss']
})
export class DateRangePickerExampleComponent {
  // Configuración reactiva
  configForm: FormGroup;
  
  // Formulario reactivo de ejemplo
  reactiveForm: FormGroup;
  
  // Rangos de fecha para cada ejemplo
  basicRange: DateRange = { start: null, end: null };
  availabilityRange: DateRange = { start: null, end: null };
  timeRange: DateRange = { start: null, end: null };
  
  // Datos de disponibilidad
  lastAvailability = signal<CalendarAvailability | null>(null);
  
  // Opciones para dropdown de profesionales
  professionalOptions = [
    { label: 'Usuario actual', value: null },
    { label: 'Dr. García', value: 1 },
    { label: 'Dra. López', value: 2 },
    { label: 'Dr. Martínez', value: 3 }
  ];

  constructor(private fb: FormBuilder) {
    this.configForm = this.fb.group({
      showTime: [false],
      showAvailability: [true],
      disabled: [false],
      professionalId: [null]
    });

    this.reactiveForm = this.fb.group({
      dateRange: [null]
    });
  }

  // Configuraciones computadas
  basicConfig = signal<DateRangePickerConfig>({
    placeholder: 'Seleccionar rango básico',
    minDate: new Date(),
    showAvailability: false
  });

  availabilityConfig = (): DateRangePickerConfig => ({
    placeholder: 'Seleccionar con disponibilidad',
    showAvailability: this.configForm.value.showAvailability,
    professionalId: this.configForm.value.professionalId,
    minDate: new Date(),
    disabled: this.configForm.value.disabled
  });

  timeConfig = (): DateRangePickerConfig => ({
    placeholder: 'Seleccionar con hora',
    showTime: this.configForm.value.showTime,
    showAvailability: this.configForm.value.showAvailability,
    professionalId: this.configForm.value.professionalId,
    minDate: new Date()
  });

  formConfig = (): DateRangePickerConfig => ({
    placeholder: 'Rango para reporte',
    required: true,
    showAvailability: false,
    minDate: new Date(2024, 0, 1), // Desde enero 2024
    maxDate: new Date() // Hasta hoy
  });

  // Event handlers
  onBasicRangeChange(range: DateRange) {    
  }

  onAvailabilityRangeChange(range: DateRange) {    
  }

  onTimeRangeChange(range: DateRange) {    
  }

  onAvailabilityLoaded(availability: CalendarAvailability) {
    this.lastAvailability.set(availability);    
  }

  generateReport() {
    const formValue = this.reactiveForm.value;    
    
    // Aquí iría la lógica para generar el reporte
    alert(`Generando reporte para el rango: ${formValue.dateRange?.start} - ${formValue.dateRange?.end}`);
  }

  clearForm() {
    this.reactiveForm.reset();
  }
}