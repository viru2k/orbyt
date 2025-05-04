import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { OrbFormFieldComponent } from '@orb-components';

import { ProductStore } from '@orb-stores';
import {
  ProductResponseDto,
  CreateProductDto,
  UpdateProductDto
} from '@orb-api/index';

@Component({
  selector: 'orb-product-form',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, OrbFormFieldComponent],
  templateUrl: './product-form.component.html'
})
export class ProductFormComponent implements OnInit {
  @Input()  product?: ProductResponseDto = undefined;
  @Output() saved  = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  private fb    = inject(FormBuilder);
  private store = inject(ProductStore);

  form = this.fb.group({
    sku:   ['', Validators.required],
    name:  ['', Validators.required],
    stock: [0,  Validators.required],
    price: [0,  Validators.required]
  });

  ngOnInit() {
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
}
