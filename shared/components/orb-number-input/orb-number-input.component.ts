import { Component, forwardRef, Input, OnInit, Injector, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, NgControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';

let nextId = 0;

@Component({
  selector: 'orb-number-input',
  standalone: true,
  imports: [CommonModule, InputTextModule],
  templateUrl: './orb-number-input.component.html',
  styleUrls: ['./orb-number-input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OrbNumberInputComponent),
      multi: true
    }
  ]
})
export class OrbNumberInputComponent implements ControlValueAccessor, OnInit {
  @Input() placeholder: string = '';
  @Input() inputId: string = `orb-number-input-${nextId++}`;
  @Input() readOnly: boolean = false;
  @Input() min: number | null = null;
  @Input() max: number | null = null;
  @Input() step: number = 1;
  @Input() allowDecimals: boolean = false;

  _value: number | null = null;
  _displayValue: string = '';
  _disabled: boolean = false;
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
      console.warn('OrbNumberInputComponent: NgControl could not be found. Form binding might not work.', e);
    }
  }

  writeValue(value: any): void {
    this._value = value != null ? parseFloat(value) : null;
    this._displayValue = this._value != null ? this._value.toString() : '';
  }

  registerOnChange(fn: any): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this._onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this._disabled = isDisabled;
  }

  onInputChange(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;

    // Allow empty value
    if (inputValue === '') {
      this._value = null;
      this._displayValue = '';
      this._onChange(null);
      return;
    }

    // Remove non-numeric characters, keep only numbers and decimal point if allowed
    let cleanValue = this.allowDecimals
      ? inputValue.replace(/[^\d.-]/g, '').replace(/,/g, '.')
      : inputValue.replace(/[^\d-]/g, '');

    // Parse value
    const numericValue = this.allowDecimals ? parseFloat(cleanValue) : parseInt(cleanValue, 10);

    // Validate number
    if (isNaN(numericValue)) {
      return; // Don't update if invalid
    }

    // Apply min/max constraints
    let finalValue = numericValue;
    if (this.min !== null && finalValue < this.min) {
      finalValue = this.min;
    }
    if (this.max !== null && finalValue > this.max) {
      finalValue = this.max;
    }

    this._value = finalValue;
    this._displayValue = finalValue.toString();
    this._onChange(finalValue);

    // Update input display
    (event.target as HTMLInputElement).value = this._displayValue;
  }

  onInputBlur(event: Event): void {
    this._onTouched();
  }

  get isInvalid(): boolean {
    return !!(this.ngControl?.invalid && (this.ngControl?.touched || this.ngControl?.dirty));
  }
}
