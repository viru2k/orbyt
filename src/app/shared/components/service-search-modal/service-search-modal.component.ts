import { Component, EventEmitter, Input, Output, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, filter, switchMap, map, catchError, startWith } from 'rxjs/operators';
import { Subject, of, combineLatest } from 'rxjs';

// PrimeNG Components
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { DataViewModule } from 'primeng/dataview';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { InputNumberModule } from 'primeng/inputnumber';
import { TabViewModule } from 'primeng/tabview';
import { DividerModule } from 'primeng/divider';

// Orb Components
import { OrbButtonComponent, OrbFormFieldComponent, OrbTextInputComponent, OrbCurrencyInputComponent } from '@orb-components';

// Models and Services
import { ItemSelectorResponseDto } from '../../../api/models/item-selector-response-dto';
import { ServiceItemsService } from '../../../api/services/service-items.service';

export interface ServiceSearchFilters {
  query: string;
  priceRange?: { min?: number; max?: number };
  category?: string;
}

export interface ServiceSearchResult extends ItemSelectorResponseDto {
  // Campos calculados para el display
  isRecentlyUsed?: boolean;
  usageCount?: number;
  isCustom?: boolean;
}

export interface RecentService {
  id: string;
  name: string;
  basePrice?: number;
  price?: number; // Para compatibilidad
  lastUsed: Date;
  usageCount: number;
}

@Component({
  selector: 'orb-service-search-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    DialogModule,
    InputTextModule,
    DropdownModule,
    ButtonModule,
    DataViewModule,
    TagModule,
    BadgeModule,
    SkeletonModule,
    TooltipModule,
    CardModule,
    CheckboxModule,
    InputNumberModule,
    TabViewModule,
    DividerModule,
    OrbButtonComponent,
    OrbFormFieldComponent,
    OrbTextInputComponent,
    OrbCurrencyInputComponent
  ],
  templateUrl: './service-search-modal.component.html',
  styleUrls: ['./service-search-modal.component.scss']
})
export class ServiceSearchModalComponent {
  @Input() visible = false;
  @Input() title = 'Seleccionar Servicio';
  @Input() preSelectedService?: ItemSelectorResponseDto;
  @Input() clientId?: number; // Para obtener servicios utilizados por el cliente
  
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() serviceSelected = new EventEmitter<ItemSelectorResponseDto>();
  @Output() cancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private serviceItemsService = inject(ServiceItemsService);

  // Signals para estado reactivo
  private searchSubject = new Subject<string>();
  isLoading = signal(false);
  searchResults = signal<ServiceSearchResult[]>([]);
  recentServices = signal<RecentService[]>([]);
  activeTab = signal(0); // 0: Buscar, 1: Crear Nuevo
  viewMode = signal<'grid' | 'list'>('list');
  
  // Formularios
  filtersForm!: FormGroup;
  newServiceForm!: FormGroup;

  // Opciones para filtros
  categoryOptions = [
    { label: 'Todas las categorías', value: null },
    { label: 'Consulta General', value: 'consulta' },
    { label: 'Tratamiento', value: 'tratamiento' },
    { label: 'Procedimiento', value: 'procedimiento' },
    { label: 'Seguimiento', value: 'seguimiento' },
    { label: 'Evaluación', value: 'evaluacion' },
    { label: 'Otro', value: 'otro' }
  ];

  // Computed properties
  hasResults = computed(() => this.searchResults().length > 0);
  hasRecentServices = computed(() => this.recentServices().length > 0);
  hasFilters = computed(() => {
    const form = this.filtersForm?.value;
    return form?.category || 
           form?.priceMin || 
           form?.priceMax;
  });
  canCreateService = computed(() => this.newServiceForm?.valid);

  ngOnInit() {
    this.initializeForms();
    this.setupSearch();
    this.loadInitialData();
  }

  private initializeForms(): void {
    // Formulario de filtros/búsqueda
    this.filtersForm = this.fb.group({
      query: [''],
      category: [null],
      priceMin: [null],
      priceMax: [null]
    });

    // Formulario para crear nuevo servicio
    this.newServiceForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      basePrice: [null],
      duration: [30], // Duración en minutos
      category: ['otro']
    });

    // Escuchar cambios en la búsqueda
    this.filtersForm.get('query')?.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.performSearch();
    });

    // Escuchar cambios en filtros
    this.filtersForm.get('category')?.valueChanges.subscribe(() => {
      this.performSearch();
    });
  }

  private setupSearch(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => this.searchServices(query))
    ).subscribe(results => {
      this.searchResults.set(results);
      this.isLoading.set(false);
    });
  }

  private loadInitialData(): void {
    this.isLoading.set(true);
    
    // Cargar servicios recientes simulados (esto debería venir del backend)
    this.loadRecentServices();
    
    // Cargar servicios iniciales
    this.searchServices('').subscribe(results => {
      this.searchResults.set(results);
      this.isLoading.set(false);
    });
  }

  private loadRecentServices(): void {
    // TODO: Implement backend call to get recently used services
    // This should be based on appointment history of the client or professional
    // When implemented, limit to maximum 3 recent services
    const recentServices: RecentService[] = []; // Backend call result should be limited here
    this.recentServices.set(recentServices.slice(0, 3)); // Ensure max 3 items
  }

  private searchServices(query: string) {
    const filters = this.buildFilters(query);
        
    
    return this.serviceItemsService.serviceItemsControllerGetItems({ type: 'service' }).pipe(
      map((services: ItemSelectorResponseDto[]) => {        
        
        // Filtrar servicios por query
        let filtered = services;
        
        if (query && query.trim().length > 0) {
          const searchTerm = query.toLowerCase().trim();
          filtered = services.filter((service: ItemSelectorResponseDto) => 
            this.serviceMatchesSearch(service, searchTerm)
          );
        }
        
        // Aplicar filtros adicionales
        if (filters.category && filters.category !== 'all') {
          // TODO: Implementar filtro por categoría cuando el backend lo soporte
        }
        
        if (filters.priceRange?.min !== undefined && filters.priceRange?.min !== null) {
          filtered = filtered.filter((s: ItemSelectorResponseDto) => s.price && s.price >= filters.priceRange!.min!);
        }
        
        if (filters.priceRange?.max !== undefined && filters.priceRange?.max !== null) {
          filtered = filtered.filter((s: ItemSelectorResponseDto) => s.price && s.price <= filters.priceRange!.max!);
        }
                
        
        // Convertir a ServiceSearchResult y ordenar
        return this.processSearchResults(filtered, query);
      }),
      catchError(error => {
        console.error('🔍 SERVICE SEARCH - Error:', error);
        this.isLoading.set(false);
        return of([]);
      })
    );
  }

  private serviceMatchesSearch(service: ItemSelectorResponseDto, searchTerm: string): boolean {
    const fieldsToSearch = [
      service.name,
      service.description
    ];

    return fieldsToSearch.some(field => 
      field && field.toLowerCase().includes(searchTerm)
    );
  }

  private processSearchResults(services: ItemSelectorResponseDto[], query: string): ServiceSearchResult[] {
    return services.map(service => ({
      ...service,
      isRecentlyUsed: this.isServiceRecentlyUsed(service),
      usageCount: this.getServiceUsageCount(service),
      isCustom: false
    })).sort((a, b) => {
      // Ordenar por relevancia: primero los recientemente usados, luego por nombre
      if (a.isRecentlyUsed && !b.isRecentlyUsed) return -1;
      if (!a.isRecentlyUsed && b.isRecentlyUsed) return 1;
      
      // Si ambos son recientes o ninguno, ordenar por nombre
      return (a.name || '').localeCompare(b.name || '');
    });
  }

  private isServiceRecentlyUsed(service: ItemSelectorResponseDto): boolean {
    return this.recentServices().some(recent => recent.name === service.name);
  }

  private getServiceUsageCount(service: ItemSelectorResponseDto): number {
    const recent = this.recentServices().find(recent => recent.name === service.name);
    return recent?.usageCount || 0;
  }

  private buildFilters(query: string): ServiceSearchFilters {
    const formValue = this.filtersForm.value;
    return {
      query,
      category: formValue.category,
      priceRange: {
        min: formValue.priceMin,
        max: formValue.priceMax
      }
    };
  }

  // Event handlers para búsqueda
  onSearch(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.isLoading.set(true);
    this.searchSubject.next(query);
  }

  onServiceSelect(service: ItemSelectorResponseDto | RecentService): void {
    if ('lastUsed' in service) {
      // Es un servicio reciente, crear un DTO compatible
      const serviceDto: ItemSelectorResponseDto = {
        id: parseInt(service.id),
        name: service.name,
        price: service.basePrice || service.price || 0,
        type: 'service',
        status: 'ACTIVE',
        description: `Servicio utilizado recientemente (${service.usageCount} veces)`
      };
      this.serviceSelected.emit(serviceDto);
    } else {
      // Es un servicio del backend
      this.serviceSelected.emit(service);
    }
    this.close();
  }

  onClear(): void {
    this.filtersForm.patchValue({
      query: '',
      category: null,
      priceMin: null,
      priceMax: null
    });
    this.loadInitialData();
  }

  performSearch(): void {
    const query = this.filtersForm.get('query')?.value || '';
    this.isLoading.set(true);
    this.searchSubject.next(query);
  }

  // Event handlers para crear servicio
  onCreateService(): void {
    if (this.newServiceForm.valid) {
      const formValue = this.newServiceForm.value;
      const newService: ItemSelectorResponseDto = {
        id: 0, // Temporary ID for new service
        name: formValue.name,
        price: formValue.basePrice || 0,
        type: 'service',
        status: 'ACTIVE',
        description: formValue.description || ''
      };

      this.serviceSelected.emit(newService);
      this.close();
    }
  }

  onResetNewService(): void {
    this.newServiceForm.reset({
      duration: 30,
      category: 'otro',
      basePrice: null
    });
  }

  // Event handlers generales
  onTabChange(event: any): void {
    this.activeTab.set(event.index);
    
    if (event.index === 0) {
      // Pestaña de búsqueda - cargar servicios si no hay resultados
      if (!this.hasResults() && !this.isLoading()) {
        this.loadInitialData();
      }
    }
  }

  toggleViewMode(): void {
    this.viewMode.set(this.viewMode() === 'grid' ? 'list' : 'grid');
  }

  close(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  onCancel(): void {
    this.cancel.emit();
    this.close();
  }

  // Métodos utilitarios
  formatPrice(price?: number): string {
    if (!price) return 'Sin precio';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  }

  getServicePrice(service: ItemSelectorResponseDto | RecentService): number | undefined {
    if ('basePrice' in service) {
      return service.basePrice;
    }
    if ('price' in service) {
      return service.price;
    }
    return undefined;
  }

  formatLastUsed(date: Date): string {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Ayer';
    if (diffDays <= 7) return `Hace ${diffDays} días`;
    if (diffDays <= 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    return `Hace ${Math.floor(diffDays / 30)} meses`;
  }

  getCategoryLabel(category?: string): string {
    if (!category) return 'Sin categoría';
    const option = this.categoryOptions.find(opt => opt.value === category);
    return option?.label || category;
  }

  getUsageBadgeSeverity(count: number): 'success' | 'info' | 'warn' {
    if (count >= 10) return 'success';
    if (count >= 5) return 'info';
    return 'warn';
  }
}