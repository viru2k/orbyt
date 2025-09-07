import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, AsyncPipe, DatePipe } from '@angular/common';
import { MovementStore } from '../../shared/stores/movement.store';
import { ProductStore } from '../../../../store/stock/product.store';
import { StockMovementResponseDto, ProductResponseDto } from '../../../../api/models';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { OrbCardComponent, OrbTableComponent, OrbDialogComponent, OrbToolbarComponent, OrbButtonComponent, OrbActionsPopoverComponent, OrbBreadcrumbComponent } from '@orb-components';
import { MovementFormComponent } from '../movement-form/movement-form.component';
import { NotificationService } from '@orb-services';
import { OrbActionItem, OrbTableFeatures, TableColumn, NotificationSeverity } from '@orb-models';
import { ProductSearchModalComponent } from '../../../../shared/components/product-search-modal/product-search-modal.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'orb-movement-list',
  standalone: true,
  imports: [
    CommonModule,
    AsyncPipe,
    FormsModule,
    OrbTableComponent,
    MovementFormComponent,
    OrbButtonComponent,
    OrbCardComponent,
    OrbBreadcrumbComponent,
    OrbToolbarComponent,
    OrbDialogComponent,
    ConfirmDialogModule,
    ProductSearchModalComponent
  ],
  templateUrl: './movement-list.component.html',
  styleUrls: ['./movement-list.component.scss'],
  providers: [ConfirmationService]
})
export class MovementListComponent implements OnInit {
  private movementStore = inject(MovementStore);
  private productStore = inject(ProductStore);
  private notificationService = inject(NotificationService);

  breadcrumbItems = [
    { label: 'Gestión' },
    { label: 'Movimientos' }
  ];

  displayMovementModal = signal(false);
  displayProductModal = signal(false);
  
  // Usamos los nuevos selectores con datos mapeados
  movements$ = this.movementStore.selectMovementsWithMetadata;
  isLoading$ = this.movementStore.loading$;
  products$ = this.productStore.products$;
  selectedProductId$ = this.movementStore.selectedProductId$;

  // Selector de producto para filtrar
  selectedProduct = signal<ProductResponseDto | null>(null);

  // Columnas de la tabla
  tableColumns: TableColumn[] = [
    { field: 'productNameAtTime', header: 'Producto', sortable: true },
    { field: 'typeText', header: 'Tipo', sortable: true },
    { field: 'quantity', header: 'Cantidad', sortable: true },
    { field: 'reason', header: 'Razón', sortable: true },
    { field: 'formattedDate', header: 'Fecha', sortable: true }
  ];

  tableFeaturesConfig: OrbTableFeatures = {
    showGlobalSearch: true,
    globalSearchPlaceholder: 'Buscar movimientos...'
  };

  movementTableHeaderActions: OrbActionItem[] = [
    {
      label: 'Nuevo Movimiento',
      icon: 'pi pi-plus',
      action: () => this.openMovementModal()
    }
  ];

  tableRows = signal(10);
  tableFirst = signal(0);

  ngOnInit() {
    // Cargar productos para el selector
    this.productStore.load();
  }

  showMovementForm() {
    this.openMovementModal();
  }

  openMovementModal() {
    if (!this.selectedProduct()) {
      this.notificationService.showError(NotificationSeverity.Warn, 'Por favor selecciona un producto primero.');
      return;
    }
    this.displayMovementModal.set(true);
  }

  onProductChange(product: ProductResponseDto | null) {
    this.selectedProduct.set(product);
    if (product?.id) {
      // Cargar movimientos del producto seleccionado
      this.movementStore.loadMovements(product.id);
      // También cargar el resumen
      this.movementStore.loadSummary(product.id);
    } else {
      // Limpiar movimientos si no hay producto seleccionado
      this.movementStore.clearMovements();
    }
  }

  onSavedForm() {
    this.displayMovementModal.set(false);
    // Recargar movimientos si hay un producto seleccionado
    if (this.selectedProduct()?.id) {
      this.movementStore.loadMovements(this.selectedProduct()!.id);
    }
  }

  onCancelForm() {
    this.displayMovementModal.set(false);
  }

  openProductModal() {
    this.displayProductModal.set(true);
  }

  onProductSelected(product: ProductResponseDto) {
    this.onProductChange(product);
    this.displayProductModal.set(false);
  }

  onProductModalCancel() {
    this.displayProductModal.set(false);
  }
}