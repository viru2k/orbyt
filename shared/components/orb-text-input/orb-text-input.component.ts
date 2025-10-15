
import { Component, forwardRef, Input, OnInit, Injector, ChangeDetectionStrategy, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, NgControl } from '@angular/forms';
import { CommonModule } from '@angular/common';

export type InputSize = 'sm' | 'md' | 'lg';
export type InputVariant = 'default' | 'filled' | 'outlined';

// Variable global para generar IDs únicos para los inputs, evitando colisiones.
let nextId = 0;

@Component({
  selector: 'orb-text-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orb-text-input.component.html',
  styleUrls: ['./orb-text-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OrbTextInputComponent),
      multi: true
    }
  ]
})
export class OrbTextInputComponent implements ControlValueAccessor, OnInit {
  // Basic properties
  @Input() placeholder: string = '';
  @Input() type: string = 'text';
  @Input() inputId: string = `orb-text-input-${nextId++}`;
  @Input() readOnly: boolean = false;
  @Input() autocomplete: string = 'off';

  // New Alpino design properties
  @Input() label: string = '';
  @Input() helperText: string = '';
  @Input() errorMessage: string = '';
  @Input() required: boolean = false;
  @Input() size: InputSize = 'md';
  @Input() variant: InputVariant = 'default';
  @Input() leftIcon: string = '';
  @Input() rightIcon: string = '';
  @Input() clearable: boolean = false;
  @Input() fullWidth: boolean = true;

  // Events
  @Output() focus = new EventEmitter<Event>();
  @Output() blur = new EventEmitter<Event>();
  @Output() clear = new EventEmitter<void>();

  _value: string = '';
  _disabled: boolean = false;
  _onChange: (value: any) => void = () => {};
  _onTouched: () => void = () => {};

  /**
   * Referencia a NgControl. Ahora se obtendrá del injector en ngOnInit.
   */
  public ngControl: NgControl | null = null;

  constructor(
    private injector: Injector, // Inyecta el Injector de Angular
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Intenta obtener NgControl desde el injector actual.
    // Esto retrasa la resolución de NgControl hasta después de que el componente
    // se haya instanciado, lo que puede ayudar a romper ciclos de DI.
    // Los decoradores @Optional() y @Self() se simulan aquí con el flag del injector.
    try {
      this.ngControl = this.injector.get(NgControl, null, { self: true, optional: true });
      if (this.ngControl) {
        this.ngControl.valueAccessor = this;
      }
    } catch (e) {
      // En caso de que injector.get falle si NgControl no está (aunque optional:true debería prevenirlo)
      console.warn('OrbTextInputComponent: NgControl could not be found. Form binding might not work.', e);
    }
  }

  writeValue(value: any): void {
    this._value = value ?? '';
    this.cdr.markForCheck(); // Forzar detección de cambios
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
    this._value = inputValue;
    this._onChange(inputValue);
  }

  onInputFocus(): void {
    this.focus.emit();
  }

  clearValue(): void {
    this._value = '';
    this._onChange('');
    this.clear.emit();
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

    if (this._disabled) classes.push('orb-input__container--disabled');
    if (this.readOnly) classes.push('orb-input__container--readonly');
    if (this.isInvalid) classes.push('orb-input__container--error');
    if (this.leftIcon) classes.push('orb-input__container--with-left-icon');
    if (this.rightIcon || this.clearable) classes.push('orb-input__container--with-right-icon');

    return classes.join(' ');
  }

  get inputClasses(): string {
    const classes = ['orb-input__field'];
    return classes.join(' ');
  }

  onInputBlur(): void {
    this._onTouched();
    this.blur.emit();
  }

  get isInvalid(): boolean {
    return !!(this.ngControl?.invalid && (this.ngControl?.touched || this.ngControl?.dirty));
  }
}