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
import { OrbButtonComponent, OrbFormFieldComponent, OrbTextInputComponent, OrbCurrencyInputComponent, OrbTextAreaComponent, OrbSelectComponent } from '@orb-components';

// Models and Services
import { ItemSelectorResponseDto } from '../../../api/models/item-selector-response-dto';
import { ServiceItemsService } from '../../../api/services/service-items.service';
import { ServicesService } from '../../../api/services/services.service';
import { CreateServiceDto } from '../../../api/models/create-service-dto';
import { ServiceResponseDto } from '../../../api/models/service-response-dto';

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
  duration?: number; // Duración en minutos
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
    OrbCurrencyInputComponent,
    OrbTextAreaComponent,
    OrbSelectComponent
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
  private servicesService = inject(ServicesService);

  // Signals para estado reactivo
  private searchSubject = new Subject<string>();
  isLoading = signal(false);
  isCreatingService = signal(false);
  searchResults = signal<ServiceSearchResult[]>([]);
  recentServices = signal<RecentService[]>([]);
  activeTab = signal(0); // 0: Buscar, 1: Crear Nuevo
  viewMode = signal<'grid' | 'list'>('list');
  canCreateServiceSignal = signal(false);
  
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
  canCreateService = computed(() => this.canCreateServiceSignal());

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

    // Escuchar cambios en el formulario de nuevo servicio
    this.newServiceForm.valueChanges.subscribe(() => {
      this.updateCanCreateService();
    });

    // Inicializar estado del botón
    this.updateCanCreateService();
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

  private updateCanCreateService(): void {
    if (!this.newServiceForm) {
      this.canCreateServiceSignal.set(false);
      return;
    }

    const nameControl = this.newServiceForm.get('name');
    const nameValue = nameControl?.value;
    const isNameValid = nameValue && nameValue.trim().length >= 2;

    console.log('📝 SERVICE FORM - Validating:', {
      nameValue,
      isNameValid,
      formValid: this.newServiceForm.valid,
      formStatus: this.newServiceForm.status,
      formErrors: this.newServiceForm.errors,
      nameErrors: nameControl?.errors
    });

    this.canCreateServiceSignal.set(isNameValid);
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
    console.log('🚀 CREATE SERVICE - Attempting to create service');
    console.log('📋 Form Status:', {
      valid: this.newServiceForm.valid,
      canCreate: this.canCreateService(),
      formValue: this.newServiceForm.value,
      formErrors: this.newServiceForm.errors
    });

    if (!this.newServiceForm.valid) {
      console.warn('❌ CREATE SERVICE - Form is invalid');
      // Marcar todos los campos como touched para mostrar errores
      this.newServiceForm.markAllAsTouched();
      return;
    }

    const formValue = this.newServiceForm.value;
    const createServiceDto: CreateServiceDto = {
      name: formValue.name?.trim(),
      basePrice: formValue.basePrice || 0,
      description: formValue.description?.trim() || '',
      duration: formValue.duration || 30,
      category: formValue.category || 'otro',
      status: 'ACTIVE'
    };

    console.log('📤 CREATE SERVICE - Sending to backend:', createServiceDto);
    this.isCreatingService.set(true);

    this.servicesService.serviceControllerCreate({ body: createServiceDto }).subscribe({
      next: (createdService: ServiceResponseDto) => {
        console.log('✅ CREATE SERVICE - Service created successfully:', createdService);

        // Convertir ServiceResponseDto a ItemSelectorResponseDto para compatibilidad
        const serviceForSelection: ItemSelectorResponseDto = {
          id: createdService.id!,
          name: createdService.name!,
          price: createdService.basePrice!,
          type: 'service',
          status: createdService.status!,
          description: createdService.description || ''
        };

        this.serviceSelected.emit(serviceForSelection);
        this.isCreatingService.set(false);
        this.close();
      },
      error: (error) => {
        console.error('❌ CREATE SERVICE - Error creating service:', error);
        this.isCreatingService.set(false);

        // TODO: Mostrar mensaje de error al usuario
        // Por ahora, mantenemos la funcionalidad anterior como fallback
        const fallbackService: ItemSelectorResponseDto = {
          id: Date.now(),
          name: formValue.name?.trim(),
          price: formValue.basePrice || 0,
          type: 'service',
          status: 'ACTIVE',
          description: formValue.description?.trim() || ''
        };

        console.log('🔄 CREATE SERVICE - Using fallback service:', fallbackService);
        this.serviceSelected.emit(fallbackService);
        this.close();
      }
    });
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