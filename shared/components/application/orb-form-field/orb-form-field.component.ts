// orb-form-field.component.ts
import { CommonModule } from '@angular/common';
import { Component, ContentChild, Input, inject } from '@angular/core';
import { AbstractControl, FormControlName, ReactiveFormsModule } from '@angular/forms';
import { UtilsService } from '@orb-services';

@Component({
  selector: 'orb-form-field',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  styleUrls: ['./orb-form-field.component.scss'],
  template: `
    <div class="container">
  
       

        <label class="field-label" [for]="inputId">
          {{ label }}
          <span *ngIf="showRequiredAsterisk()" class="text-red">*</span>
        </label>
         <ng-content></ng-content>
      @if (description && errorMessages().length === 0) {
      <small class="field-description text-600 block mt-1">
        {{ description }}
      </small>
      }
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
  @Input() description?: string; // Nueva propiedad para la descripción
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
