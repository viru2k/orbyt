// src/app/shared/components/orb-select/orb-select.component.ts
import { Component, forwardRef, Input, OnInit, Injector } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, NgControl, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SelectModule } from 'primeng/select'; // Módulo para p-select (en PrimeNG v17+) o DropdownModule si es p-dropdown
import { TooltipModule } from 'primeng/tooltip';
import { TooltipPosition } from '@orb-models';

let nextIdSelect = 0;

@Component({
  selector: 'orb-select',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule, // Necesario para que [ngModel] y (ngModelChange) funcionen en p-select
    SelectModule,  // O DropdownModule si p-select no está disponible y usas p-dropdown
    TooltipModule
  ],
  templateUrl: './orb-select.component.html',
  styleUrls: ['./orb-select.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OrbSelectComponent),
      multi: true
    }
  ]
})
export class OrbSelectComponent implements ControlValueAccessor, OnInit {
  /**
   * Array de opciones para el selector.
   */
  @Input() options: any[] = [];
  /**
   * Nombre de la propiedad del objeto de opción que se mostrará como etiqueta.
   */
  @Input() optionLabel: string = 'label';
  /**
   * Nombre de la propiedad del objeto de opción que se usará como valor.
   * Si es undefined, se usará el objeto de opción completo como valor.
   */
  @Input() optionValue: string | undefined = undefined;
  /**
   * Texto que se muestra cuando no hay ningún valor seleccionado.
   */
  @Input() placeholder: string = 'Seleccionar una opción';
  /**
   * ID único para el input, se genera automáticamente si no se provee.
   */
  @Input() inputId: string = `orb-select-${nextIdSelect++}`;
  /**
   * Si el selector está deshabilitado.
   */
  @Input() disabled: boolean = false;
  /**
   * Clases CSS adicionales para aplicar al componente p-select.
   */
  @Input() styleClass?: string;
  /**
   * Clases CSS adicionales para aplicar al panel desplegable.
   */
  @Input() panelStyleClass?: string;
  /**
   * Si se muestra un botón para limpiar la selección.
   */
  @Input() showClear: boolean = false;
  /**
   * Si se habilita el filtro dentro del dropdown.
   */
  @Input() filter: boolean = false;
  /**
   * Campos por los que filtrar, separados por coma si son múltiples.
   * Por defecto, usará optionLabel si el filtro está habilitado.
   */
  @Input() filterBy: string | undefined = undefined;
  /**
   * Texto para el tooltip.
   */
  @Input() pTooltip?: string;
  /**
   * Posición del tooltip.
   */
  @Input() tooltipPosition:TooltipPosition = 'top';
  /**
   * Elemento al que se adjuntará el overlay del dropdown (ej. 'body').
   */
  @Input() appendTo: any = null;

  // Valor interno del componente
  _value: any = null;

  // Callbacks para ControlValueAccessor
  _onChange: (value: any) => void = () => {};
  _onTouched: () => void = () => {};

  // Referencia a NgControl para validación
  public ngControl: NgControl | null = null;

  constructor(private injector: Injector) {}

  ngOnInit(): void {
    // Obtener NgControl usando el Injector para evitar dependencias circulares
    try {
      this.ngControl = this.injector.get(NgControl, null, { self: true, optional: true });
      if (this.ngControl) {
        this.ngControl.valueAccessor = this;
      }
    } catch (e) {
      console.warn('OrbSelectComponent: NgControl could not be found. Form binding might not work.', e);
    }

    // Si el filtro está habilitado y filterBy no se ha especificado, usar optionLabel por defecto
    if (this.filter && !this.filterBy && this.optionLabel) {
        this.filterBy = this.optionLabel;
    }
  }

  // --- Implementación de ControlValueAccessor ---
  writeValue(value: any): void {
    this._value = value;
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

  // --- Manejadores de eventos internos ---
  /**
   * Se llama cuando el valor de p-select cambia.
   * Actualiza el valor interno y notifica a Angular Forms.
   * @param newValue El nuevo valor seleccionado.
   */
  onValueChange(newValue: any): void {
    this._value = newValue;
    this._onChange(newValue);
  }

  /**
   * Se llama cuando el p-select pierde el foco.
   * Notifica a Angular Forms que el control ha sido "tocado".
   */
  onDropdownBlur(): void {
    this._onTouched();
  }

  /**
   * Determina si el control debe mostrarse como inválido.
   * @returns boolean True si es inválido y ha sido tocado/modificado.
   */
  get isInvalid(): boolean {
    return !!(this.ngControl?.invalid && (this.ngControl?.touched || this.ngControl?.dirty));
  }
}