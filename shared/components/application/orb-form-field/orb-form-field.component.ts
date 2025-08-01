// orb-form-field.component.ts
import { CommonModule } from '@angular/common';
import { Component, ContentChild, Input, inject } from '@angular/core';
import { AbstractControl, FormControlName, ReactiveFormsModule } from '@angular/forms';
import { UtilsService } from '@orb-services';
import { FloatLabelModule } from 'primeng/floatlabel';

@Component({
  selector: 'orb-form-field',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FloatLabelModule],
  styleUrls: ['./orb-form-field.component.scss'],
  template: `
    <div class="container">
      <p-floatLabel variant="on">
        <ng-content></ng-content>

        <label [for]="inputId">
          {{ label }}
          <span *ngIf="showRequiredAsterisk()" class="text-red">*</span>
        </label>
      </p-floatLabel>
      @if (errorMessages().length > 0) {
      <small class="p-error  text-red block mt-1">
        {{ errorMessages()[0] }}
      </small>
      }
    </div>
  `,
})
export class OrbFormFieldComponent {
  @Input() label = '';
  @Input() required?: boolean; 
  @Input() errorMsg = 'Campo obligatorio';
  @Input() showLabel?: boolean;
  inputId = '';
  @ContentChild(FormControlName) ctrlName?: FormControlName;
  private utilsService = inject(UtilsService);

  get control(): AbstractControl | null | undefined {
    return this.ctrlName?.control;
  }

  showRequiredAsterisk(): boolean {
    if (this.required !== undefined) {
      return this.required;
    }
    return this.utilsService.isRequired(this.control);
  }

  errorMessages(): string[] {
    if (this.control) {
      // Pasamos el label al UtilsService para mensajes más descriptivos
      return this.utilsService.getControlErrorMessages(this.control, this.label || 'Este campo');
    }
    return [];
  }
}
