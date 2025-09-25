import { Component, Input, forwardRef, Output, EventEmitter, ChangeDetectionStrategy, Injector, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, NgControl } from '@angular/forms';

export type NumberInputSize = 'sm' | 'md' | 'lg';
export type NumberInputVariant = 'default' | 'filled' | 'outlined';

// Variable global para generar IDs únicos
let nextNumberId = 0;

@Component({
  selector: 'orb-input-number',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orb-input-number.component.html',
  styleUrls: ['./orb-input-number.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OrbInputNumberComponent),
      multi: true
    }
  ]
})
export class OrbInputNumberComponent implements ControlValueAccessor, OnInit {
  // Basic properties
  @Input() min?: number;
  @Input() max?: number;
  @Input() step: number = 1;
  @Input() suffix?: string;
  @Input() prefix?: string;
  @Input() disabled = false;
  @Input() placeholder: string = '';
  @Input() inputId: string = `orb-input-number-${nextNumberId++}`;
  @Input() readOnly: boolean = false;

  // New Alpino design properties
  @Input() label: string = '';
  @Input() helperText: string = '';
  @Input() errorMessage: string = '';
  @Input() required: boolean = false;
  @Input() size: NumberInputSize = 'md';
  @Input() variant: NumberInputVariant = 'default';
  @Input() leftIcon: string = '';
  @Input() rightIcon: string = '';
  @Input() clearable: boolean = false;
  @Input() fullWidth: boolean = true;
  @Input() showButtons: boolean = false;

  // Events
  @Output() focus = new EventEmitter<Event>();
  @Output() blur = new EventEmitter<Event>();
  @Output() clear = new EventEmitter<void>();

  value: number | null = null;
  private onChange = (value: number | null) => {};
  private onTouched = () => {};
  public ngControl: NgControl | null = null;

  constructor(private injector: Injector) {}

  ngOnInit(): void {
    try {
      this.ngControl = this.injector.get(NgControl, null, { self: true, optional: true });
      if (this.ngControl) {
        this.ngControl.valueAccessor = this;
      }
    } catch (e) {
      console.warn('OrbInputNumberComponent: NgControl could not be found.');
    }
  }

  onModelChange(value: number | null): void {
    this.value = value;
    this.onChange(value);
  }

  onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    this.onModelChange(value ? +value : null);
  }

  onInputFocus(): void {
    this.focus.emit();
  }

  onInputBlur(): void {
    this.onTouched();
    this.blur.emit();
  }

  clearValue(): void {
    this.value = null;
    this.onChange(null);
    this.clear.emit();
  }

  increment(): void {
    if (this.disabled || this.readOnly) return;
    const newValue = (this.value || 0) + this.step;
    if (this.max === undefined || newValue <= this.max) {
      this.onModelChange(newValue);
    }
  }

  decrement(): void {
    if (this.disabled || this.readOnly) return;
    const newValue = (this.value || 0) - this.step;
    if (this.min === undefined || newValue >= this.min) {
      this.onModelChange(newValue);
    }
  }

  formatDisplayValue(): string {
    if (this.value === null || this.value === undefined) {
      return '';
    }
    let formatted = this.value.toString();
    if (this.prefix) formatted = this.prefix + formatted;
    if (this.suffix) formatted = formatted + this.suffix;
    return formatted;
  }

  get containerClasses(): string {
    const classes = ['orb-input'];
    if (this.fullWidth) classes.push('orb-input--full-width');
    return classes.join(' ');
  }

  get inputContainerClasses(): string {
    const classes = [
      'orb-input__container',
      `orb-input__container--${this.variant}`,
      `orb-input__container--${this.size}`
    ];

    if (this.disabled) classes.push('orb-input__container--disabled');
    if (this.readOnly) classes.push('orb-input__container--readonly');
    if (this.isInvalid) classes.push('orb-input__container--error');
    if (this.leftIcon || this.showButtons) classes.push('orb-input__container--with-left-icon');
    if (this.rightIcon || this.clearable || this.showButtons) classes.push('orb-input__container--with-right-icon');

    return classes.join(' ');
  }

  get inputClasses(): string {
    const classes = ['orb-input__field', 'orb-input__field--number'];
    return classes.join(' ');
  }

  get isInvalid(): boolean {
    return !!(this.ngControl?.invalid && (this.ngControl?.touched || this.ngControl?.dirty));
  }

  writeValue(value: number | null): void {
    this.value = value;
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  handleKeyDown(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
    const isNumberKey = /^[0-9]$/.test(event.key);
    const isDot = event.key === '.';
    const isMinus = event.key === '-';

    if (!allowedKeys.includes(event.key) && !isNumberKey && !isDot && !isMinus) {
      event.preventDefault();
    }

    // Handle arrow keys for increment/decrement
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.increment();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.decrement();
    }
  }
}