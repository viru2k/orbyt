// src/app/shared/components/orb-datepicker/orb-datepicker.component.ts
import { Component, forwardRef, Input, OnInit, Injector, LOCALE_ID, Inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, NgControl, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DatePickerModule } from 'primeng/datepicker'; // Usando DatePickerModule
import { TooltipModule } from 'primeng/tooltip';
// Ya no importamos PrimeNGConfig aquí; se asume configuración global.

let nextIdDatepicker = 0;

@Component({
  selector: 'orb-datepicker',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePickerModule,
    TooltipModule
  ],
  templateUrl: './orb-datepicker.component.html',
  styleUrls: ['./orb-datepicker.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OrbDatepickerComponent),
      multi: true
    }
  ]
})
export class OrbDatepickerComponent implements ControlValueAccessor, OnInit {
  @Input() placeholder: string = '';
  @Input() inputId: string = `orb-datepicker-${nextIdDatepicker++}`;
  @Input() disabled: boolean = false;
  @Input() styleClass?: string;
  /**
   * Formato de la fecha (ej. 'dd/mm/yy', 'dd.mm.yy').
   * Si no se especifica, p-datepicker usará el formato definido en la configuración global de PrimeNGConfig.
   * Si tampoco hay uno global, PrimeNG usa su propio default (usualmente 'mm/dd/yy').
   */
  /**
   * Modo de visualización: 'date' solo fecha, 'datetime' fecha y hora
   */
  @Input() mode: 'date' | 'datetime' = 'date';
  @Input() dateFormat: string | undefined = undefined;
  @Input() showIcon: boolean = true;
  @Input() appendTo: any = null;
  @Input() pTooltip?: string;
  @Input() tooltipPosition: string = 'top';
  @Input() minDate?: Date;
  @Input() maxDate?: Date;
  @Input() yearRange?: string;
  @Input() selectionMode: 'single' | 'multiple' | 'range' = 'single';
  @Input() inline: boolean = false;
  @Input() showButtonBar: boolean = true;
  @Input() hideOnDateTimeSelect: boolean = true; // Nueva propiedad para controlar auto-cierre
  @Input() dataType: string = 'date'; // Para que p-datepicker devuelva objetos Date
  @Input() showTime: boolean = false;
  @Input() timeOnly: boolean = false;
  @Input() hourFormat: '12' | '24' = '24';
  @Input() disabledDays: number[] | null = null;

  // El input 'locale' se elimina, ya que confiamos en la configuración global de PrimeNG.

  _value: Date | Date[] | null = null;
  _onChange: (value: any) => void = () => {};
  _onTouched: () => void = () => {};
  public ngControl: NgControl | null = null;

  // Ancho dinámico calculado
  get dynamicWidth(): string {
    return this.calculateWidth();
  }

  constructor(
    private injector: Injector,
    @Inject(LOCALE_ID) private locale: string
  ) {}

  ngOnInit(): void {
    try {
      this.ngControl = this.injector.get(NgControl, null, { self: true, optional: true });
      if (this.ngControl) {
        this.ngControl.valueAccessor = this;
      }
    } catch (e) {
      console.warn('OrbDatepickerComponent: NgControl could not be found. Form binding might not work.', e);
    }

    // Configurar propiedades basadas en el modo
    this.setupModeProperties();
  }

  private setupModeProperties(): void {
    if (this.mode === 'datetime') {
      this.showTime = true;
      if (!this.dateFormat) {
        this.dateFormat = this.locale.startsWith('es') ? 'dd/mm/yy' : 'mm/dd/yy';
      }
    } else {
      this.showTime = false;
      if (!this.dateFormat) {
        this.dateFormat = this.locale.startsWith('es') ? 'dd/mm/yy' : 'mm/dd/yy';
      }
    }
    
    // Si es modo range, no cerrar automáticamente para permitir selección de rango completo
    if (this.selectionMode === 'range') {
      this.hideOnDateTimeSelect = false;
      this.showButtonBar = true; // Forzar botones para que puedan cerrar manualmente
    }
  }

  writeValue(value: any): void {
    if (value instanceof Date || Array.isArray(value) || value === null || value === undefined) {
      this._value = value;
    } else if (typeof value === 'string') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        this._value = date;
      } else {
        this._value = null;
      }
    } else {
        this._value = null;
    }
  }

  registerOnChange(fn: any): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this._onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onValueChange(newValue: Date | Date[] | null): void {
    this._value = newValue;
    this._onChange(newValue);
  }

  onCalendarBlur(): void {
    this._onTouched();
  }

  get isInvalid(): boolean {
    try {
      const control = this.ngControl;
      if (!control) return false;
      
      const isInvalidState = !!control.invalid;
      const isTouchedOrDirty = !!(control.touched || control.dirty);
      
      return isInvalidState && isTouchedOrDirty;
    } catch (error) {
      console.warn('Error checking isInvalid state:', error);
      return false;
    }
  }
  
  public getComponentClasses(): string {
    try {
      let classes = this.styleClass || '';
      // Agregar clase aislada para evitar conflictos en agenda
      classes += ' orb-isolated-datepicker';
      return classes.trim();
    } catch (error) {
      return 'orb-isolated-datepicker';
    }
  }

  /**
   * Calcula el ancho apropiado basado en el tipo de calendario
   */
  private calculateWidth(): string {
    // Anchos base en rem para diferentes tipos
    const widths = {
      single: '10rem',      // Fecha simple: "dd/mm/yyyy" ~10rem
      singleTime: '13rem',  // Fecha + hora: "dd/mm/yyyy hh:mm" ~13rem
      range: '20rem',       // Rango: "dd/mm/yyyy - dd/mm/yyyy" ~20rem
      rangeTime: '26rem'    // Rango + hora: "dd/mm/yyyy hh:mm - dd/mm/yyyy hh:mm" ~26rem
    };
    
    if (this.selectionMode === 'range') {
      return this.showTime ? widths.rangeTime : widths.range;
    } else {
      return this.showTime ? widths.singleTime : widths.single;
    }
  }
}