import { Component, EventEmitter, Input, Output, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Components
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { TabViewModule } from 'primeng/tabview';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ChipModule } from 'primeng/chip';
import { AutoCompleteModule } from 'primeng/autocomplete';

// Orb Components
import { OrbButtonComponent, OrbTextInputComponent, OrbFormFieldComponent } from '@orb-components';

// Services and Models
import { AdvancedInventoryService } from '../../../shared/services/advanced-inventory.service';
import { ServiceManagementService } from '../../../shared/services/service-management.service';
import { ServicesService } from '../../../api/services/services.service';
import { ExtendedProductResponseDto } from '../../../api/models/extended-product-response-dto';
import { ServiceResponseDto } from '../../../api/models/service-response-dto';
import { ItemSelectorResponseDto } from '../../../api/models/item-selector-response-dto';

export interface AdvancedInvoiceItemSelection {
  itemId: number | null;
  itemType: 'service' | 'product' | 'manual';
  name: string;
  description: string;
  basePrice: number;
  category?: string;
  duration?: number;

  // Información extendida para productos
  stockLevel?: 'high' | 'medium' | 'low' | 'out';
  availableStock?: number;
  turnoverRate?: number;
  stockValue?: number;

  // Información del propietario
  owner?: {
    id: number;
    fullName: string;
  };
}

@Component({
  selector: 'app-advanced-item-selector-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    TableModule,
    TabViewModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    TagModule,
    TooltipModule,
    BadgeModule,
    ProgressSpinnerModule,
    ChipModule,
    AutoCompleteModule,
    OrbButtonComponent,
    OrbTextInputComponent,
    OrbFormFieldComponent
  ],
  template: `
    <p-dialog
      [(visible)]="visible"
      [modal]="true"
      [closable]="true"
      [draggable]="false"
      [resizable]="true"
      [maximizable]="true"
      header="Seleccionar Item para Factura"
      styleClass="item-selector-modal"
      [style]="{ width: '90vw', height: '80vh' }"
      (onHide)="onCancel()">

      <div class="modal-content">
        <!-- Tabs principales -->
        <p-tabView>
          <!-- Tab de Productos Avanzado -->
          <p-tabPanel header="Productos" leftIcon="pi pi-box">
            <div class="tab-content">
              <!-- Filtros avanzados para productos -->
              <div class="advanced-filters mb-4">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <!-- Búsqueda con autocompletado -->
                  <div class="col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Buscar productos</label>
                    <p-autoComplete
                      [(ngModel)]="productSearch"
                      [suggestions]="productSuggestions()"
                      (completeMethod)="searchProductSuggestions($event)"
                      (onSelect)="onProductSuggestionSelect($event)"
                      field="name"
                      placeholder="Buscar por nombre, descripción..."
                      [minLength]="2"
                      [delay]="300"
                      styleClass="w-full">

                      <ng-template let-product pTemplate="item">
                        <div class="flex items-center">
                          <div>
                            <div class="font-medium">{{ product.name }}</div>
                            <div class="text-sm text-gray-500">{{ product.currentPrice | currency:'EUR':'symbol':'1.2-2' }}</div>
                          </div>
                          <p-badge
                            [value]="product.stockLevel"
                            [severity]="getStockLevelSeverity(product.stockLevel)"
                            class="ml-auto">
                          </p-badge>
                        </div>
                      </ng-template>
                    </p-autoComplete>
                  </div>

                  <!-- Filtro por nivel de stock -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Nivel de Stock</label>
                    <p-dropdown
                      [(ngModel)]="selectedStockLevel"
                      [options]="stockLevelOptions"
                      (onChange)="filterProducts()"
                      placeholder="Todos"
                      [showClear]="true"
                      optionLabel="label"
                      optionValue="value"
                      styleClass="w-full">
                    </p-dropdown>
                  </div>

                  <!-- Filtro por categoría -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                    <p-dropdown
                      [(ngModel)]="selectedCategory"
                      [options]="categoryOptions"
                      (onChange)="filterProducts()"
                      placeholder="Todas"
                      [showClear]="true"
                      optionLabel="label"
                      optionValue="value"
                      styleClass="w-full">
                    </p-dropdown>
                  </div>
                </div>

                <!-- Filtros rápidos -->
                <div class="flex gap-2 mt-3">
                  <p-chip
                    *ngFor="let filter of quickProductFilters"
                    [label]="filter.label"
                    [removable]="true"
                    (onRemove)="removeQuickFilter(filter)"
                    styleClass="bg-blue-100 text-blue-800">
                  </p-chip>
                </div>
              </div>

              <!-- Tabla de productos mejorada -->
              <div class="products-table">
                <p-table
                  [value]="filteredProducts()"
                  [paginator]="true"
                  [rows]="15"
                  [loading]="loadingProducts()"
                  [globalFilterFields]="['name', 'description', 'owner.fullName']"
                  responsiveLayout="stack"
                  [scrollable]="true"
                  scrollHeight="500px"
                  sortMode="multiple">

                  <ng-template pTemplate="header">
                    <tr>
                      <th pSortableColumn="name">
                        Producto <p-sortIcon field="name"></p-sortIcon>
                      </th>
                      <th pSortableColumn="currentPrice">
                        Precio <p-sortIcon field="currentPrice"></p-sortIcon>
                      </th>
                      <th pSortableColumn="availableStock">
                        Stock <p-sortIcon field="availableStock"></p-sortIcon>
                      </th>
                      <th pSortableColumn="stockLevel">
                        Nivel <p-sortIcon field="stockLevel"></p-sortIcon>
                      </th>
                      <th pSortableColumn="turnoverRate">
                        Rotación <p-sortIcon field="turnoverRate"></p-sortIcon>
                      </th>
                      <th>Propietario</th>
                      <th>Acción</th>
                    </tr>
                  </ng-template>

                  <ng-template pTemplate="body" let-product>
                    <tr [class.bg-red-50]="product.stockLevel === 'out'"
                        [class.bg-orange-50]="product.stockLevel === 'low'">
                      <td>
                        <div class="product-info">
                          <div class="font-medium text-gray-900">{{ product.name }}</div>
                          <div class="text-sm text-gray-600" *ngIf="product.description">
                            {{ product.description }}
                          </div>
                          <div class="flex gap-2 mt-1">
                            <p-badge
                              *ngIf="product.daysUntilStockout && product.daysUntilStockout <= 7"
                              value="¡{{ product.daysUntilStockout }}d!"
                              severity="danger">
                            </p-badge>
                            <p-badge
                              *ngIf="product.suggestedReorderQuantity"
                              value="Reponer: {{ product.suggestedReorderQuantity }}"
                              severity="info">
                            </p-badge>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div class="text-lg font-medium">
                          {{ product.currentPrice | currency:'EUR':'symbol':'1.2-2' }}
                        </div>
                        <div class="text-sm text-gray-500" *ngIf="product.stockValue">
                          Valor stock: {{ product.stockValue | currency:'EUR':'symbol':'1.0-0' }}
                        </div>
                      </td>
                      <td>
                        <div class="text-center">
                          <div class="text-lg font-medium">{{ product.availableStock }}</div>
                          <div class="text-sm text-gray-500">unidades</div>
                        </div>
                      </td>
                      <td>
                        <p-tag
                          [value]="getStockLevelLabel(product.stockLevel)"
                          [severity]="getStockLevelSeverity(product.stockLevel)">
                        </p-tag>
                      </td>
                      <td class="text-center">
                        <div *ngIf="product.turnoverRate" class="text-lg font-medium">
                          {{ product.turnoverRate.toFixed(1) }}x
                        </div>
                        <div *ngIf="!product.turnoverRate" class="text-gray-400">-</div>
                      </td>
                      <td>
                        <div *ngIf="product.owner" class="flex items-center">
                          <i class="pi pi-user mr-2 text-gray-400"></i>
                          {{ product.owner.fullName }}
                        </div>
                      </td>
                      <td>
                        <orb-button
                          icon="pi pi-shopping-cart"
                          (clicked)="selectAdvancedProduct(product)"
                          size="small"
                          [disabled]="product.stockLevel === 'out'"
                          [title]="product.stockLevel === 'out' ? 'Sin stock disponible' : 'Seleccionar ' + product.name">
                        </orb-button>
                      </td>
                    </tr>
                  </ng-template>

                  <ng-template pTemplate="emptymessage">
                    <tr>
                      <td colspan="7" class="text-center py-8">
                        <div class="empty-state">
                          <i class="pi pi-search text-4xl text-gray-400 mb-4"></i>
                          <p class="text-gray-600">No se encontraron productos</p>
                          <p class="text-sm text-gray-500 mt-2">Intenta ajustar los filtros de búsqueda</p>
                        </div>
                      </td>
                    </tr>
                  </ng-template>
                </p-table>
              </div>
            </div>
          </p-tabPanel>

          <!-- Tab de Servicios Mejorado -->
          <p-tabPanel header="Servicios" leftIcon="pi pi-cog">
            <div class="tab-content">
              <!-- Búsqueda de servicios -->
              <div class="service-filters mb-4">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div class="col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Buscar servicios</label>
                    <span class="p-input-icon-left w-full">
                      <i class="pi pi-search"></i>
                      <input
                        type="text"
                        pInputText
                        [(ngModel)]="serviceSearch"
                        (input)="filterServices()"
                        placeholder="Buscar por nombre, descripción..."
                        class="w-full">
                    </span>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    <p-dropdown
                      [(ngModel)]="selectedServiceStatus"
                      [options]="serviceStatusOptions"
                      (onChange)="filterServices()"
                      placeholder="Todos"
                      [showClear]="true"
                      optionLabel="label"
                      optionValue="value"
                      styleClass="w-full">
                    </p-dropdown>
                  </div>
                </div>
              </div>

              <!-- Tabla de servicios mejorada -->
              <div class="services-table">
                <p-table
                  [value]="filteredServices()"
                  [paginator]="true"
                  [rows]="15"
                  [loading]="loadingServices()"
                  [globalFilterFields]="['name', 'description', 'category']"
                  responsiveLayout="stack"
                  [scrollable]="true"
                  scrollHeight="500px"
                  sortMode="multiple">

                  <ng-template pTemplate="header">
                    <tr>
                      <th pSortableColumn="name">
                        Servicio <p-sortIcon field="name"></p-sortIcon>
                      </th>
                      <th pSortableColumn="basePrice">
                        Precio Base <p-sortIcon field="basePrice"></p-sortIcon>
                      </th>
                      <th pSortableColumn="duration">
                        Duración <p-sortIcon field="duration"></p-sortIcon>
                      </th>
                      <th pSortableColumn="category">
                        Categoría <p-sortIcon field="category"></p-sortIcon>
                      </th>
                      <th pSortableColumn="status">
                        Estado <p-sortIcon field="status"></p-sortIcon>
                      </th>
                      <th>Acción</th>
                    </tr>
                  </ng-template>

                  <ng-template pTemplate="body" let-service>
                    <tr [class.bg-gray-50]="service.status === 'INACTIVE'">
                      <td>
                        <div class="service-info">
                          <div class="font-medium text-gray-900">{{ service.name }}</div>
                          <div class="text-sm text-gray-600" *ngIf="service.description">
                            {{ service.description }}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div class="text-lg font-medium">
                          {{ service.basePrice | currency:'EUR':'symbol':'1.2-2' }}
                        </div>
                      </td>
                      <td class="text-center">
                        <div *ngIf="service.duration">{{ service.duration }} min</div>
                        <div *ngIf="!service.duration" class="text-gray-400">-</div>
                      </td>
                      <td>
                        <p-chip
                          [label]="service.category || 'General'"
                          styleClass="bg-blue-100 text-blue-800">
                        </p-chip>
                      </td>
                      <td>
                        <p-tag
                          [value]="service.status === 'ACTIVE' ? 'Activo' : 'Inactivo'"
                          [severity]="service.status === 'ACTIVE' ? 'success' : 'warning'">
                        </p-tag>
                      </td>
                      <td>
                        <orb-button
                          icon="pi pi-shopping-cart"
                          (clicked)="selectAdvancedService(service)"
                          size="small"
                          [disabled]="service.status === 'INACTIVE'"
                          [title]="service.status === 'INACTIVE' ? 'Servicio inactivo' : 'Seleccionar ' + service.name">
                        </orb-button>
                      </td>
                    </tr>
                  </ng-template>

                  <ng-template pTemplate="emptymessage">
                    <tr>
                      <td colspan="6" class="text-center py-8">
                        <div class="empty-state">
                          <i class="pi pi-search text-4xl text-gray-400 mb-4"></i>
                          <p class="text-gray-600">No se encontraron servicios</p>
                        </div>
                      </td>
                    </tr>
                  </ng-template>
                </p-table>
              </div>
            </div>
          </p-tabPanel>

          <!-- Tab Manual -->
          <p-tabPanel header="Entrada Manual" leftIcon="pi pi-pencil">
            <div class="tab-content">
              <div class="manual-entry-form">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <orb-form-field label="Nombre del item" [required]="true">
                    <orb-text-input
                      [(value)]="manualItem.name"
                      placeholder="Nombre del producto o servicio">
                    </orb-text-input>
                  </orb-form-field>

                  <orb-form-field label="Precio" [required]="true">
                    <orb-text-input
                      [(value)]="manualItem.basePrice"
                      type="number"
                      placeholder="0.00">
                    </orb-text-input>
                  </orb-form-field>

                  <orb-form-field label="Descripción" [colSpan]="2">
                    <orb-text-input
                      [(value)]="manualItem.description"
                      placeholder="Descripción opcional">
                    </orb-text-input>
                  </orb-form-field>
                </div>

                <div class="flex justify-end mt-4">
                  <orb-button
                    label="Agregar Item Manual"
                    icon="pi pi-plus"
                    (clicked)="selectManualItem()"
                    [disabled]="!manualItem.name || !manualItem.basePrice">
                  </orb-button>
                </div>
              </div>
            </div>
          </p-tabPanel>
        </p-tabView>
      </div>

      <!-- Footer con acciones -->
      <ng-template pTemplate="footer">
        <div class="flex justify-between items-center">
          <div class="text-sm text-gray-600" *ngIf="selectedItem">
            Seleccionado: <strong>{{ selectedItem.name }}</strong>
          </div>
          <div class="flex gap-2">
            <orb-button
              label="Cancelar"
              severity="secondary"
              (clicked)="onCancel()">
            </orb-button>
            <orb-button
              label="Confirmar Selección"
              [disabled]="!selectedItem"
              (clicked)="onConfirm()">
            </orb-button>
          </div>
        </div>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .item-selector-modal {
      .modal-content {
        height: 100%;
        display: flex;
        flex-direction: column;
      }

      .tab-content {
        min-height: 500px;
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem;
      }

      .product-info, .service-info {
        min-width: 200px;
      }

      .bg-red-50 {
        background-color: #fef2f2;
      }

      .bg-orange-50 {
        background-color: #fff7ed;
      }

      .bg-gray-50 {
        background-color: #f9fafb;
      }
    }
  `]
})
export class AdvancedItemSelectorModalComponent implements OnInit {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() itemSelected = new EventEmitter<AdvancedInvoiceItemSelection>();

  // Services
  private advancedInventoryService = inject(AdvancedInventoryService);
  private serviceManagementService = inject(ServiceManagementService);
  private servicesService = inject(ServicesService);

  // State signals
  products = signal<ExtendedProductResponseDto[]>([]);
  services = signal<ServiceResponseDto[]>([]);
  productSuggestions = signal<ExtendedProductResponseDto[]>([]);
  loadingProducts = signal(false);
  loadingServices = signal(false);
  selectedItem = signal<AdvancedInvoiceItemSelection | null>(null);

  // Search and filter state
  productSearch = '';
  serviceSearch = '';
  selectedStockLevel = '';
  selectedCategory = '';
  selectedServiceStatus = '';

  // Manual entry
  manualItem = {
    name: '',
    description: '',
    basePrice: 0
  };

  // Filter options
  stockLevelOptions = [
    { label: 'Stock Alto', value: 'high' },
    { label: 'Stock Medio', value: 'medium' },
    { label: 'Stock Bajo', value: 'low' },
    { label: 'Sin Stock', value: 'out' }
  ];

  serviceStatusOptions = [
    { label: 'Activos', value: 'ACTIVE' },
    { label: 'Inactivos', value: 'INACTIVE' }
  ];

  categoryOptions = signal<{ label: string; value: string }[]>([]);
  quickProductFilters = signal<any[]>([]);

  // Computed properties
  filteredProducts = computed(() => {
    let filtered = this.products();

    if (this.productSearch.trim()) {
      const search = this.productSearch.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(search) ||
        (p.description && p.description.toLowerCase().includes(search)) ||
        (p.owner?.fullName && p.owner.fullName.toLowerCase().includes(search))
      );
    }

    if (this.selectedStockLevel) {
      filtered = filtered.filter(p => p.stockLevel === this.selectedStockLevel);
    }

    return filtered.sort((a, b) => {
      // Priorizar productos con stock disponible
      if (a.stockLevel === 'out' && b.stockLevel !== 'out') return 1;
      if (a.stockLevel !== 'out' && b.stockLevel === 'out') return -1;
      return 0;
    });
  });

  filteredServices = computed(() => {
    let filtered = this.services();

    if (this.serviceSearch.trim()) {
      const search = this.serviceSearch.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(search) ||
        (s.description && s.description.toLowerCase().includes(search)) ||
        (s.category && s.category.toLowerCase().includes(search))
      );
    }

    if (this.selectedServiceStatus) {
      filtered = filtered.filter(s => s.status === this.selectedServiceStatus);
    }

    return filtered.sort((a, b) => {
      // Priorizar servicios activos
      if (a.status === 'ACTIVE' && b.status === 'INACTIVE') return -1;
      if (a.status === 'INACTIVE' && b.status === 'ACTIVE') return 1;
      return 0;
    });
  });

  ngOnInit() {
    this.loadInitialData();
  }

  private loadInitialData() {
    this.loadProducts();
    this.loadServices();
  }

  private loadProducts() {
    this.loadingProducts.set(true);
    this.advancedInventoryService.searchProducts({ limit: 100 })
      .subscribe({
        next: (products) => {
          this.products.set(products);
          this.updateCategoryOptions(products);
          this.loadingProducts.set(false);
        },
        error: (error) => {
          console.error('Error loading products:', error);
          this.loadingProducts.set(false);
        }
      });
  }

  private loadServices() {
    this.loadingServices.set(true);
    this.servicesService.serviceControllerFindAll()
      .subscribe({
        next: (response) => {
          this.services.set(response.services || []);
          this.loadingServices.set(false);
        },
        error: (error) => {
          console.error('Error loading services:', error);
          // Fallback to service items
          this.serviceManagementService.getServices()
            .subscribe({
              next: (services) => {
                const convertedServices: ServiceResponseDto[] = services.map(s => ({
                  id: s.id,
                  name: s.name,
                  description: s.description || '',
                  basePrice: s.price,
                  category: s.category || 'General',
                  status: 'ACTIVE' as 'ACTIVE',
                  ownerId: 0,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                }));
                this.services.set(convertedServices);
                this.loadingServices.set(false);
              }
            });
        }
      });
  }

  private updateCategoryOptions(products: ExtendedProductResponseDto[]) {
    const categories = [...new Set(products.map(p => p.owner?.fullName).filter(Boolean))];
    this.categoryOptions.set(
      categories.map(cat => ({ label: cat!, value: cat! }))
    );
  }

  searchProductSuggestions(event: any) {
    const query = event.query;
    this.advancedInventoryService.searchProducts({ query, limit: 10 })
      .subscribe({
        next: (products) => {
          this.productSuggestions.set(products);
        }
      });
  }

  onProductSuggestionSelect(event: any) {
    this.selectAdvancedProduct(event);
  }

  filterProducts() {
    // Los filtros se aplican automáticamente por los computed properties
  }

  filterServices() {
    // Los filtros se aplican automáticamente por los computed properties
  }

  removeQuickFilter(filter: any) {
    // Implementar lógica para remover filtros rápidos
  }

  selectAdvancedProduct(product: ExtendedProductResponseDto) {
    const selection: AdvancedInvoiceItemSelection = {
      itemId: product.id,
      itemType: 'product',
      name: product.name,
      description: product.description || '',
      basePrice: product.currentPrice,
      stockLevel: product.stockLevel,
      availableStock: product.availableStock,
      turnoverRate: product.turnoverRate,
      stockValue: product.stockValue,
      owner: product.owner
    };

    this.selectedItem.set(selection);
  }

  selectAdvancedService(service: ServiceResponseDto) {
    const selection: AdvancedInvoiceItemSelection = {
      itemId: service.id,
      itemType: 'service',
      name: service.name,
      description: service.description || '',
      basePrice: service.basePrice,
      category: service.category,
      duration: service.duration
    };

    this.selectedItem.set(selection);
  }

  selectManualItem() {
    const selection: AdvancedInvoiceItemSelection = {
      itemId: null,
      itemType: 'manual',
      name: this.manualItem.name,
      description: this.manualItem.description,
      basePrice: this.manualItem.basePrice
    };

    this.selectedItem.set(selection);
    this.onConfirm();
  }

  onConfirm() {
    const selected = this.selectedItem();
    if (selected) {
      this.itemSelected.emit(selected);
      this.onHide();
    }
  }

  onCancel() {
    this.onHide();
  }

  private onHide() {
    this.visible = false;
    this.visibleChange.emit(false);
    this.selectedItem.set(null);
    this.resetForm();
  }

  private resetForm() {
    this.productSearch = '';
    this.serviceSearch = '';
    this.selectedStockLevel = '';
    this.selectedCategory = '';
    this.selectedServiceStatus = '';
    this.manualItem = { name: '', description: '', basePrice: 0 };
  }

  // Utility methods
  getStockLevelSeverity(level: string): 'success' | 'warning' | 'danger' | 'info' {
    switch (level) {
      case 'high': return 'success';
      case 'medium': return 'info';
      case 'low': return 'warning';
      case 'out': return 'danger';
      default: return 'info';
    }
  }

  getStockLevelLabel(level: string): string {
    switch (level) {
      case 'high': return 'Alto';
      case 'medium': return 'Medio';
      case 'low': return 'Bajo';
      case 'out': return 'Agotado';
      default: return 'N/A';
    }
  }
}