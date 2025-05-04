import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrbTableComponent, OrbColumn, OrbButtonComponent } from '@orb-components';
import { ProductStore } from '@orb-stores';
import { Router } from '@angular/router';
import { ProductResponseDto } from '@orb-api/index';
import { DialogModule } from 'primeng/dialog';
import { ProductFormComponent } from '../modal/product-form.component';


@Component({
  selector: 'orb-products',
  standalone: true,
  imports: [CommonModule, OrbTableComponent, ProductFormComponent, OrbButtonComponent, DialogModule],
  templateUrl: './products-list.component.html'
})
export class ProductsListComponent implements OnInit {
  private store = inject(ProductStore);
  private router = inject(Router);
  display  = false;
  prodEdit: ProductResponseDto  | null = null;
  productUnderEdit: ProductResponseDto | null = null;
  columns: OrbColumn[] = [
    { field: 'sku',    header: 'SKU',    width: '120px' },
    { field: 'name',   header: 'Nombre' },
    { field: 'stock',  header: 'Stock',  width: '100px' },
    { field: 'price',  header: 'Precio', width: '120px' },
    { field: 'actions', header: '', width: '80px', sortable: false } // columna acciones
  ];

  products$ = this.store.products$;

  ngOnInit() {
    this.store.load();
  }

  create() {
    this.router.navigate(['/stock/products/create']);
  }

  edit(productId: number) {
    this.router.navigate(['/stock/products/edit', productId]);
  }

  delete(productId: number) {
    this.store.remove(productId);
  }

  open(product?: ProductResponseDto) {  
    this.productUnderEdit = product ?? {} as ProductResponseDto;
    this.display = true;
  }
  
  onSaved() {
    this.display = false;
    this.store.load();          // refresca tabla
  }
}
