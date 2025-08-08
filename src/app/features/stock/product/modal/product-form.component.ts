import { UtilsService } from '@orb-services';
import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProductStore } from '@orb-stores';
import { ProductResponseDto, CreateProductDto, UpdateProductDto } from '../../../../api/model/models';
import { FormButtonAction } from '@orb-models';

// PrimeNG & Orb Components
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { OrbFormFooterComponent, OrbFormFieldComponent, OrbTextInputComponent, OrbTextAreaComponent } from '@orb-components';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'orb-product-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    FloatLabelModule,
TextareaModule, 
    OrbFormFooterComponent,
    OrbFormFieldComponent,
        ReactiveFormsModule,    
        OrbTextInputComponent,
        OrbFormFieldComponent,
        OrbFormFooterComponent,
        OrbTextAreaComponent
      , ToastModule
    
  ],
  templateUrl: './product-form.component.html',
})
export class ProductFormComponent implements OnInit {
  @Input() product?: ProductResponseDto;
  @Output() saved = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private productStore = inject(ProductStore);
  public utilsService = inject(UtilsService);


  form!: FormGroup;
  isEditMode = false;

  footerActions: FormButtonAction[] = [
    { label: 'Cancelar', action: 'cancel', styleType: 'p-button-text' , severity: 'secondary'},
    { label: 'Guardar', action: 'save', styleType: 'p-button-success' , buttonType: 'submit' ,severity: 'info'},
  ];

  ngOnInit(): void {
    this.isEditMode = !!this.product;
    this.initForm();

    if (this.isEditMode && this.product) {
      this.form.patchValue({
        name: this.product.name,
        description: this.product.description,
        price: this.product.currentPrice 
      });
    }
  }

  private initForm(): void {
    // El formulario coincide con los campos del CreateProductDto
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      price: [0, [Validators.required, Validators.min(0.01)]],
    });
  }

  handleFooterAction(action: string): void {
    if (action === 'save') {
      this.onSubmit();
    } else if (action === 'cancel') {
      this.cancel.emit();
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();

    if (this.isEditMode && this.product?.id) {
      // --- MODO EDICIÓN ---
      const updateDto: UpdateProductDto = {
        name: formValue.name,
        description: formValue.description,
        price: formValue.price,
      };
      this.productStore.update({ id: this.product.id, dto: updateDto });
    } else {
      // --- MODO CREACIÓN ---
      const createDto: CreateProductDto = {
        name: formValue.name,
        description: formValue.description,
        price: formValue.price,
      };
      this.productStore.create(createDto);
    }

    this.saved.emit();
  }
}
