import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
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

// Orb Components
import { OrbButtonComponent, OrbTextInputComponent, OrbFormFieldComponent } from '@orb-components';

// Services and Models
import { ProductsService } from '../../../api/services/products.service';
import { ProductResponseDto } from '../../../api/models/product-response-dto';
import { ServicesService } from '../../../api/services/services.service';
import { ServiceResponseDto } from '../../../api/models/service-response-dto';
import { BusinessTypesService } from '../../../api/services/business-types.service';
import { ConsultationTypeResponseDto } from '../../../api/models/consultation-type-response-dto';
import { MessageService } from 'primeng/api';

export interface InvoiceItemSelection {
  itemId: number | null;
  itemType: 'service' | 'product' | 'manual';
  name: string;
  description: string;
  basePrice: number;
  category?: string;
  duration?: number; // Para servicios
}

@Component({
  selector: 'app-item-selector-modal',
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
    OrbButtonComponent,
    OrbTextInputComponent,
    OrbFormFieldComponent,
  ],
  template: `
    <p-dialog
      [(visible)]="visible"
      [modal]="true"
      [closable]="true"
      [draggable]="false"
      [resizable]="false"
      header="Seleccionar Item para Factura"
      styleClass="item-selector-modal"
      [style]="{ width: '90vw', maxWidth: '1200px', height: '80vh' }"
      (onHide)="onHide()">
      
      <div class="modal-content">
        <!-- Tabs para diferentes tipos de items -->
        <p-tabView>
          <!-- Tab de Productos -->
          <p-tabPanel header="Productos" leftIcon="pi pi-box">
            <div class="tab-content">
              <!-- Filtros y búsqueda -->
              <div class="filters-section">
                <div class="search-container">
                  <span class="p-input-icon-left">
                    <i class="pi pi-search"></i>
                    <input 
                      type="text" 
                      pInputText 
                      [(ngModel)]="productSearch" 
                      (input)="filterProducts()"
                      placeholder="Buscar productos..."
                      class="search-input">
                  </span>
                </div>
                
                <div class="filter-controls">
                  <p-dropdown
                    [(ngModel)]="selectedProductStatus"
                    [options]="statusOptions"
                    (onChange)="filterProducts()"
                    placeholder="Estado"
                    [showClear]="true"
                    optionLabel="label"
                    optionValue="value">
                  </p-dropdown>
                </div>
              </div>

              <!-- Tabla de productos -->
              <div class="items-table">
                <p-table 
                  [value]="filteredProducts()" 
                  [paginator]="true" 
                  [rows]="10"
                  [loading]="loading()"
                  [globalFilterFields]="['name', 'description']"
                  responsiveLayout="stack"
                  [scrollable]="true"
                  scrollHeight="400px">
                  
                  <ng-template pTemplate="header">
                    <tr>
                      <th>Producto</th>
                      <th>Precio</th>
                      <th>Estado</th>
                      <th>Acción</th>
                    </tr>
                  </ng-template>
                  
                  <ng-template pTemplate="body" let-product>
                    <tr>
                      <td>
                        <div class="item-info">
                          <div class="item-name">{{ product.name }}</div>
                          <div class="item-description" *ngIf="product.description">
                            {{ product.description }}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div class="item-price">
                          {{ product.currentPrice | currency:'EUR':'symbol':'1.2-2' }}
                        </div>
                      </td>
                      <td>
                        <p-tag 
                          [value]="getStatusLabel(product.status)"
                          [severity]="getStatusSeverity(product.status)">
                        </p-tag>
                      </td>
                      <td>
                        <orb-button
                          label="Seleccionar"
                          icon="pi pi-plus"
                          (clicked)="selectProduct(product)"
                          size="small"
                          variant="primary">
                        </orb-button>
                      </td>
                    </tr>
                  </ng-template>
                  
                  <ng-template pTemplate="emptymessage">
                    <tr>
                      <td colspan="4" class="text-center">
                        <div class="empty-state">
                          <i class="pi pi-search"></i>
                          <p>No se encontraron productos</p>
                        </div>
                      </td>
                    </tr>
                  </ng-template>
                </p-table>
              </div>
            </div>
          </p-tabPanel>

          <!-- Tab de Servicios -->
          <p-tabPanel header="Servicios" leftIcon="pi pi-cog">
            <div class="tab-content">
              <!-- Filtros y búsqueda -->
              <div class="filters-section">
                <div class="search-container">
                  <span class="p-input-icon-left">
                    <i class="pi pi-search"></i>
                    <input 
                      type="text" 
                      pInputText 
                      [(ngModel)]="serviceSearch" 
                      (input)="filterServices()"
                      placeholder="Buscar servicios..."
                      class="search-input">
                  </span>
                </div>
                
                <div class="filter-controls">
                  <p-dropdown
                    [(ngModel)]="selectedServiceStatus"
                    [options]="statusOptions"
                    (onChange)="filterServices()"
                    placeholder="Estado"
                    [showClear]="true"
                    optionLabel="label"
                    optionValue="value">
                  </p-dropdown>
                </div>
              </div>

              <!-- Tabla de servicios -->
              <div class="items-table">
                <p-table 
                  [value]="filteredServices()" 
                  [paginator]="true" 
                  [rows]="10"
                  [loading]="loading()"
                  [globalFilterFields]="['name', 'description']"
                  responsiveLayout="stack"
                  [scrollable]="true"
                  scrollHeight="400px">
                  
                  <ng-template pTemplate="header">
                    <tr>
                      <th>Servicio</th>
                      <th>Precio</th>
                      <th>Duración</th>
                      <th>Estado</th>
                      <th>Acción</th>
                    </tr>
                  </ng-template>
                  
                  <ng-template pTemplate="body" let-service>
                    <tr>
                      <td>
                        <div class="item-info">
                          <div class="item-name">{{ service.name }}</div>
                          <div class="item-description" *ngIf="service.description">
                            {{ service.description }}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div class="item-price">
                          {{ (service.basePrice || service.defaultPrice) | currency:'EUR':'symbol':'1.2-2' }}
                        </div>
                      </td>
                      <td>
                        <div class="service-duration">
                          <span *ngIf="service.duration || service.defaultDuration">{{ service.duration || service.defaultDuration }} min</span>
                          <span *ngIf="!service.duration && !service.defaultDuration" class="text-muted">-</span>
                        </div>
                      </td>
                      <td>
                        <p-tag 
                          [value]="getServiceStatusLabel(service)"
                          [severity]="getServiceStatusSeverity(service)">
                        </p-tag>
                      </td>
                      <td>
                        <orb-button
                          label="Seleccionar"
                          icon="pi pi-plus"
                          (clicked)="selectService(service)"
                          size="small"
                          variant="primary">
                        </orb-button>
                      </td>
                    </tr>
                  </ng-template>
                  
                  <ng-template pTemplate="emptymessage">
                    <tr>
                      <td colspan="5" class="text-center">
                        <div class="empty-state">
                          <i class="pi pi-search"></i>
                          <p>No se encontraron servicios</p>
                        </div>
                      </td>
                    </tr>
                  </ng-template>
                </p-table>
              </div>
            </div>
          </p-tabPanel>

          <!-- Tab de entrada manual -->
          <p-tabPanel header="Manual" leftIcon="pi pi-pencil">
            <div class="tab-content">
              <div class="manual-form">
                <h4>Agregar Item Personalizado</h4>
                <p>Ingresa los detalles del item manualmente</p>
                
                <div class="form-grid">
                  <orb-form-field label="Descripción" [required]="true">
                    <orb-text-input
                      [(ngModel)]="manualItem.name"
                      placeholder="Ej: Consulta personalizada, Tratamiento especial..."
                      >
                    </orb-text-input>
                  </orb-form-field>

                  <orb-form-field label="Precio Unitario" [required]="true">
                    <input 
                      type="number" 
                      class="orb-input"
                      [(ngModel)]="manualItem.basePrice"
                      min="0" 
                      step="0.01" 
                      placeholder="0.00">
                  </orb-form-field>

                  <orb-form-field label="Categoría">
                    <orb-text-input
                      [(ngModel)]="manualItem.category"
                      placeholder="Ej: Consultoría, Tratamiento, Otro..."
                      >
                    </orb-text-input>
                  </orb-form-field>

                  <orb-form-field label="Notas adicionales">
                    <orb-text-input
                      [(ngModel)]="manualItem.description"
                      placeholder="Información adicional del item..."
                      >
                    </orb-text-input>
                  </orb-form-field>
                </div>

                <div class="manual-actions">
                  <orb-button
                    label="Agregar Item"
                    icon="pi pi-plus"
                    (clicked)="selectManualItem()"
                    [disabled]="!manualItem.name || !manualItem.basePrice"
                    variant="primary">
                  </orb-button>
                </div>
              </div>
            </div>
          </p-tabPanel>
        </p-tabView>
      </div>

      <ng-template pTemplate="footer">
        <orb-button
          label="Cancelar"
          icon="pi pi-times"
          (clicked)="onCancel()"
          variant="secondary">
        </orb-button>
      </ng-template>
    </p-dialog>
  `,
  styleUrls: ['./item-selector-modal.component.scss']
})
export class ItemSelectorModalComponent implements OnInit, OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() itemSelected = new EventEmitter<InvoiceItemSelection>();
  @Output() cancel = new EventEmitter<void>();

  private productsService = inject(ProductsService);
  private servicesService = inject(ServicesService);
  private businessTypesService = inject(BusinessTypesService);
  private messageService = inject(MessageService);

  // State signals
  loading = signal(false);
  products = signal<ProductResponseDto[]>([]);
  filteredProducts = signal<ProductResponseDto[]>([]);
  services = signal<(ServiceResponseDto | ConsultationTypeResponseDto)[]>([]);
  filteredServices = signal<(ServiceResponseDto | ConsultationTypeResponseDto)[]>([]);

  // Search and filters
  productSearch = '';
  selectedProductStatus: string | null = null;
  serviceSearch = '';
  selectedServiceStatus: string | null = null;

  // Manual item form
  manualItem: InvoiceItemSelection = {
    itemId: null,
    itemType: 'manual',
    name: '',
    description: '',
    basePrice: 0,
    category: ''
  };

  statusOptions = [
    { label: 'Activo', value: 'ACTIVE' },
    { label: 'Inactivo', value: 'INACTIVE' }
  ];

  ngOnInit(): void {
    // Don't load data here, wait for visibility change
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && changes['visible'].currentValue) {

      this.loadProducts();
      this.loadServices();
    }
  }

  private loadProducts(): void {
    this.loading.set(true);
    this.productsService.productControllerFindAll().subscribe({
      next: (products) => {
  
        this.products.set(products);
        this.filterProducts();
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al cargar la lista de productos'
        });
        this.loading.set(false);
      }
    });
  }

  private loadServices(): void {
    // Intentar cargar servicios reales primero
    this.servicesService.serviceControllerFindAll({ status: 'ACTIVE' }).subscribe({
      next: (response) => {
  
        this.services.set(response.services || []);
        this.filterServices();
      },
      error: (error) => {
        console.error('Real services failed, falling back to consultation types:', error);
        // Fallback a consultation types
        this.loadConsultationTypesAsServices();
      }
    });
  }

  private loadConsultationTypesAsServices(): void {
    this.businessTypesService.businessTypeControllerFindAllBusinessTypes().subscribe({
      next: (businessTypes) => {
        if (businessTypes.length > 0) {
          const firstBusinessType = businessTypes[0];
          this.businessTypesService
            .businessTypeControllerFindConsultationTypesByBusinessType({ businessTypeId: firstBusinessType.id })
            .subscribe({
              next: (consultationTypes) => {
          
                this.services.set(consultationTypes);
                this.filterServices();
              },
              error: (error) => {
                console.error('Error loading consultation types:', error);
                this.messageService.add({
                  severity: 'error',
                  summary: 'Error',
                  detail: 'Error al cargar la lista de servicios'
                });
              }
            });
        } else {
    
          this.services.set([]);
          this.filterServices();
        }
      },
      error: (error) => {
        console.error('Error loading business types:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al cargar la lista de servicios'
        });
      }
    });
  }

  filterProducts(): void {
    let filtered = this.products();

    // Filter by search
    if (this.productSearch) {
      const search = this.productSearch.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(search) ||
        (product.description && product.description.toLowerCase().includes(search))
      );
    }

    // Filter by status
    if (this.selectedProductStatus) {
      filtered = filtered.filter(product => product.status === this.selectedProductStatus);
    }

    this.filteredProducts.set(filtered);
  }

  filterServices(): void {
    let filtered = this.services();

    // Filter by search
    if (this.serviceSearch) {
      const search = this.serviceSearch.toLowerCase();
      filtered = filtered.filter(service =>
        service.name.toLowerCase().includes(search) ||
        (service.description && service.description.toLowerCase().includes(search))
      );
    }

    // Filter by status
    if (this.selectedServiceStatus) {
      filtered = filtered.filter(service => {
        // Handle both ServiceResponseDto (status property) and ConsultationTypeResponseDto (isActive property)
        const serviceStatus = 'status' in service ? service.status : (service.isActive ? 'ACTIVE' : 'INACTIVE');
        return serviceStatus === this.selectedServiceStatus;
      });
    }

    this.filteredServices.set(filtered);
  }

  selectProduct(product: ProductResponseDto): void {
    const selection: InvoiceItemSelection = {
      itemId: product.id,
      itemType: 'product',
      name: product.name,
      description: product.description || product.name,
      basePrice: typeof product.currentPrice === 'string' 
        ? parseFloat(product.currentPrice) 
        : product.currentPrice,
      category: 'Producto'
    };

    this.itemSelected.emit(selection);
    this.closeModal();
  }

  selectService(service: ServiceResponseDto | ConsultationTypeResponseDto): void {
    // Handle both ServiceResponseDto and ConsultationTypeResponseDto
    const basePrice = 'basePrice' in service ? service.basePrice : (service.defaultPrice || 0);
    const duration = 'duration' in service ? service.duration : ('defaultDuration' in service ? service.defaultDuration : undefined);
    
    const selection: InvoiceItemSelection = {
      itemId: service.id,
      itemType: 'service',
      name: service.name,
      description: service.description || service.name,
      basePrice: basePrice,
      category: 'Servicio',
      duration: duration
    };

    this.itemSelected.emit(selection);
    this.closeModal();
  }

  selectManualItem(): void {
    if (!this.manualItem.name || !this.manualItem.basePrice) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campos requeridos',
        detail: 'Por favor, completa la descripción y el precio del item'
      });
      return;
    }

    const selection: InvoiceItemSelection = {
      ...this.manualItem,
      description: this.manualItem.description || this.manualItem.name
    };

    this.itemSelected.emit(selection);
    this.resetManualForm();
    this.closeModal();
  }

  private resetManualForm(): void {
    this.manualItem = {
      itemId: null,
      itemType: 'manual',
      name: '',
      description: '',
      basePrice: 0,
      category: ''
    };
  }

  getStatusLabel(status: string): string {
    return status === 'ACTIVE' ? 'Activo' : 'Inactivo';
  }

  getStatusSeverity(status: string): 'success' | 'danger' {
    return status === 'ACTIVE' ? 'success' : 'danger';
  }

  onHide(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.resetManualForm();
  }

  onCancel(): void {
    this.cancel.emit();
    this.closeModal();
  }

  private closeModal(): void {
    this.onHide();
  }

  // Methods for service status handling
  getServiceStatusLabel(service: ServiceResponseDto | ConsultationTypeResponseDto): string {
    const status = 'status' in service ? service.status : (service.isActive ? 'ACTIVE' : 'INACTIVE');
    return status === 'ACTIVE' ? 'Activo' : 'Inactivo';
  }

  getServiceStatusSeverity(service: ServiceResponseDto | ConsultationTypeResponseDto): 'success' | 'danger' {
    const status = 'status' in service ? service.status : (service.isActive ? 'ACTIVE' : 'INACTIVE');
    return status === 'ACTIVE' ? 'success' : 'danger';
  }
}