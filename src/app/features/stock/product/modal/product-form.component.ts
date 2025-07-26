import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import {  OrbFormFieldComponent, OrbFormFooterComponent } from '@orb-components';

import { ProductStore } from '@orb-stores';
import {
  ProductResponseDto,
  CreateProductDto,
  UpdateProductDto
} from '@orb-api/index';
import { FormButtonAction } from '@orb-models';
import { FloatLabelModule } from 'primeng/floatlabel';

@Component({
  selector: 'orb-product-form',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, OrbFormFieldComponent, FloatLabelModule,     OrbFormFooterComponent ],
  templateUrl: './product-form.component.html'
})
export class ProductFormComponent implements OnInit {
  @Input()  product?: ProductResponseDto = undefined;
  @Output() saved  = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
     public footerActions: FormButtonAction[] = [];
  private fb    = inject(FormBuilder);
  private store = inject(ProductStore);

  form = this.fb.group({
    sku:   ['', Validators.required],
    name:  ['', Validators.required],
    stock: [0,  Validators.required],
    price: [0,  Validators.required]
  });

  ngOnInit() {
         this.setupFooterActions();
    if (this.product) this.form.patchValue(this.product);
  }

  accept() {
    if (this.form.invalid) return;

    if (this.product) {
      const dto = this.form.value as UpdateProductDto;
      this.store.update({ id: this.product.id, dto });
    } else {
      const dto = this.form.value as CreateProductDto;
      this.store.create(dto);
    }
    this.saved.emit();
  }

  cancelForm() {
    this.cancel.emit();
  }

     private setupFooterActions(): void {
    this.footerActions = [
      {
        label: 'Cancelar',
        action: 'cancel', 
        styleType: 'text',
        severity: 'secondary',
        buttonType: 'button'
      },
      {
        label: this.product?.id ? 'Guardar Cambios' : 'Crear Cliente',
        action: 'submit', 
        severity: 'info',
        buttonType: 'submit', 
      }
    ];
  }
  handleFooterAction(action: string): void {
    if (action === 'cancel') {
      this.cancelForm();
    } else if (action === 'submit') {
   
    }
  }
}
