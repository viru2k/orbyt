// src/app/shared/components/orb-datepicker/orb-datepicker.component.ts
import { Component, forwardRef, Input, OnInit, Injector } from '@angular/core';
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
  @Input() dataType: string = 'date'; // Para que p-datepicker devuelva objetos Date

  // El input 'locale' se elimina, ya que confiamos en la configuración global de PrimeNG.

  _value: Date | Date[] | null = null;
  _onChange: (value: any) => void = () => {};
  _onTouched: () => void = () => {};
  public ngControl: NgControl | null = null;

  constructor(private injector: Injector) {}

  ngOnInit(): void {
    try {
      this.ngControl = this.injector.get(NgControl, null, { self: true, optional: true });
      if (this.ngControl) {
        this.ngControl.valueAccessor = this;
      }
    } catch (e) {
      console.warn('OrbDatepickerComponent: NgControl could not be found. Form binding might not work.', e);
    }
    // El dateFormat se pasará directamente a p-datepicker.
    // Si es undefined, p-datepicker usará el global o su default.
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
    return !!(this.ngControl?.invalid && (this.ngControl?.touched || this.ngControl?.dirty));
  }
}