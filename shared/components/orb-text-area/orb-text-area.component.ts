// src/app/shared/components/orb-textarea/orb-textarea.component.ts
import { Component, Input, forwardRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { TextareaModule } from 'primeng/textarea'; // Importación clave
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'orb-text-area',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule, // Necesario para [(ngModel)] si se usa internamente para CVA
    ReactiveFormsModule, // Útil si el componente padre usa Reactive Forms
    TextareaModule,
    TooltipModule
  ],
  templateUrl: './orb-text-area.component.html',
  styleUrls: ['./orb-text-area.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OrbTextAreaComponent),
      multi: true
    }
  ]
})
export class OrbTextAreaComponent implements ControlValueAccessor, OnInit {
  @Input() label?: string;
  @Input() placeholder: string = '';
  @Input() rows: number = 3;
  @Input() cols: number = 30; // Default de pInputTextarea si no se especifica
  @Input() autoResize: boolean = false;
  @Input() pTooltip?: string;
  @Input() tooltipPosition: string = 'top';
  @Input() disabled: boolean = false;
  @Input() readonly: boolean = false;
  @Input() required: boolean = false;
  @Input() inputId: string = `orb-textarea-${orbTextareaUniqueId++}`; // Generar ID único
  @Input() fieldClass?: string; // Clase CSS para el contenedor .field
  @Input() styleClass?: string; // Clase CSS para el pInputTextarea
  @Input() helpText?: string; // Texto de ayuda o error

  // Para ControlValueAccessor
  _value: any = '';
  onChange: (value: any) => void = () => {};
  onTouched: () => void = () => {};

  // Esto es para poder usar formControlName directamente sin tener que pasar el control
  // pero si se pasa el control (ej. [formControl]="miControl") funcionaría también.
  // Si se usa solo con formControlName, no necesitamos un @Input() formControl.
  // El NG_VALUE_ACCESSOR se encarga de la conexión.

  constructor() {}

  ngOnInit(): void {
    // Si label está presente y no hay placeholder, usar label como placeholder
    if (this.label && !this.placeholder) {
      // this.placeholder = this.label; // Opcional, depende de la preferencia de diseño
    }
  }

  get value(): any {
    return this._value;
  }

  set value(val: any) {
    if (val !== this._value) {
      this._value = val;
      this.onChange(val);
    }
  }

  writeValue(value: any): void {
    this._value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.value = value; // Esto llamará a onChange
  }

  onBlur(): void {
    this.onTouched();
  }
}

// Para generar IDs únicos para los inputs si no se provee uno
let orbTextareaUniqueId = 0;