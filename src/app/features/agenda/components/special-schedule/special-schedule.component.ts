import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';

import { CheckboxModule } from 'primeng/checkbox';
import { ChipModule } from 'primeng/chip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';

import { ConfirmationService, MessageService } from 'primeng/api';

import { OrbCardComponent } from '@orb-shared-components/application/orb-card/orb-card.component';
import { OrbButtonComponent } from '@orb-shared-components/orb-button/orb-button.component';
import { OrbDatepickerComponent } from '@orb-shared-components/orb-datepicker/orb-datepicker.component';
import { OrbSelectComponent } from '@orb-shared-components/orb-select/orb-select.component';
import { OrbTextInputComponent } from '@orb-shared-components/orb-text-input/orb-text-input.component';
import { OrbTableComponent } from '@orb-shared-components/orb-table/orb-table.component';
import { OrbTagComponent } from '@orb-shared-components/orb-tag/orb-tag.component';

import { AgendaBlockingStore } from '../../store/agenda-blocking.store';
import { 
  DayOverride, 
  BlockingOperationResult,
  DateBlockingUtils 
} from '../../models/agenda-blocking.models';

interface TimeSlot {
  label: string;
  value: string;
}

@Component({
  selector: 'app-special-schedule',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CheckboxModule,
    ChipModule,
    ConfirmDialogModule,
    ToastModule,
    TagModule,
    TableModule,
    OrbCardComponent,
    OrbButtonComponent,
    OrbDatepickerComponent,
    OrbSelectComponent,
    OrbTextInputComponent
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './special-schedule.component.html',
  styleUrls: ['./special-schedule.component.scss']
})
export class SpecialScheduleComponent implements OnInit, OnDestroy {
  @Input() professionalId: number | undefined;
  @Output() operationCompleted = new EventEmitter<BlockingOperationResult>();

  form: FormGroup;
  dayOverrides: DayOverride[] = [];
  selectedOverrides: DayOverride[] = [];
  loading = false;
  
  // Opciones de horarios predefinidos
  timeSlots: TimeSlot[] = [
    { label: '07:00', value: '07:00' },
    { label: '07:30', value: '07:30' },
    { label: '08:00', value: '08:00' },
    { label: '08:30', value: '08:30' },
    { label: '09:00', value: '09:00' },
    { label: '09:30', value: '09:30' },
    { label: '10:00', value: '10:00' },
    { label: '10:30', value: '10:30' },
    { label: '11:00', value: '11:00' },
    { label: '11:30', value: '11:30' },
    { label: '12:00', value: '12:00' },
    { label: '12:30', value: '12:30' },
    { label: '13:00', value: '13:00' },
    { label: '13:30', value: '13:30' },
    { label: '14:00', value: '14:00' },
    { label: '14:30', value: '14:30' },
    { label: '15:00', value: '15:00' },
    { label: '15:30', value: '15:30' },
    { label: '16:00', value: '16:00' },
    { label: '16:30', value: '16:30' },
    { label: '17:00', value: '17:00' },
    { label: '17:30', value: '17:30' },
    { label: '18:00', value: '18:00' },
    { label: '18:30', value: '18:30' },
    { label: '19:00', value: '19:00' },
    { label: '19:30', value: '19:30' },
    { label: '20:00', value: '20:00' },
    { label: '20:30', value: '20:30' },
    { label: '21:00', value: '21:00' }
  ];

  slotDurationOptions = [
    { label: '15 minutos', value: 15 },
    { label: '30 minutos', value: 30 },
    { label: '45 minutos', value: 45 },
    { label: '60 minutos', value: 60 },
    { label: '90 minutos', value: 90 },
    { label: '120 minutos', value: 120 }
  ];

  // Propiedad para usar en el template
  minDateForPicker = new Date();

  // Para la tabla
  cols = [
    { field: 'date', header: 'Fecha', sortable: true },
    { field: 'schedule', header: 'Horario', sortable: false },
    { field: 'blocked', header: 'Estado', sortable: true },
    { field: 'note', header: 'Nota', sortable: false },
    { field: 'actions', header: 'Acciones', sortable: false }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private agendaBlockingStore: AgendaBlockingStore,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {
    this.form = this.createForm();
  }

  ngOnInit(): void {
    this.setupStoreSubscriptions();
    this.loadDayOverrides();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      date: [null, Validators.required],
      blocked: [false],
      startTime: [''],
      endTime: [''],
      slotDuration: [30],
      note: ['']
    });
  }

  // Getter methods for form controls
  get dateControl(): FormControl {
    return this.form.get('date') as FormControl;
  }

  get blockedControl(): FormControl {
    return this.form.get('blocked') as FormControl;
  }

  get startTimeControl(): FormControl {
    return this.form.get('startTime') as FormControl;
  }

  get endTimeControl(): FormControl {
    return this.form.get('endTime') as FormControl;
  }

  get slotDurationControl(): FormControl {
    return this.form.get('slotDuration') as FormControl;
  }

  get noteControl(): FormControl {
    return this.form.get('note') as FormControl;
  }

  private setupStoreSubscriptions(): void {
    // Suscribirse a los overrides de días
    this.agendaBlockingStore.dayOverrides$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(overrides => {
      this.dayOverrides = overrides;
    });

    // Suscribirse a los estados de carga
    this.agendaBlockingStore.loadingStates$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(states => {
      this.loading = states.creatingOverride || states.loadingOverrides;
    });

    // Suscribirse a errores
    this.agendaBlockingStore.error$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(error => {
      if (error) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error
        });
      }
    });

    // Escuchar cambios en el checkbox de bloqueo
    this.form.get('blocked')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(blocked => {
      this.toggleTimeFields(blocked);
    });
  }

  private loadDayOverrides(): void {
    // Cargar overrides para los próximos 12 meses
    const fromDate = DateBlockingUtils.formatDateToString(new Date());
    const toDate = new Date();
    toDate.setFullYear(toDate.getFullYear() + 1);
    const toDateString = DateBlockingUtils.formatDateToString(toDate);
    
    this.agendaBlockingStore.loadDayOverrides(fromDate, toDateString, this.professionalId);
  }

  private toggleTimeFields(blocked: boolean): void {
    const startTimeControl = this.form.get('startTime');
    const endTimeControl = this.form.get('endTime');
    const slotDurationControl = this.form.get('slotDuration');

    if (blocked) {
      // Si está bloqueado, limpiar y deshabilitar campos de horario
      startTimeControl?.setValue('');
      endTimeControl?.setValue('');
      startTimeControl?.disable();
      endTimeControl?.disable();
      slotDurationControl?.disable();
    } else {
      // Si no está bloqueado, habilitar campos de horario
      startTimeControl?.enable();
      endTimeControl?.enable();
      slotDurationControl?.enable();
    }
  }

  /**
   * Crear configuración especial para el día
   */
  createDayOverride(): void {
    if (!this.form.valid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario Incompleto',
        detail: 'Por favor completa todos los campos requeridos'
      });
      return;
    }

    const formValue = this.form.value;
    const dateString = DateBlockingUtils.formatDateToString(formValue.date);

    // Verificar si ya existe un override para esta fecha
    const existingOverride = this.dayOverrides.find(override => override.date === dateString);
    if (existingOverride) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Fecha Duplicada',
        detail: `Ya existe una configuración especial para ${this.formatDateForDisplay(dateString)}`
      });
      return;
    }

    const dayOverride: DayOverride = {
      date: dateString,
      blocked: formValue.blocked,
      startTime: formValue.blocked ? undefined : formValue.startTime,
      endTime: formValue.blocked ? undefined : formValue.endTime,
      slotDuration: formValue.blocked ? undefined : formValue.slotDuration,
      note: formValue.note || undefined,
      isCustomSchedule: !formValue.blocked,
      isActive: true
    };

    this.confirmationService.confirm({
      message: `¿Crear configuración especial para ${this.formatDateForDisplay(dateString)}?`,
      header: 'Confirmar Configuración',
      icon: 'pi pi-question-circle',
      accept: () => {
        this.agendaBlockingStore.createDayOverride(dayOverride, this.professionalId).pipe(
          finalize(() => {
            // Limpiar formulario después de la operación
            this.form.reset();
            this.form.patchValue({ blocked: false, slotDuration: 30 });
          })
        ).subscribe(result => {
          if (result.success) {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: result.message
            });
            this.operationCompleted.emit(result);
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: result.message
            });
          }
        });
      }
    });
  }

  /**
   * Eliminar configuración especial
   */
  deleteOverride(override: DayOverride): void {
    this.confirmationService.confirm({
      message: `¿Eliminar la configuración especial para ${this.formatDateForDisplay(override.date)}?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        // Como no hay endpoint específico para eliminar, usamos unblock
        this.agendaBlockingStore.unblockDates([override.date], this.professionalId).subscribe(result => {
          if (result.success) {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Configuración especial eliminada correctamente'
            });
            this.operationCompleted.emit(result);
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: result.message
            });
          }
        });
      }
    });
  }

  /**
   * Eliminar múltiples configuraciones seleccionadas
   */
  deleteSelectedOverrides(): void {
    if (this.selectedOverrides.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Por favor selecciona configuraciones para eliminar'
      });
      return;
    }

    const dates = this.selectedOverrides.map(override => override.date);
    
    this.confirmationService.confirm({
      message: `¿Eliminar ${dates.length} configuración(es) especial(es)?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.agendaBlockingStore.unblockDates(dates, this.professionalId).subscribe(result => {
          if (result.success) {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: `${dates.length} configuración(es) eliminada(s) correctamente`
            });
            this.selectedOverrides = [];
            this.operationCompleted.emit(result);
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: result.message
            });
          }
        });
      }
    });
  }

  /**
   * Formatear horario para mostrar en la tabla
   */
  formatScheduleDisplay(override: DayOverride): string {
    if (override.blocked) {
      return 'BLOQUEADO';
    }

    if (override.startTime && override.endTime) {
      return `${override.startTime} - ${override.endTime}`;
    }

    return 'Horario normal';
  }

  /**
   * Obtener el estado del día
   */
  getStatusDisplay(override: DayOverride): { label: string; severity: string } {
    if (override.blocked) {
      return { label: 'Bloqueado', severity: 'danger' };
    }

    if (override.isCustomSchedule) {
      return { label: 'Horario Especial', severity: 'info' };
    }

    return { label: 'Normal', severity: 'success' };
  }

  /**
   * Formatear fecha para display
   */
  formatDateForDisplay(date: string): string {
    return DateBlockingUtils.formatDateForDisplay(date);
  }

  /**
   * Verificar si una fecha está en el pasado
   */
  isPastDate(date: string): boolean {
    return DateBlockingUtils.isPastDate(date);
  }

  /**
   * Verificar si hay configuraciones seleccionadas
   */
  hasSelectedOverrides(): boolean {
    return this.selectedOverrides.length > 0;
  }

  /**
   * Refrescar la lista de configuraciones
   */
  refreshOverrides(): void {
    this.loadDayOverrides();
  }

  /**
   * Validar que la hora de fin sea mayor que la de inicio
   */
  validateTimeRange(): boolean {
    const startTime = this.form.get('startTime')?.value;
    const endTime = this.form.get('endTime')?.value;

    if (!startTime || !endTime || this.form.get('blocked')?.value) {
      return true;
    }

    return startTime < endTime;
  }

  /**
   * Limpiar formulario
   */
  clearForm(): void {
    this.form.reset();
    this.form.patchValue({ blocked: false, slotDuration: 30 });
  }
}