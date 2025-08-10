import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { InputSwitchModule } from 'primeng/inputswitch';

@Component({
  selector: 'orb-switch',
  standalone: true,
  imports: [CommonModule, FormsModule, InputSwitchModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OrbSwitchComponent),
      multi: true
    }
  ],
  template: `
    <div class="orb-switch-wrapper" [class.disabled]="disabled">
      <p-inputSwitch
        [ngModel]="value"
        (ngModelChange)="onModelChange($event)"
        [disabled]="disabled"
        [class]="styleClass"
      ></p-inputSwitch>
      <label *ngIf="label" class="orb-switch-label">{{ label }}</label>
    </div>
  `,
  styles: [`
    .orb-switch-wrapper {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .orb-switch-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      margin: 0;
      cursor: pointer;
    }
    
    .disabled .orb-switch-label {
      color: #9ca3af;
      cursor: not-allowed;
    }
  `]
})
export class OrbSwitchComponent implements ControlValueAccessor {
  @Input() disabled = false;
  @Input() label?: string;
  @Input() styleClass?: string;

  value = false;
  private onChange = (value: boolean) => {};
  private onTouched = () => {};

  onModelChange(value: boolean): void {
    this.value = value;
    this.onChange(value);
    this.onTouched();
  }

  writeValue(value: boolean): void {
    this.value = value ?? false;
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}