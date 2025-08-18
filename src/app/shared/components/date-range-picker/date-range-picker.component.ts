import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, signal, computed, forwardRef, ViewChild, inject } from '@angular/core';
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
    <div class="orb-date-range-picker" [class.disabled]="config.disabled">
      <p-calendar
        #calendar
        [ngModel]="tempSelectedRange || selectedRange"
        (ngModelChange)="onDateSelect($event)"
        [placeholder]="config.placeholder || 'Seleccionar rango de fechas'"
        [disabled]="config.disabled || false"
        [minDate]="config.minDate"
        [maxDate]="config.maxDate"
        [showTime]="config.showTime || false"
        [showIcon]="true"
        [iconDisplay]="'input'"
        [timeOnly]="false"
        [hourFormat]="'24'"
        [stepMinute]="15"
        selectionMode="range"
        [inline]="false"
        [readonlyInput]="true"
        dateFormat="dd/mm/yy"
        [styleClass]="'w-full ' + (config.showAvailability ? 'with-availability' : '')"
        (onMonthChange)="onMonthChange($event)"
        (onYearChange)="onYearChange($event)"
        (onShow)="onCalendarShow()"
        [ngClass]="{ 'p-invalid': hasError }"
        #calendarRef>
        
        <!-- Header template con botones de acciones rápidas -->
        <ng-template pTemplate="header">
          <div class="calendar-quick-actions">
            <button 
              type="button"
              pButton 
              size="small"
              label="Hoy"
              class="p-button-text p-button-sm"
              (click)="selectTodayAndClose()"
              *ngIf="!config.disabled">
            </button>
            <button 
              type="button"
              pButton 
              size="small"
              label="Esta semana"
              class="p-button-text p-button-sm"
              (click)="selectThisWeekAndClose()"
              *ngIf="!config.disabled">
            </button>
            <button 
              type="button"
              pButton 
              size="small"
              label="Este mes"
              class="p-button-text p-button-sm"
              (click)="selectThisMonthAndClose()"
              *ngIf="!config.disabled">
            </button>
            <button 
              type="button"
              pButton 
              size="small"
              label="Limpiar"
              class="p-button-text p-button-sm"
              (click)="clearSelectionAndClose()"
              *ngIf="!config.disabled && selectedRange && (selectedRange[0] || selectedRange[1])">
            </button>
          </div>
        </ng-template>
        
        <!-- Footer template con botón confirmar -->
        <ng-template pTemplate="footer">
          <div class="calendar-footer-actions">
            <button 
              type="button"
              pButton 
              label="Confirmar"
              class="p-button-primary p-button-sm"
              (click)="confirmSelection()"
              [disabled]="!hasValidSelection()">
            </button>
          </div>
        </ng-template>
      </p-calendar>

      <!-- Note: Custom date templates will be implemented in future versions -->

      <!-- Información de disponibilidad -->
      <div class="availability-info" *ngIf="config.showAvailability && currentAvailability()">
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
export class DateRangePickerComponent implements OnInit, OnDestroy, ControlValueAccessor {
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
        this.hasError.set(true);
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


  // Event handlers
  onDateSelect(dates: Date | Date[] | null) {
    console.log('onDateSelect called with:', dates); // Debug log
    
    // Solo guardar temporalmente, no emitir cambios hasta confirmar
    if (!dates) {
      this.tempSelectedRange = null;
      return;
    }
    
    // Convert single date to array for consistency
    const dateArray = Array.isArray(dates) ? dates : [dates];
    this.tempSelectedRange = dateArray;
    
    console.log('Temp selection:', this.tempSelectedRange); // Debug log
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
    if (this.calendar && this.calendar.hideOverlay) {
      this.calendar.hideOverlay();
    }
  }

  // Métodos para manejo de confirmación
  public confirmSelection() {
    if (this.tempSelectedRange && this.tempSelectedRange.length > 0) {
      this.selectedRange = [...this.tempSelectedRange];
      
      const range: DateRange = {
        start: this.selectedRange[0] || null,
        end: this.selectedRange[1] || null
      };
      
      console.log('Confirming range:', range); // Debug log
      this.onChange(range);
      this.dateRangeChange.emit(range);
      this.onTouched();
      
      // Cerrar el calendario después de confirmar
      this.closeCalendar();
    }
  }

  public hasValidSelection(): boolean {
    return !!(this.tempSelectedRange && this.tempSelectedRange.length > 0);
  }
}