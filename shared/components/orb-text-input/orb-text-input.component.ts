
import { Component, forwardRef, Input, OnInit, Optional, Self, Injector } from '@angular/core'; 
import { ControlValueAccessor, NG_VALUE_ACCESSOR, NgControl } from '@angular/forms';import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';

// Variable global para generar IDs únicos para los inputs, evitando colisiones.
let nextId = 0;

@Component({
  selector: 'orb-text-input',
  standalone: true,
  imports: [CommonModule, InputTextModule, FloatLabelModule],
  templateUrl: './orb-text-input.component.html',
  styleUrls: ['./orb-text-input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OrbTextInputComponent),
      multi: true
    }
  ]
})
export class OrbTextInputComponent implements ControlValueAccessor, OnInit {
  @Input() placeholder: string = '';
  @Input() type: string = 'text';
  @Input() inputId: string = `orb-text-input-${nextId++}`;

  _value: string = '';
  _disabled: boolean = false;
  _onChange: (value: any) => void = () => {};
  _onTouched: () => void = () => {};

  /**
   * Referencia a NgControl. Ahora se obtendrá del injector en ngOnInit.
   */
  public ngControl: NgControl | null = null;

  constructor(
    private injector: Injector // Inyecta el Injector de Angular
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

  onInputBlur(): void {
    this._onTouched();
  }

  get isInvalid(): boolean {
    return !!(this.ngControl?.invalid && (this.ngControl?.touched || this.ngControl?.dirty));
  }
}