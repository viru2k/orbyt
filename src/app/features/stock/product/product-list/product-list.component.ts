import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, AsyncPipe, CurrencyPipe } from '@angular/common';
import { ProductStore } from '@orb-stores';
import { ProductResponseDto } from '@orb-api/index';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { OrbCardComponent, OrbTableComponent, OrbDialogComponent, OrbToolbarComponent, OrbButtonComponent, OrbActionsPopoverComponent } from '@orb-components';
import { ProductFormComponent } from '../modal/product-form.component';
import { NotificationService } from '@orb-services';
import { OrbActionItem, OrbTableFeatures, TableColumn, NotificationSeverity } from '@orb-models';

@Component({
  selector: 'orb-product-list',
  standalone: true,
  imports: [
    CommonModule,
    AsyncPipe,
    CurrencyPipe,
    OrbTableComponent,
    ProductFormComponent,
    OrbButtonComponent,
    OrbCardComponent,
    OrbToolbarComponent,
    OrbDialogComponent,
    OrbActionsPopoverComponent,
    ConfirmDialogModule
  ],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
  providers: [ConfirmationService]
})
export class ProductListComponent implements OnInit {
  private productStore = inject(ProductStore);
  private confirmationService = inject(ConfirmationService);
  private notificationService = inject(NotificationService);

  displayProductModal = signal(false);
  productToEdit = signal<ProductResponseDto | null>(null);
  isEditMode = signal(false);

  // Usamos el nuevo selector con los datos mapeados
  products$ = this.productStore.selectProductsWithMappedData;
  isLoading$ = this.productStore.loading$;

  // Columnas actualizadas para reflejar el DTO
  tableColumns: TableColumn[] = [
    { field: 'name', header: 'Nombre', sortable: true },
    { field: 'currentPrice', header: 'Precio', sortable: true },
    { field: 'statusText', header: 'Estado', sortable: true },
    { field: 'ownerName', header: 'Propietario', sortable: true },
    { field: 'actions', header: 'Acciones', sortable: false }
  ];

  tableFeaturesConfig: OrbTableFeatures = {
    showGlobalSearch: true,
    globalSearchPlaceholder: 'Buscar productos...'
  };

  productRowActions: OrbActionItem<ProductResponseDto>[] = [
    {
      label: 'Editar',
      icon: 'pi pi-pencil',
      action: (product) => this.openProductModal(product)
    },
    {
      label: 'Eliminar',
      icon: 'pi pi-trash',
      action: (product) => this.confirmDeleteProduct(product as ProductResponseDto),
      styleClass: 'p-button-danger'
    }
  ];

  productTableHeaderActions: OrbActionItem[] = [
    {
      label: 'Nuevo Producto',
      icon: 'pi pi-plus',
      action: () => this.openProductModal()
    }
  ];

  tableRows = signal(10);
  tableFirst = signal(0);

  ngOnInit() {
    this.productStore.load();
  }

  showProductForm() {
    this.openProductModal();
  }

  openProductModal(product?: ProductResponseDto) {
    this.isEditMode.set(!!product);
    this.productToEdit.set(product ? { ...product } : null);
    this.displayProductModal.set(true);
  }

  confirmDeleteProduct(product: ProductResponseDto) {
    if (!product?.id) {
      this.notificationService.showError(NotificationSeverity.Error, 'ID de producto no válido.');
      return;
    }
    this.confirmationService.confirm({
      message: `¿Estás seguro de que quieres eliminar el producto "${product.name}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'No',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.productStore.remove(product.id);
      }
    });
  }

  onSavedForm() {
    this.displayProductModal.set(false);
    this.productToEdit.set(null);
  }

  onCancelForm() {
    this.displayProductModal.set(false);
    this.productToEdit.set(null);
  }
}
