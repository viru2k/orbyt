import { Component, forwardRef, Input, OnInit, Injector } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, NgControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TextareaModule } from 'primeng/textarea';

let nextId = 0;

@Component({
  selector: 'orb-simple-textarea',
  standalone: true,
  imports: [CommonModule, TextareaModule],
  template: `
    <textarea
      pInputTextarea
      [id]="inputId"
      [placeholder]="placeholder"
      [rows]="rows"
      [cols]="cols"
      [value]="_value"
      [disabled]="_disabled"
      [readOnly]="readOnly"
      [autoResize]="autoResize"
      (input)="onInputChange($event)"
      (blur)="onInputBlur()"
      autocomplete="off"
      class="w-full"
      [ngClass]="{'ng-invalid ng-dirty': isInvalid}"
    ></textarea>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OrbSimpleTextareaComponent),
      multi: true
    }
  ]
})
export class OrbSimpleTextareaComponent implements ControlValueAccessor, OnInit {
  @Input() placeholder: string = '';
  @Input() inputId: string = `orb-simple-textarea-${nextId++}`;
  @Input() readOnly: boolean = false;
  @Input() rows: number = 3;
  @Input() cols: number = 30;
  @Input() autoResize: boolean = true;

  _value: string = '';
  _disabled: boolean = false;
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
      console.warn('OrbSimpleTextareaComponent: NgControl could not be found. Form binding might not work.', e);
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
    const inputValue = (event.target as HTMLTextAreaElement).value;
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