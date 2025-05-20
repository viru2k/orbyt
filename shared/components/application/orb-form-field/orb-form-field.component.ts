// orb-form-field.component.ts
import { CommonModule } from "@angular/common";
import { Component, ContentChild, Input, inject } from "@angular/core";
import { AbstractControl, FormControlName, ReactiveFormsModule } from "@angular/forms";
import { UtilsService } from "@orb-services";


@Component({
  selector: 'orb-form-field',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  styleUrls: ['./orb-form-field.component.scss'],
  template: `
    <div class="mb-3 container">
      <label class="block font-medium">
        {{ label }}
        <span *ngIf="showRequiredAsterisk()" class="text-red-500">*</span>
      </label>
      <ng-content></ng-content>
      @if (errorMessages().length > 0) {
        <small class="p-error block mt-1">
          {{ errorMessages()[0] }}
        </small>
      }
    </div>
  `
})
export class OrbFormFieldComponent {
  @Input() label = '';
  @Input() required?: boolean; // Para el asterisco si se pasa explícitamente
@Input() errorMsg = 'Campo obligatorio';
  // Ya no necesitamos @Input() errorMsg si lo generamos dinámicamente

  @ContentChild(FormControlName) ctrlName?: FormControlName;
  private utilsService = inject(UtilsService);

  get control(): AbstractControl | null | undefined {
    return this.ctrlName?.control;
  }

  // Para el asterisco, podemos usar el 'required' del validador del control
  // o el 'requiredProp' si se pasa explícitamente.
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