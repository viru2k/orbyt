import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  OnChanges,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
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
import {
  OrbButtonComponent,
  OrbTextInputComponent,
  OrbFormFieldComponent,
  OrbInputNumberComponent,
  OrbEntityAvatarComponent,
  OrbSelectComponent,
  OrbCardComponent,
} from '@orb-components';

// Services and Models
import { ProductsService } from '../../../api/services/products.service';
import { ProductResponseDto } from '../../../api/models/product-response-dto';
import { ServiceItemsService } from '../../../api/services/service-items.service';
import { ItemSelectorResponseDto } from '../../../api/models/item-selector-response-dto';
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
    OrbInputNumberComponent,
    OrbEntityAvatarComponent,
    OrbSelectComponent,
    OrbCardComponent
  ],
  templateUrl: './item-selector-modal.component.html',
  styleUrls: ['./item-selector-modal.component.scss'],
})
export class ItemSelectorModalComponent implements OnInit, OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() itemSelected = new EventEmitter<InvoiceItemSelection>();
  @Output() cancel = new EventEmitter<void>();

  private productsService = inject(ProductsService);
  private serviceItemsService = inject(ServiceItemsService);
  private businessTypesService = inject(BusinessTypesService);
  private messageService = inject(MessageService);

  // State signals
  loading = signal(false);
  products = signal<ProductResponseDto[]>([]);
  filteredProducts = signal<ProductResponseDto[]>([]);
  services = signal<(ItemSelectorResponseDto | ConsultationTypeResponseDto)[]>([]);
  filteredServices = signal<(ItemSelectorResponseDto | ConsultationTypeResponseDto)[]>([]);

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
    category: '',
  };

  statusOptions = [
    { label: 'Todos', value: null },
    { label: 'Activo', value: 'activo' },
    { label: 'Inactivo', value: 'inactivo' },
  ];

  ngOnInit(): void {
    // Don't load data here, wait for visibility change
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && changes['visible'].currentValue) {
      this.loadProducts();
      // Don't load services immediately, wait for tab selection
    }
  }

  onTabChange(event: any): void {
    const selectedIndex = event.index;

    // Load services only when services tab is selected (index 1)
    if (selectedIndex === 1 && this.services().length === 0) {
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
          detail: 'Error al cargar la lista de productos',
        });
        this.loading.set(false);
      },
    });
  }

  private loadServices(): void {
    // Intentar cargar servicios reales primero
    this.serviceItemsService.serviceItemsControllerGetItems({ type: 'service' }).subscribe({
      next: (response) => {
        this.services.set(response || []);
        this.filterServices();
      },
      error: (error) => {
        console.error('Real services failed, falling back to consultation types:', error);
        // Fallback a consultation types
        this.loadConsultationTypesAsServices();
      },
    });
  }

  private loadConsultationTypesAsServices(): void {
    this.businessTypesService.businessTypeControllerFindAllBusinessTypes().subscribe({
      next: (businessTypes) => {
        if (businessTypes.length > 0) {
          const firstBusinessType = businessTypes[0];
          this.businessTypesService
            .businessTypeControllerFindConsultationTypesByBusinessType({
              businessTypeId: firstBusinessType.id,
            })
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
                  detail: 'Error al cargar la lista de servicios',
                });
              },
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
          detail: 'Error al cargar la lista de servicios',
        });
      },
    });
  }

  filterProducts(): void {
    let filtered = this.products();

    // Filter by search
    if (this.productSearch) {
      const search = this.productSearch.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(search) ||
          (product.description && product.description.toLowerCase().includes(search)),
      );
    }

    // Filter by status
    if (this.selectedProductStatus) {
      filtered = filtered.filter((product) => product.status === this.selectedProductStatus);
    }

    this.filteredProducts.set(filtered);
  }

  filterServices(): void {
    let filtered = this.services();

    // Filter by search
    if (this.serviceSearch) {
      const search = this.serviceSearch.toLowerCase();
      filtered = filtered.filter(
        (service) =>
          service.name.toLowerCase().includes(search) ||
          (service.description && service.description.toLowerCase().includes(search)),
      );
    }

    // Filter by status
    if (this.selectedServiceStatus) {
      filtered = filtered.filter((service) => {
        // Handle both ItemSelectorResponseDto (status property) and ConsultationTypeResponseDto (isActive property)
        const serviceStatus =
          'status' in service ? service.status : service.isActive ? 'ACTIVE' : 'INACTIVE';
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
      basePrice:
        typeof product.currentPrice === 'string'
          ? parseFloat(product.currentPrice)
          : product.currentPrice,
      category: 'Producto',
    };

    this.itemSelected.emit(selection);
    this.closeModal();
  }

  selectService(service: ItemSelectorResponseDto | ConsultationTypeResponseDto): void {
    // Handle both ItemSelectorResponseDto and ConsultationTypeResponseDto
    const basePrice = 'price' in service ? service.price : service.defaultPrice || 0;
    const duration =
      'duration' in service
        ? service.duration
        : 'defaultDuration' in service
        ? service.defaultDuration
        : undefined;

    const selection: InvoiceItemSelection = {
      itemId: service.id,
      itemType: 'service',
      name: service.name,
      description: service.description || service.name,
      basePrice: basePrice,
      category: 'Servicio',
      duration: duration,
    };

    this.itemSelected.emit(selection);
    this.closeModal();
  }

  selectManualItem(): void {
    if (!this.manualItem.name || !this.manualItem.basePrice) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campos requeridos',
        detail: 'Por favor, completa la descripción y el precio del item',
      });
      return;
    }

    const selection: InvoiceItemSelection = {
      ...this.manualItem,
      description: this.manualItem.description || this.manualItem.name,
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
      category: '',
    };
  }

  isStatusActive(status: string): boolean {
    return status === 'ACTIVE' || status === 'activo' || status?.toLowerCase() === 'active';
  }

  getStatusLabel(status: string): string {
    return this.isStatusActive(status) ? 'Activo' : 'Inactivo';
  }

  getStatusSeverity(status: string): 'success' | 'danger' {
    return this.isStatusActive(status) ? 'success' : 'danger';
  }

  getStatusClass(status: string): string {
    return this.isStatusActive(status) ? 'status-active' : 'status-inactive';
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
  getServiceStatusLabel(service: ItemSelectorResponseDto | ConsultationTypeResponseDto): string {
    const status = 'status' in service ? service.status : service.isActive ? 'ACTIVE' : 'INACTIVE';
    return this.isStatusActive(status) ? 'Activo' : 'Inactivo';
  }

  getServiceStatusSeverity(
    service: ItemSelectorResponseDto | ConsultationTypeResponseDto,
  ): 'success' | 'danger' {
    const status = 'status' in service ? service.status : service.isActive ? 'ACTIVE' : 'INACTIVE';
    return this.isStatusActive(status) ? 'success' : 'danger';
  }

  getServiceStatusClass(service: ItemSelectorResponseDto | ConsultationTypeResponseDto): string {
    const status = 'status' in service ? service.status : service.isActive ? 'ACTIVE' : 'INACTIVE';
    return this.isStatusActive(status) ? 'status-active' : 'status-inactive';
  }
}
