import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';

@Component({
  selector: 'orb-input-number',
  standalone: true,
  imports: [CommonModule, FormsModule, InputNumberModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OrbInputNumberComponent),
      multi: true
    }
  ],
  template: `
    <p-inputNumber
      [ngModel]="value"
      (ngModelChange)="onModelChange($event)"
      [min]="min"
      [max]="max"
      [step]="step"
      [suffix]="suffix"
      [prefix]="prefix"
      [disabled]="disabled"
      [placeholder]="placeholder"
      [class]="styleClass"
    ></p-inputNumber>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class OrbInputNumberComponent implements ControlValueAccessor {
  @Input() min?: number;
  @Input() max?: number;
  @Input() step?: number = 1;
  @Input() suffix?: string;
  @Input() prefix?: string;
  @Input() disabled = false;
  @Input() placeholder?: string;
  @Input() styleClass?: string;

  value: number | null = null;
  private onChange = (value: number | null) => {};
  private onTouched = () => {};

  onModelChange(value: number | null): void {
    this.value = value;
    this.onChange(value);
    this.onTouched();
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
}