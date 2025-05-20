// src/app/shared/components/orb-multiselect/orb-multiselect.component.ts
import { Component, forwardRef, Input, OnInit, Injector } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, NgControl, FormsModule } from '@angular/forms'; // <<<--- IMPORTAR FormsModule
import { CommonModule } from '@angular/common';
import { MultiSelectModule } from 'primeng/multiselect';
import { TooltipModule } from 'primeng/tooltip';
import { TooltipPosition } from '@orb-models';

let nextIdMultiselect = 0;

@Component({
  selector: 'orb-multiselect',
  standalone: true,
  imports: [
    CommonModule,
    MultiSelectModule,
    TooltipModule,
    FormsModule // <<<--- AÑADIR FormsModule AQUÍ
  ],
  templateUrl: './orb-multiselect.component.html',
  styleUrls: ['./orb-multiselect.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OrbMultiselectComponent),
      multi: true
    }
  ]
})
export class OrbMultiselectComponent implements ControlValueAccessor, OnInit {
  @Input() options: any[] = [];
  @Input() optionLabel: string = 'label';
  @Input() optionValue: string | undefined = undefined; // Si es undefined, se usa el objeto completo
  @Input() placeholder: string = 'Seleccionar';
  @Input() inputId: string = `orb-multiselect-${nextIdMultiselect++}`;
  @Input() disabled: boolean = false;
  @Input() styleClass?: string;
  @Input() panelStyleClass?: string;
  @Input() display: 'comma' | 'chip' = 'comma';
  @Input() maxSelectedLabels: number = 3;
  @Input() selectedItemsLabel: string = '{0} items seleccionados'; // Cambiado a español
  @Input() filter: boolean = true;
  @Input() pTooltip?: string;
  @Input() tooltipPosition: TooltipPosition = "bottom";
  @Input() appendTo: any = null;

  _value: any[] = []; // p-multiselect trabaja con arrays para su valor
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
      console.warn('OrbMultiselectComponent: NgControl could not be found.', e);
    }
  }

  writeValue(value: any[]): void {
    this._value = value ?? [];
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

  // Este método se llama cuando p-multiselect emite (ngModelChange)
  onValueChange(newValue: any[]): void {
    this._value = newValue;
    this._onChange(newValue);
  }

  onMultiselectBlur(): void {
    this._onTouched();
  }

  get isInvalid(): boolean {
    return !!(this.ngControl?.invalid && (this.ngControl?.touched || this.ngControl?.dirty));
  }
}
