import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, FormControl } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { ChipModule } from 'primeng/chip';

import { OrbCardComponent } from '@orb-shared-components/application/orb-card/orb-card.component';
import { OrbButtonComponent } from '@orb-shared-components/orb-button/orb-button.component';
import { OrbDatepickerComponent } from '@orb-shared-components/orb-datepicker/orb-datepicker.component';
import { OrbSelectComponent } from '@orb-shared-components/orb-select/orb-select.component';
import { OrbTextInputComponent } from '@orb-shared-components/orb-text-input/orb-text-input.component';

import { DateBlockingUtils } from '../../models/agenda-blocking.models';

export interface DateSelection {
  /** Fechas seleccionadas en formato YYYY-MM-DD */
  dates: string[];
  /** Modo de selección usado */
  selectionMode: 'single' | 'multiple' | 'range';
  /** Razón o motivo (opcional) */
  reason?: string;
}

@Component({
  selector: 'app-date-range-selector',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ChipModule,
    OrbCardComponent,
    OrbButtonComponent,
    OrbDatepickerComponent,
    OrbSelectComponent,
    OrbTextInputComponent
  ],
  templateUrl: './date-range-selector.component.html',
  styleUrls: ['./date-range-selector.component.scss']
})
export class DateRangeSelectorComponent implements OnInit, OnDestroy {
  @Input() title = 'Seleccionar Fechas';
  @Input() allowMultiple = true;
  @Input() allowRange = true;
  @Input() minDate: Date | null = new Date(); // Por defecto, solo fechas futuras
  
  // Propiedad para usar en el template
  minDateForPicker = new Date();
  @Input() maxDate: Date | null = null;
  @Input() disabledDates: string[] = []; // Fechas que no se pueden seleccionar
  @Input() selectedDates: string[] = [];
  @Input() showReason = true;
  
  @Output() dateSelectionChange = new EventEmitter<DateSelection>();
  @Output() clearSelection = new EventEmitter<void>();

  form: FormGroup;
  selectedDatesList: string[] = [];
  selectionModeOptions = [
    { label: 'Fecha única', value: 'single' },
    { label: 'Fechas múltiples', value: 'multiple' },
    { label: 'Rango de fechas', value: 'range' }
  ];

  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder) {
    this.form = this.createForm();
  }

  ngOnInit(): void {
    this.initializeSelectedDates();
    this.setupFormSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      selectionMode: ['multiple'],
      singleDate: [null],
      multipleDates: [[]],
      dateRange: [null],
      reason: ['']
    });
  }

  // Getter methods for form controls
  get selectionModeControl(): FormControl {
    return this.form.get('selectionMode') as FormControl;
  }

  get singleDateControl(): FormControl {
    return this.form.get('singleDate') as FormControl;
  }

  get multipleDatesControl(): FormControl {
    return this.form.get('multipleDates') as FormControl;
  }

  get dateRangeControl(): FormControl {
    return this.form.get('dateRange') as FormControl;
  }

  get reasonControl(): FormControl {
    return this.form.get('reason') as FormControl;
  }

  // Date getters to convert null to undefined for orb-datepicker compatibility
  get minDateForComponent(): Date | undefined {
    return this.minDate || undefined;
  }

  get maxDateForComponent(): Date | undefined {
    return this.maxDate || undefined;
  }

  private initializeSelectedDates(): void {
    if (this.selectedDates.length > 0) {
      this.selectedDatesList = [...this.selectedDates];
      this.updateFormWithSelectedDates();
    }
  }

  private setupFormSubscriptions(): void {
    // Escuchar cambios en el modo de selección
    this.form.get('selectionMode')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(mode => {
      this.handleSelectionModeChange(mode);
    });

    // Escuchar cambios en las fechas
    this.form.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.updateSelectedDatesList();
      this.emitSelectionChange();
    });
  }

  private handleSelectionModeChange(mode: string): void {
    // Limpiar otros controles cuando cambia el modo
    switch (mode) {
      case 'single':
        this.form.patchValue({ multipleDates: [], dateRange: null });
        break;
      case 'multiple':
        this.form.patchValue({ singleDate: null, dateRange: null });
        break;
      case 'range':
        this.form.patchValue({ singleDate: null, multipleDates: [] });
        break;
    }
  }

  private updateSelectedDatesList(): void {
    const formValue = this.form.value;
    const mode = formValue.selectionMode;
    let dates: string[] = [];

    switch (mode) {
      case 'single':
        if (formValue.singleDate) {
          dates = [this.formatDate(formValue.singleDate)];
        }
        break;
      case 'multiple':
        if (formValue.multipleDates && formValue.multipleDates.length > 0) {
          dates = formValue.multipleDates.map((date: Date) => this.formatDate(date));
        }
        break;
      case 'range':
        if (formValue.dateRange && formValue.dateRange.length === 2) {
          const startDate = this.formatDate(formValue.dateRange[0]);
          const endDate = this.formatDate(formValue.dateRange[1]);
          dates = DateBlockingUtils.generateDateRange(startDate, endDate);
        }
        break;
    }

    this.selectedDatesList = dates.filter(date => this.isDateSelectable(date));
  }

  private updateFormWithSelectedDates(): void {
    if (this.selectedDatesList.length === 1) {
      this.form.patchValue({
        selectionMode: 'single',
        singleDate: this.parseDate(this.selectedDatesList[0])
      });
    } else if (this.selectedDatesList.length > 1) {
      this.form.patchValue({
        selectionMode: 'multiple',
        multipleDates: this.selectedDatesList.map(date => this.parseDate(date))
      });
    }
  }

  private emitSelectionChange(): void {
    const selection: DateSelection = {
      dates: this.selectedDatesList,
      selectionMode: this.form.value.selectionMode,
      reason: this.form.value.reason || undefined
    };
    this.dateSelectionChange.emit(selection);
  }

  private isDateSelectable(date: string): boolean {
    // Verificar si la fecha está en la lista de fechas deshabilitadas
    if (this.disabledDates.includes(date)) {
      return false;
    }

    // Verificar límites de fecha
    const dateObj = this.parseDate(date);
    if (this.minDate && dateObj < this.minDate) {
      return false;
    }
    if (this.maxDate && dateObj > this.maxDate) {
      return false;
    }

    return true;
  }

  private formatDate(date: Date): string {
    return DateBlockingUtils.formatDateToString(date);
  }

  private parseDate(dateString: string): Date {
    return DateBlockingUtils.parseStringToDate(dateString);
  }

  // Métodos públicos para el template

  /**
   * Eliminar una fecha específica de la selección
   */
  removeDate(date: string): void {
    this.selectedDatesList = this.selectedDatesList.filter(d => d !== date);
    
    const mode = this.form.value.selectionMode;
    if (mode === 'multiple') {
      const updatedDates = this.selectedDatesList.map(d => this.parseDate(d));
      this.form.patchValue({ multipleDates: updatedDates });
    } else if (mode === 'single' && this.selectedDatesList.length === 0) {
      this.form.patchValue({ singleDate: null });
    }
  }

  /**
   * Limpiar toda la selección
   */
  clearAllDates(): void {
    this.selectedDatesList = [];
    this.form.patchValue({
      singleDate: null,
      multipleDates: [],
      dateRange: null,
      reason: ''
    });
    this.clearSelection.emit();
  }

  /**
   * Formatear fecha para mostrar en la UI
   */
  formatDateForDisplay(date: string): string {
    return DateBlockingUtils.formatDateForDisplay(date);
  }

  /**
   * Obtener el nombre del día
   */
  getDayName(date: string): string {
    return DateBlockingUtils.getDayName(date);
  }

  /**
   * Verificar si hay fechas seleccionadas
   */
  hasSelectedDates(): boolean {
    return this.selectedDatesList.length > 0;
  }

  /**
   * Obtener el número de fechas seleccionadas
   */
  getSelectedDatesCount(): number {
    return this.selectedDatesList.length;
  }

  /**
   * Función para deshabilitar fechas en el calendario
   */
  isDateDisabled = (date: Date): boolean => {
    const dateString = this.formatDate(date);
    return !this.isDateSelectable(dateString);
  };
}