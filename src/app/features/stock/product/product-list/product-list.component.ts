import { OrbDialogComponent } from '../../../../../../shared/components/orb-dialog/orb-dialog.component';

import { OrbToolbarComponent } from '../../../../../../shared/components/orb-toolbar/orb-toolbar.component';
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrbTableComponent,  OrbButtonComponent } from '@orb-components';
import { ProductStore } from '@orb-stores';
import { Router } from '@angular/router';
import { ProductResponseDto } from '@orb-api/index';
import { DialogModule } from 'primeng/dialog';
import { ProductFormComponent } from '../modal/product-form.component';
import { OrbActionItem, OrbTableFeatures, TableColumn } from '@orb-models';

import { OrbCardComponent } from "@orb-components";
import { TableFilterEvent, TablePageEvent } from 'primeng/table';
import { SortEvent } from 'primeng/api';


@Component({
  selector: 'orb-products',
  standalone: true,
  imports: [CommonModule, OrbTableComponent, ProductFormComponent, OrbButtonComponent, DialogModule, OrbCardComponent, OrbToolbarComponent, OrbDialogComponent],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit {
  private productStore = inject(ProductStore);
  private router = inject(Router);
  display  = false;
  product: ProductResponseDto  | null = null;
  productUnderEdit: ProductResponseDto | null = null;
  
  // Configuración de la Tabla
  tableColumns: TableColumn[] = [
    { field: 'name', header: 'Nombre', sortable: true },
    { field: 'description', header: 'Descripción', width: '300px',  },
    { field: 'currentPrice', header: 'Precio', width: '120px', sortable: true /*, format: 'currency' si lo implementas */ },
    { field: 'actions', header: '', width: '70px', sortable: false } // Columna para el botón de elipsis
  ];

  tableFeaturesConfig: OrbTableFeatures = {
    showGlobalSearch: true,
    globalSearchPlaceholder: 'Buscar productos...'
  };

  // Acciones para cada fila (Editar, Eliminar)
  productRowActions: OrbActionItem<ProductResponseDto>[] = [
    {
      label: 'Editar',
      icon: 'pi pi-pencil',
      action: (product) => this.handleEditProduct(product ?? {} as ProductResponseDto)
    },
    {
      label: 'Eliminar',
      icon: 'pi pi-trash',
      action: (product) => this.handleDeleteProduct(product ?? {} as ProductResponseDto),
      styleClass: 'p-button-danger' // Opcional: para dar estilo al item del menú
    }
    // Puedes añadir más acciones aquí si es necesario
  ];

  // Acciones para la cabecera de la tabla (ej. "Agregar Nuevo Producto")
  productTableHeaderActions: OrbActionItem[] = [
    {
      label: 'Nuevo Producto',
      icon: 'pi pi-plus',
      action: () => this.handleAddNewProduct()
    }
    // Si "Agregar" debe estar en el popover de la fila, necesitas aclarar qué haría exactamente
    // para una fila existente. Si es un error y "Agregar" es global, esta es la forma correcta.
  ];

  // Propiedades para paginación y carga inicial
  tableRows = signal(10);
  tableFirst = signal(0);


  products$ = this.productStore.products$;

  ngOnInit() {
    this.productStore.load();
  }

  showProductForm() {
    this.display = true;
  }

  open(product?: ProductResponseDto) {  
    this.productUnderEdit = product ?? {} as ProductResponseDto;
    this.display = true;
  }

  handleDialogClose() {
    this.display = false;
  }
  
  onSavedForm() {
    this.display = false;
    this.productStore.load();          // refresca tabla
  }

  onCancelForm() {
    this.display = false;
  }


  handleEditProduct(product: ProductResponseDto) {
    console.log(product)
    this.productUnderEdit = {...product}
    this.display = true;
  }

  handleDeleteProduct(product: ProductResponseDto) {
  this.productStore.remove(product.id);
  }

  handleAddNewProduct() {
 /*    this.selectedProductId.set(undefined); // Limpiar ID para nuevo producto
    this.displayProductForm.set(true); */
  }

  onProductFormClose(saved: boolean) {
  /*   this.displayProductForm.set(false);
    if (saved) {
      this.loadProducts();
    } */
  }

  loadProducts(event?: TablePageEvent | SortEvent | TableFilterEvent) {
    if (event && 'first' in event && 'rows' in event) { // PageEvent
        this.tableFirst.set(event.first);
        this.tableRows.set(event.rows);
    }
    // Adapta para pasar la paginación, ordenación y filtros a tu servicio
  /*   this.productService.getAllProducts({
        page: this.tableFirst() / this.tableRows() + 1,
        limit: this.tableRows(),
        // sort: event && 'sortField' in event ? `${event.sortField}:${event.sortOrder === 1 ? 'asc' : 'desc'}` : undefined,
        // filter: event && 'filters' in event ? event.filters : undefined // Adapta cómo manejas filtros
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(); */
  }
}
