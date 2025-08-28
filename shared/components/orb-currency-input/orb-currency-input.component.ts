import { Component, forwardRef, Input, OnInit, Injector, LOCALE_ID, inject } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR, NgControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { getCurrencySymbol } from '@angular/common';
import { InputNumberModule } from 'primeng/inputnumber';

let nextId = 0;

@Component({
  selector: 'orb-currency-input',
  standalone: true,
  imports: [CommonModule, InputTextModule, FloatLabelModule, 
    InputNumberModule
  ],
  templateUrl: './orb-currency-input.component.html',
  styleUrls: ['./orb-currency-input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OrbCurrencyInputComponent),
      multi: true
    }
  ]
})
export class OrbCurrencyInputComponent implements ControlValueAccessor, OnInit {
  @Input() placeholder: string = '';
  @Input() inputId: string = `orb-currency-input-${nextId++}`;
  @Input() readOnly: boolean = false;
  @Input() currency: string = 'EUR';
  @Input() showCurrencyAside: boolean = true;

  _value: number | null = null;
  _displayValue: string = '';
  _disabled: boolean = false;
  _onChange: (value: any) => void = () => {};
  _onTouched: () => void = () => {};

  public ngControl: NgControl | null = null;
  public currencySymbol: string = '€';

  private locale = inject(LOCALE_ID);

  constructor(private injector: Injector) {}

  ngOnInit(): void {
    try {
      this.ngControl = this.injector.get(NgControl, null, { self: true, optional: true });
      if (this.ngControl) {
        this.ngControl.valueAccessor = this;
      }
    } catch (e) {
      console.warn('OrbCurrencyInputComponent: NgControl could not be found. Form binding might not work.', e);
    }

    // Get currency symbol based on currency code
    this.currencySymbol = getCurrencySymbol(this.currency, 'narrow', this.locale);
  }

  writeValue(value: any): void {
    this._value = value != null ? parseFloat(value) : null;
    this._displayValue = this._value != null ? this.formatDisplayValue(this._value) : '';
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
    
    // Remove currency symbol and format characters, keep only numbers and decimal point
    const cleanValue = inputValue.replace(/[^\d.,]/g, '').replace(/,/g, '.');
    
    // Prevent leading zeros (except for decimals like 0.5)
    const formattedValue = this.removeLeadingZeros(cleanValue);
    
    // Update display value with formatting
    this._displayValue = formattedValue;
    
    // Convert to number for form value
    const numericValue = formattedValue === '' ? null : parseFloat(formattedValue);
    
    // Validate number
    if (formattedValue !== '' && (isNaN(numericValue!) || numericValue! < 0)) {
      return; // Don't update if invalid
    }
    
    this._value = numericValue;
    this._onChange(numericValue);
    
    // Update input display
    (event.target as HTMLInputElement).value = this._displayValue;
  }

  onInputBlur(event: Event): void {
    this._onTouched();
    
    // Format the display value on blur
    if (this._value != null) {
      this._displayValue = this.formatDisplayValue(this._value);
      (event.target as HTMLInputElement).value = this._displayValue;
    }
  }

  onInputFocus(event: Event): void {
    // Remove formatting on focus for easier editing
    if (this._value != null) {
      this._displayValue = this._value.toString();
      (event.target as HTMLInputElement).value = this._displayValue;
    }
  }

  private formatDisplayValue(value: number): string {
    return new Intl.NumberFormat(this.locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  private removeLeadingZeros(value: string): string {
    if (value === '' || value === '0' || value.startsWith('0.')) {
      return value;
    }
    
    // Remove leading zeros but preserve decimal values
    return value.replace(/^0+/, '') || '0';
  }

  get isInvalid(): boolean {
    return !!(this.ngControl?.invalid && (this.ngControl?.touched || this.ngControl?.dirty));
  }
}