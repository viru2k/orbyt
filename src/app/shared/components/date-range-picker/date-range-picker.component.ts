import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, AfterViewInit, signal, computed, forwardRef, ViewChild, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CalendarModule } from 'primeng/calendar';
import { TooltipModule } from 'primeng/tooltip';
import { ButtonModule } from 'primeng/button';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap, catchError, of } from 'rxjs';
import { 
  DayStatus, 
  DayAvailability, 
  CalendarAvailability, 
  DateRangePickerConfig, 
  DateRange 
} from './date-range-picker.interfaces';
import { CalendarAvailabilityService } from './calendar-availability.service';

interface CalendarDayEvent {
  day: number;
  month: number;
  year: number;
  today: boolean;
  selectable: boolean;
}

@Component({
  selector: 'orb-date-range-picker',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CalendarModule,
    TooltipModule,
    ButtonModule
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateRangePickerComponent),
      multi: true
    }
  ],
  template: `
    <div class="orb-date-range-picker" [class]="getContainerClassString()">
      <p-calendar
        #calendar
        [ngModel]="tempSelectedRange || selectedRange"
        (ngModelChange)="onDateSelect($event)"
        [placeholder]="config.placeholder || 'dd/mm/yyyy - dd/mm/yyyy'"
        [disabled]="config.disabled || false"
        [minDate]="config.minDate"
        [maxDate]="config.maxDate"
        [showTime]="false"
        [showIcon]="true"
        [iconDisplay]="'input'"
        [appendTo]="'body'"
        [timeOnly]="false"
        [hourFormat]="'24'"
        selectionMode="range"
        [inline]="false"
        [readonlyInput]="false"
        [hideOnDateTimeSelect]="false"
        [showButtonBar]="false"
        dateFormat="dd/mm/yy"
        [style]="{ width: '20rem' }"
        [styleClass]="getCalendarClasses()"
        (onMonthChange)="onMonthChange($event)"
        (onYearChange)="onYearChange($event)"
        (onShow)="onCalendarShow()"
        #calendarRef>
        
        <!-- Header template con botones de acciones rápidas -->
        <ng-template pTemplate="header">
          <div class="calendar-quick-actions">
            <button 
              type="button"
              class="header-btn primary-btn"
              (click)="selectTodayAndClose()"
              *ngIf="!config.disabled">
              Hoy
            </button>
            <button 
              type="button"
              class="header-btn secondary-btn"
              (click)="selectThisWeekAndClose()"
              *ngIf="!config.disabled">
              Esta semana
            </button>
            <button 
              type="button"
              class="header-btn secondary-btn"
              (click)="selectThisMonthAndClose()"
              *ngIf="!config.disabled">
              Este mes
            </button>
            <button 
              type="button"
              class="header-btn danger-btn"
              (click)="clearSelectionAndClose()"
              *ngIf="!config.disabled">
              Limpiar
            </button>
          </div>
          
          <!-- Botón de confirmación cuando hay selección -->
          <div class="calendar-confirm-section" *ngIf="hasValidSelection()">
            <button 
              type="button"
              class="header-confirm-btn"
              (click)="confirmSelection()">
              ✓ Confirmar Selección
            </button>
          </div>
        </ng-template>
        
        
      </p-calendar>


      <!-- Note: Custom date templates will be implemented in future versions -->

      <!-- Información de disponibilidad -->
      <div class="availability-info" *ngIf="shouldShowAvailability()">
        <div class="availability-legend">
          <div class="legend-item">
            <span class="legend-color available"></span>
            <span>Disponible</span>
          </div>
          <div class="legend-item">
            <span class="legend-color limited"></span>
            <span>Limitado</span>
          </div>
          <div class="legend-item">
            <span class="legend-color full"></span>
            <span>Lleno</span>
          </div>
          <div class="legend-item">
            <span class="legend-color blocked"></span>
            <span>Bloqueado</span>
          </div>
          <div class="legend-item">
            <span class="legend-color holiday"></span>
            <span>Feriado</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./date-range-picker.component.scss']
})
export class DateRangePickerComponent implements OnInit, AfterViewInit, OnDestroy, ControlValueAccessor {
  @Input() config: DateRangePickerConfig = {};
  @Output() dateRangeChange = new EventEmitter<DateRange>();
  @Output() availabilityLoaded = new EventEmitter<CalendarAvailability>();

  @ViewChild('calendarRef') calendar: any;

  // Signals para manejo de estado
  selectedRange: Date[] | null = null;
  tempSelectedRange: Date[] | null = null; // Selección temporal hasta confirmar
  currentAvailability = signal<CalendarAvailability | null>(null);
  isLoading = signal(false);
  hasError = signal(false);

  // Computed properties
  availabilityMap = computed(() => {
    const availability = this.currentAvailability();
    if (!availability) return new Map<string, DayAvailability>();
    
    const map = new Map<string, DayAvailability>();
    availability.days.forEach(day => {
      map.set(day.date, day);
    });
    return map;
  });


  private destroy$ = new Subject<void>();
  private calendarChange$ = new Subject<{ month: number; year: number }>();
  private onChange = (value: DateRange) => {};
  private onTouched = () => {};
  private availabilityService = inject(CalendarAvailabilityService);

  ngOnInit() {
    this.setupCalendarMonitoring();
    this.loadCurrentMonthAvailability();
  }

  ngAfterViewInit() {
    // Agregar listeners para entrada manual después de que la vista se inicialice
    // Usar un delay mayor para asegurar que PrimeNG haya construido completamente el calendario
    setTimeout(() => {
      this.setupInputListeners();
    }, 1000);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ControlValueAccessor implementation
  writeValue(value: DateRange): void {
    if (value && (value.start || value.end)) {
      const dates = [value.start, value.end].filter(d => d) as Date[];
      this.selectedRange = dates.length > 0 ? dates : null;
      this.tempSelectedRange = this.selectedRange; // Sincronizar selección temporal
    } else {
      this.selectedRange = null;
      this.tempSelectedRange = null;
    }
  }

  registerOnChange(fn: (value: DateRange) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.config.disabled = isDisabled;
  }

  private setupCalendarMonitoring() {
    // Solo monitorear si la funcionalidad de disponibilidad está habilitada
    if (!this.config.showAvailability) {
      return;
    }

    // Monitorear cambios de mes/año para cargar disponibilidad
    this.calendarChange$.pipe(
      takeUntil(this.destroy$),
      debounceTime(300),
      distinctUntilChanged((prev, curr) => prev.month === curr.month && prev.year === curr.year),
      switchMap(({ month, year }) => this.availabilityService.getCalendarAvailability({
        year,
        month: month + 1,
        professionalId: this.config.professionalId
      })),
      catchError(error => {
        console.error('Error loading availability:', error);
        this.hasError.set(false); // No marcar como error si el endpoint no existe
        return of(null);
      })
    ).subscribe(availability => {
      if (availability) {
        this.currentAvailability.set(availability);
        this.availabilityLoaded.emit(availability);
        this.hasError.set(false);
      }
    });
  }

  private loadCurrentMonthAvailability() {
    if (!this.config.showAvailability) return;
    
    const now = new Date();
    this.calendarChange$.next({ 
      month: now.getMonth(), 
      year: now.getFullYear() 
    });
  }

  private setupInputListeners() {
    try {
      // Verificar que el calendario esté disponible
      if (!this.calendar?.el?.nativeElement) {
        console.warn('Calendario no disponible para configurar listeners');
        return;
      }

      const inputElement = this.calendar.el.nativeElement.querySelector('input') as HTMLInputElement;
      if (!inputElement) {
        console.warn('No se pudo encontrar el input del calendario');
        return;
      }

      // Verificar que addEventListener esté disponible
      if (typeof inputElement.addEventListener !== 'function') {
        console.warn('addEventListener no está disponible en el elemento input');
        return;
      }

      // Agregar listeners de forma segura
      inputElement.addEventListener('input', (event: Event) => {
        try {
          this.onManualInput(event);
        } catch (error) {
          console.error('Error en manual input:', error);
        }
      });

      inputElement.addEventListener('blur', (event: Event) => {
        try {
          this.onInputBlur(event);
        } catch (error) {
          console.error('Error en input blur:', error);
        }
      });
      
    } catch (error) {
      console.error('Error configurando input listeners:', error);
    }
  }


  // Event handlers
  onDateSelect(dates: Date | Date[] | null) {    
    
    // Solo guardar temporalmente, no emitir cambios hasta confirmar
    if (!dates) {
      this.tempSelectedRange = null;
      return;
    }
    
    // Convert single date to array for consistency
    const dateArray = Array.isArray(dates) ? dates : [dates];
    this.tempSelectedRange = dateArray;
        
    
    // Forzar que el calendario permanezca abierto después de seleccionar la segunda fecha
    setTimeout(() => {
      if (this.calendar && this.tempSelectedRange && this.tempSelectedRange.length === 2) {
        // Si se han seleccionado ambas fechas, mantener el calendario abierto
        if (this.calendar.overlayVisible === false && this.calendar.showOverlay) {
          this.calendar.showOverlay();
        }
      }
    }, 100);
  }

  onMonthChange(event: any) {
    this.calendarChange$.next({ 
      month: event.month, 
      year: event.year 
    });
  }

  onYearChange(event: any) {
    this.calendarChange$.next({ 
      month: event.month, 
      year: event.year 
    });
  }

  onCalendarShow() {
    // Cargar disponibilidad cuando se abre el calendario
    if (this.config.showAvailability && !this.currentAvailability()) {
      this.loadCurrentMonthAvailability();
    }
  }

  onManualInput(event: Event) {
    const target = event.target as HTMLInputElement;
    if (!target) return;
    
    const inputValue = target.value;    
    
    // Validar formato de entrada manual
    this.validateManualInput(inputValue);
  }

  onInputBlur(event: Event) {
    const target = event.target as HTMLInputElement;
    if (!target) return;
    
    const inputValue = target.value;    
    
    // Intentar parsear y aplicar la entrada manual
    this.parseAndApplyManualInput(inputValue);
  }

  private validateManualInput(inputValue: string): boolean {
    if (!inputValue || inputValue.trim() === '') {
      this.hasError.set(false);
      return true;
    }

    // Patrones de fecha esperados
    const patterns = [
      /^\d{2}\/\d{2}\/\d{4} - \d{2}\/\d{2}\/\d{4}$/, // dd/mm/yyyy - dd/mm/yyyy
      /^\d{2}\/\d{2}\/\d{2} - \d{2}\/\d{2}\/\d{2}$/, // dd/mm/yy - dd/mm/yy
      /^\d{2}\/\d{2}\/\d{4}$/, // dd/mm/yyyy (fecha única)
      /^\d{2}\/\d{2}\/\d{2}$/, // dd/mm/yy (fecha única)
    ];

    const isValidFormat = patterns.some(pattern => pattern.test(inputValue.trim()));
    
    if (!isValidFormat) {
      this.hasError.set(true);
      return false;
    }

    // Validar fechas reales
    try {
      const dates = this.parseInputValue(inputValue);
      if (!dates || dates.some(date => isNaN(date.getTime()))) {
        this.hasError.set(true);
        return false;
      }
      
      // Validar que fecha de inicio no sea mayor que fecha final
      if (dates.length === 2 && dates[0] > dates[1]) {
        this.hasError.set(true);
        return false;
      }
      
      this.hasError.set(false);
      return true;
    } catch (error) {
      this.hasError.set(true);
      return false;
    }
  }

  private parseInputValue(inputValue: string): Date[] | null {
    if (!inputValue || inputValue.trim() === '') {
      return null;
    }

    const trimmed = inputValue.trim();
    
    // Caso: rango de fechas (dd/mm/yyyy - dd/mm/yyyy)
    if (trimmed.includes(' - ')) {
      const parts = trimmed.split(' - ');
      if (parts.length !== 2) {
        throw new Error('Invalid range format');
      }
      
      return [this.parseDate(parts[0]), this.parseDate(parts[1])];
    } 
    // Caso: fecha única
    else {
      const date = this.parseDate(trimmed);
      return [date, date]; // Rango de un solo día
    }
  }

  private parseDate(dateStr: string): Date {
    // Parsear dd/mm/yyyy o dd/mm/yy
    const parts = dateStr.split('/');
    if (parts.length !== 3) {
      throw new Error('Invalid date format');
    }

    let day = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10) - 1; // Los meses en JS son 0-indexados
    let year = parseInt(parts[2], 10);

    // Convertir año de 2 dígitos a 4 dígitos
    if (year < 100) {
      year += year < 50 ? 2000 : 1900;
    }

    const date = new Date(year, month, day);
    
    // Validar que la fecha sea válida
    if (date.getFullYear() !== year || 
        date.getMonth() !== month || 
        date.getDate() !== day) {
      throw new Error('Invalid date');
    }

    return date;
  }

  private parseAndApplyManualInput(inputValue: string) {
    if (!this.validateManualInput(inputValue)) {
      return; // No aplicar si no es válido
    }

    try {
      const dates = this.parseInputValue(inputValue);
      if (dates) {
        this.tempSelectedRange = dates;        
      } else {
        this.tempSelectedRange = null;
      }
    } catch (error) {
      console.error('Error parsing manual input:', error);
      this.hasError.set(true);
    }
  }

  // Helper methods for day customization
  getDayAvailability(date: CalendarDayEvent): DayAvailability | undefined {
    const dateStr = `${date.year}-${String(date.month + 1).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
    return this.availabilityMap().get(dateStr);
  }

  getDayClasses(date: CalendarDayEvent): string {
    const availability = this.getDayAvailability(date);
    const classes = ['day-cell'];
    
    if (availability) {
      classes.push(`status-${availability.status}`);
      
      if (availability.status === DayStatus.PAST) {
        classes.push('past-date');
      }
    }
    
    return classes.join(' ');
  }

  getDayTooltip(date: CalendarDayEvent): string {
    const availability = this.getDayAvailability(date);
    if (!availability) return '';
    
    let tooltip = availability.notes || '';
    
    if (availability.totalSlots > 0) {
      tooltip += `\\nSlots: ${availability.availableSlots}/${availability.totalSlots}`;
    }
    
    if (availability.workingHours) {
      tooltip += `\\nHorario: ${availability.workingHours.start} - ${availability.workingHours.end}`;
    }
    
    return tooltip;
  }

  // Quick action methods
  selectToday() {
    const today = new Date();
    this.selectedRange = [today, today];
    this.onDateSelect(this.selectedRange);
  }

  selectThisWeek() {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    this.selectedRange = [startOfWeek, endOfWeek];
    this.onDateSelect(this.selectedRange);
  }

  selectThisMonth() {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    this.selectedRange = [startOfMonth, endOfMonth];
    this.onDateSelect(this.selectedRange);
  }

  clearSelection() {
    this.selectedRange = null;
    this.onDateSelect(null);
  }

  // Methods that close calendar after selection
  public selectTodayAndClose() {
    const today = new Date();
    this.tempSelectedRange = [today, today];
    this.confirmSelection(); // Confirmar automáticamente las acciones rápidas
  }

  public selectThisWeekAndClose() {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    this.tempSelectedRange = [startOfWeek, endOfWeek];
    this.confirmSelection(); // Confirmar automáticamente las acciones rápidas
  }

  public selectThisMonthAndClose() {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    this.tempSelectedRange = [startOfMonth, endOfMonth];
    this.confirmSelection(); // Confirmar automáticamente las acciones rápidas
  }

  public clearSelectionAndClose() {
    this.tempSelectedRange = null;
    this.selectedRange = null;
    const range: DateRange = { start: null, end: null };
    this.onChange(range);
    this.dateRangeChange.emit(range);
    this.onTouched();
    this.closeCalendar();
  }

  private closeCalendar() {
    if (this.calendar?.hideOverlay) {
      this.calendar.hideOverlay();
    }
  }

  // Métodos para manejo de confirmación
  public confirmSelection() {
    if (this.tempSelectedRange && this.tempSelectedRange.length > 0) {
      this.selectedRange = [...this.tempSelectedRange];
                        
      
      const range: DateRange = {
        start: this.normalizeStartDate(this.selectedRange[0]) || null,
        end: this.normalizeEndDate(this.selectedRange[1] || this.selectedRange[0]) || null
      };
                        
      
      this.onChange(range);
      this.dateRangeChange.emit(range);
      this.onTouched();
      
      // Cerrar el calendario después de confirmar
      this.closeCalendar();
    }
  }

  /**
   * Normaliza la fecha de inicio a las 00:00:00.000 del día en UTC
   */
  private normalizeStartDate(date: Date | null): Date | null {
    if (!date) return null;
        
    
    // Crear nueva fecha a partir de los componentes año, mes, día para evitar problemas de zona horaria
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
        
    
    // Crear fecha local y luego convertir a UTC
    const normalized = new Date(year, month, day, 0, 0, 0, 0);
            
    
    return normalized;
  }

  /**
   * Normaliza la fecha de fin a las 23:59:59.999 del día en UTC
   */
  private normalizeEndDate(date: Date | null): Date | null {
    if (!date) return null;
        
    
    // Crear nueva fecha a partir de los componentes año, mes, día para evitar problemas de zona horaria
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
        
    
    // Crear fecha local y luego convertir a UTC
    const normalized = new Date(year, month, day, 23, 59, 59, 999);
            
    
    return normalized;
  }

  public hasValidSelection(): boolean {
    try {
      return !!(this.tempSelectedRange && Array.isArray(this.tempSelectedRange) && this.tempSelectedRange.length > 0);
    } catch (error) {
      return false;
    }
  }

  public getInvalidState(): boolean {
    try {
      return this.hasError() === true;
    } catch (error) {
      return false;
    }
  }

  public getContainerClassString(): string {
    try {
      let classes = '';
      if (this.config?.disabled) {
        classes += 'disabled ';
      }
      if (this.getInvalidState()) {
        classes += 'p-invalid ';
      }
      return classes.trim();
    } catch (error) {
      return '';
    }
  }

  public shouldShowAvailability(): boolean {
    try {
      return !!(this.config?.showAvailability && this.currentAvailability());
    } catch (error) {
      return false;
    }
  }

  public getCalendarClasses(): string {
    try {
      let classes = 'range-datepicker';
      if (this.config?.showAvailability) {
        classes += ' with-availability';
      }
      // Agregar clase aislada para evitar conflictos en agenda
      classes += ' orb-isolated-calendar';
      return classes;
    } catch (error) {
      return 'range-datepicker orb-isolated-calendar';
    }
  }

  // Métodos para manejar hover de botones de forma segura
  onButtonHover(event: Event, color: string) {
    const target = event.target as HTMLElement;
    if (target && target.style) {
      target.style.backgroundColor = color;
      target.style.borderColor = color;
    }
  }

  onButtonLeave(event: Event, color: string) {
    const target = event.target as HTMLElement;
    if (target && target.style) {
      target.style.backgroundColor = color;
      target.style.borderColor = color;
    }
  }

  onGrayButtonHover(event: Event) {
    const target = event.target as HTMLElement;
    if (target && target.style) {
      target.style.backgroundColor = '#e9ecef';
      target.style.color = '#495057';
    }
  }

  onGrayButtonLeave(event: Event) {
    const target = event.target as HTMLElement;
    if (target && target.style) {
      target.style.backgroundColor = 'transparent';
      target.style.color = '#6c757d';
    }
  }

  onConfirmButtonHover(event: Event) {
    const target = event.target as HTMLElement;
    if (target && target.style) {
      target.style.backgroundColor = '#0056b3';
      target.style.transform = 'translateY(-1px)';
      target.style.boxShadow = '0 4px 8px rgba(0, 123, 255, 0.3)';
    }
  }

  onConfirmButtonLeave(event: Event) {
    const target = event.target as HTMLElement;
    if (target && target.style && !(target as HTMLButtonElement).disabled) {
      target.style.backgroundColor = '#007bff';
      target.style.transform = 'translateY(0)';
      target.style.boxShadow = 'none';
    }
  }
}