import { CommonModule } from "@angular/common";
import { Component, ContentChild, Input } from "@angular/core";
import { FormControlName, ReactiveFormsModule } from "@angular/forms";

@Component({
    selector: 'orb-form-field',
    standalone: true,
    imports: [ReactiveFormsModule, CommonModule],
    template: `
      <div class="mb-3">
        <label class="block font-medium mb-1">
          {{ label }}
          <span *ngIf="required" class="text-red-500">*</span>
        </label>
  
        <ng-content></ng-content>
  
        <small class="p-error"
               *ngIf="control?.invalid && control?.touched">
          {{ errorMsg }}
        </small>
      </div>
    `
  })
  export class OrbFormFieldComponent {
    @Input() label = '';
    @Input() required = false;
    @Input() errorMsg = 'Campo obligatorio';
  
    @ContentChild(FormControlName) ctrlName?: FormControlName;
    get control() { return this.ctrlName?.control; }
  }
  