import { Component, forwardRef, Input, OnInit, Injector } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, NgControl, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CheckboxModule } from 'primeng/checkbox';

// Variable global para generar IDs únicos para los checkboxes, evitando colisiones.
let nextId = 0;

@Component({
  selector: 'orb-checkbox',
  standalone: true,
  imports: [CommonModule, CheckboxModule, FormsModule],
  templateUrl: './orb-checkbox.component.html',
  styleUrls: ['./orb-checkbox.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OrbCheckboxComponent),
      multi: true
    }
  ]
})
export class OrbCheckboxComponent implements ControlValueAccessor, OnInit {
  @Input() label: string = '';
  @Input() inputId: string = `orb-checkbox-${nextId++}`;
  @Input() binary: boolean = false;
  @Input() value: any = null;
  @Input() disabled: boolean = false;

  _checked: boolean | any = false;
  _disabled: boolean = false;
  _onChange: (value: any) => void = () => {};
  _onTouched: () => void = () => {};

  /**
   * Referencia a NgControl. Se obtendrá del injector en ngOnInit.
   */
  public ngControl: NgControl | null = null;

  constructor(
    private injector: Injector
  ) {}

  ngOnInit(): void {
    try {
      this.ngControl = this.injector.get(NgControl, null, { self: true, optional: true });
      if (this.ngControl) {
        this.ngControl.valueAccessor = this;
      }
    } catch (e) {
      console.warn('OrbCheckboxComponent: NgControl could not be found. Form binding might not work.', e);
    }
  }

  writeValue(value: any): void {
    if (this.binary) {
      this._checked = !!value;
    } else {
      this._checked = value;
    }
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

  onCheckboxChange(event: any): void {
    let newValue;
    
    if (this.binary) {
      newValue = event.checked;
    } else {
      newValue = event.checked ? (this.value !== null ? this.value : true) : null;
    }
    
    this._checked = newValue;
    this._onChange(newValue);
    this._onTouched();
  }

  get isInvalid(): boolean {
    return !!(this.ngControl?.invalid && (this.ngControl?.touched || this.ngControl?.dirty));
  }

  get isChecked(): boolean {
    if (this.binary) {
      return !!this._checked;
    }
    return this._checked !== null && this._checked !== undefined;
  }
}