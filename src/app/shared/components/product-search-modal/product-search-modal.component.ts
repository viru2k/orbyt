import { Component, EventEmitter, Input, Output, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, filter, switchMap, map, catchError } from 'rxjs/operators';
import { Subject, of } from 'rxjs';

// PrimeNG Components
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { DataViewModule } from 'primeng/dataview';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { InputNumberModule } from 'primeng/inputnumber';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';

// Orb Components
import { OrbButtonComponent } from '@orb-components';

// Models and Services
import { ProductResponseDto } from '../../../api/models';
import { ProductStore } from '../../../store/stock/product.store';
import { InventoryDashboardService } from '../../../api/services/inventory-dashboard.service';
import { StockService } from '../../../api/services/stock.service';
import { forkJoin } from 'rxjs';

export interface ProductSearchFilters {
  query: string;
  status?: string;
  minStock?: number;
  maxStock?: number;
  hasImage?: boolean;
  priceRange?: { min?: number; max?: number };
}

export interface ProductSearchResult extends ProductResponseDto {
  // Campos calculados para el display
  stockLevel: 'high' | 'medium' | 'low' | 'out';
  stockCount?: number;
  hasAvailableStock?: boolean;
  isRecommended?: boolean;
}

@Component({
  selector: 'orb-product-search-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    InputTextModule,
    DropdownModule,
    ButtonModule,
    DataViewModule,
    TagModule,
    BadgeModule,
    InputNumberModule,
    SkeletonModule,
    TooltipModule,
    CardModule,
    CheckboxModule,
    OrbButtonComponent
  ],
  templateUrl: './product-search-modal.component.html',
  styleUrls: ['./product-search-modal.component.scss']
})
export class ProductSearchModalComponent {
  @Input() visible = false;
  @Input() title = 'Buscar Producto';
  @Input() showStockFilter = true;
  @Input() showPriceFilter = true;
  @Input() allowMultiSelect = false;
  @Input() preSelectedProduct?: ProductResponseDto;
  
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() productSelected = new EventEmitter<ProductResponseDto>();
  @Output() productsSelected = new EventEmitter<ProductResponseDto[]>();
  @Output() cancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private productStore = inject(ProductStore);
  private inventoryDashboardService = inject(InventoryDashboardService);
  private stockService = inject(StockService);

  // Signals para estado reactivo
  private searchSubject = new Subject<string>();
  isLoading = signal(false);
  searchResults = signal<ProductSearchResult[]>([]);
  selectedProducts = signal<ProductResponseDto[]>([]);
  viewMode = signal<'grid' | 'list'>('grid');
  
  // Formulario de filtros
  filtersForm!: FormGroup;

  // Opciones para filtros
  statusOptions = [
    { label: 'Todos los estados', value: null },
    { label: 'Activo', value: 'activo' },
    { label: 'Inactivo', value: 'inactivo' },
    { label: 'Agotado', value: 'agotado' },
    { label: 'Descatalogado', value: 'descatalogado' }
  ];

  // Computed properties
  hasResults = computed(() => this.searchResults().length > 0);
  hasFilters = computed(() => {
    const form = this.filtersForm?.value;
    return form?.status || 
           form?.minStock || 
           form?.maxStock || 
           form?.hasImage ||
           form?.priceMin ||
           form?.priceMax;
  });

  ngOnInit() {
    this.initializeForm();
    this.setupSearch();
    
    // Pre-seleccionar producto si se proporciona
    if (this.preSelectedProduct) {
      this.selectedProducts.set([this.preSelectedProduct]);
    }
  }

  private initializeForm(): void {
    this.filtersForm = this.fb.group({
      query: [''],
      status: [null],
      minStock: [null],
      maxStock: [null],
      hasImage: [null],
      priceMin: [null],
      priceMax: [null]
    });

    // Solo actualizar el query field para búsqueda por texto
    this.filtersForm.get('query')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe((query) => {
      this.filtersForm.patchValue({ query }, { emitEvent: false });
    });
  }

  private setupSearch(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter(query => query.length >= 2 || query.length === 0),
      switchMap(query => this.searchProducts(query))
    ).subscribe(results => {
      this.searchResults.set(results);
      this.isLoading.set(false);
    });
  }

  private searchProducts(query: string) {
    const filters = this.buildFilters(query);
        
    
    // Cargar productos y obtener información de stock
    this.productStore.load();
    
    return this.productStore.products$.pipe(
      switchMap(products => {        
        
        // Filtrar productos por query
        let filtered = products.filter(p => 
          !query || 
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          (p.description && p.description.toLowerCase().includes(query.toLowerCase()))
        );
        
        // Aplicar filtros adicionales
        if (filters.status && filters.status !== 'all') {
          filtered = filtered.filter(p => p.status === filters.status);
        }
                
        
        // Obtener información de stock para los productos filtrados
        return this.getProductsWithStock(filtered);
      })
    );
  }

  private getProductsWithStock(products: ProductResponseDto[]) {
    if (products.length === 0) {
      return of([]);
    }

    // Estrategia: obtener stock individualmente para cada producto
    // Para optimizar, solo obtenemos stock para los primeros 20 productos de la búsqueda
    const limitedProducts = products.slice(0, 20);
    
    const stockRequests = limitedProducts.map(product => 
      this.stockService.stockControllerGetSummary({ productId: product.id }).pipe(
        map(stockSummary => ({
          ...product,
          stockCount: stockSummary.availableStock,
          stockLevel: this.calculateStockLevelFromCount(stockSummary.availableStock),
          hasAvailableStock: stockSummary.availableStock > 0,
          isRecommended: this.isRecommended(product)
        } as ProductSearchResult)),
        // En caso de error, retornar el producto sin stock
        catchError(() => of({
          ...product,
          stockCount: 0,
          stockLevel: 'out' as const,
          hasAvailableStock: false,
          isRecommended: this.isRecommended(product)
        } as ProductSearchResult))
      )
    );

    return forkJoin(stockRequests);
  }

  private calculateStockLevelFromCount(stock: number): 'high' | 'medium' | 'low' | 'out' {
    if (stock === 0) return 'out';
    if (stock < 10) return 'low';
    if (stock < 50) return 'medium';
    return 'high';
  }


  private isRecommended(product: ProductResponseDto): boolean {
    // Lógica para determinar si un producto es recomendado
    // Puede basarse en ventas, rating, etc.
    return false;
  }

  private buildFilters(query: string): ProductSearchFilters {
    const formValue = this.filtersForm.value;
    return {
      query,
      status: formValue.status,
      minStock: formValue.minStock,
      maxStock: formValue.maxStock,
      hasImage: formValue.hasImage,
      priceRange: {
        min: formValue.priceMin,
        max: formValue.priceMax
      }
    };
  }


  // Event handlers
  onSearch(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.isLoading.set(true);
    this.searchSubject.next(query);
  }

  onProductSelect(product: ProductResponseDto): void {
    if (this.allowMultiSelect) {
      const selected = this.selectedProducts();
      const index = selected.findIndex(p => p.id === product.id);
      
      if (index >= 0) {
        // Deseleccionar
        selected.splice(index, 1);
        this.selectedProducts.set([...selected]);
      } else {
        // Seleccionar
        this.selectedProducts.set([...selected, product]);
      }
    } else {
      // Selección única - limpiar búsqueda y cerrar modal
      this.clearSearch();
      this.selectedProducts.set([product]);
      this.productSelected.emit(product);
      this.close();
    }
  }

  onConfirmSelection(): void {
    if (this.allowMultiSelect) {
      this.productsSelected.emit(this.selectedProducts());
    } else if (this.selectedProducts().length > 0) {
      this.productSelected.emit(this.selectedProducts()[0]);
    }
    this.close();
  }

  onClear(): void {
    this.selectedProducts.set([]);
    this.filtersForm.patchValue({
      query: '',
      status: null,
      minStock: null,
      maxStock: null,
      hasImage: null,
      priceMin: null,
      priceMax: null
    });
    this.searchResults.set([]);
  }

  private clearSearch(): void {
    this.filtersForm.patchValue({
      query: ''
    });
    this.searchResults.set([]);
    this.isLoading.set(false);
  }

  isProductSelected(product: ProductResponseDto): boolean {
    return this.selectedProducts().some(p => p.id === product.id);
  }

  getStockLevelSeverity(level: string): 'success' | 'warning' | 'danger' | 'info' {
    switch (level) {
      case 'high': return 'success';
      case 'medium': return 'info';
      case 'low': return 'warning';
      case 'out': return 'danger';
      default: return 'info';
    }
  }

  getStockLevelText(level: string): string {
    switch (level) {
      case 'high': return 'Stock Alto';
      case 'medium': return 'Stock Medio';
      case 'low': return 'Stock Bajo';
      case 'out': return 'Agotado';
      default: return 'Sin datos';
    }
  }

  toggleViewMode(): void {
    this.viewMode.set(this.viewMode() === 'grid' ? 'list' : 'grid');
  }

  performSearch(): void {
    const query = this.filtersForm.get('query')?.value || '';
    this.isLoading.set(true);
    this.searchSubject.next(query);
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  onCancel(): void {
    this.cancel.emit();
    this.close();
  }

  // Métodos para manejo de imágenes
  getProductImageUrl(product: ProductResponseDto): string {
    // TODO: Add image URL properties when backend supports them
    return 'assets/images/no-product-image.svg';
  }

  hasValidImage(product: ProductResponseDto): boolean {
    // TODO: Check for image properties when backend supports them
    return false;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/no-product-image.svg';
  }

  // Método para cargar productos cuando esté disponible la API
  private loadProductsFromStore(): void {
    // TODO: Implementar cuando ProductStore tenga métodos de búsqueda
    console.info('Product search using real API will be implemented when backend endpoints are ready');
  }
}