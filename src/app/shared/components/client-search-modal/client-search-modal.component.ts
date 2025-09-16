import { Component, EventEmitter, Input, Output, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
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
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { AvatarModule } from 'primeng/avatar';

// Orb Components
import { OrbButtonComponent, OrbDialogComponent, OrbEntityAvatarComponent } from '@orb-components';

// Models and Services
import { ClientResponseDto } from '../../../api/models';
import { ClientsService } from '../../../api/services/clients.service';

export interface ClientSearchFilters {
  query: string;
  status?: string;
  hasEmail?: boolean;
  hasPhone?: boolean;
}

export interface ClientSearchResult extends ClientResponseDto {
  // Campos calculados para el display
  displayName: string;
  searchMatches: string[];
  isRecentlyActive?: boolean;
}

@Component({
  selector: 'orb-client-search-modal',
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
    AvatarModule,
    OrbButtonComponent,
    OrbEntityAvatarComponent,
    OrbDialogComponent
  ],
  templateUrl: './client-search-modal.component.html',
  styleUrls: ['./client-search-modal.component.scss']
})
export class ClientSearchModalComponent implements OnDestroy {
  @Input() visible = false;
  @Input() title = 'Buscar Cliente';
  @Input() professionalId?: number;
  @Input() preSelectedClient?: ClientResponseDto;
  
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() clientSelected = new EventEmitter<ClientResponseDto>();
  @Output() cancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private clientsService = inject(ClientsService);

  // Signals para estado reactivo
  private searchSubject = new Subject<string>();
  private searchTimeout: any;
  isLoading = signal(false);
  searchResults = signal<ClientSearchResult[]>([]);
  viewMode = signal<'grid' | 'list'>('list');
  
  // Formulario de filtros
  filtersForm!: FormGroup;

  // Opciones para filtros
  statusOptions = [
    { label: 'Todos los estados', value: null },
    { label: 'Activo', value: 'active' },
    { label: 'Inactivo', value: 'inactive' }
  ];

  // Computed properties
  hasResults = computed(() => this.searchResults().length > 0);
  hasFilters = computed(() => {
    const form = this.filtersForm?.value;
    return form?.status || 
           form?.hasEmail ||
           form?.hasPhone;
  });

  ngOnInit() {
    this.initializeForm();
    this.setupSearch();
    
    // Cargar clientes iniciales
    this.loadInitialClients();
  }

  private initializeForm(): void {
    this.filtersForm = this.fb.group({
      query: [''],
      status: [null],
      hasEmail: [false],
      hasPhone: [false]
    });
  }

  private setupSearch(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => this.searchClients(query))
    ).subscribe(results => {
      this.searchResults.set(results);
      this.isLoading.set(false);
    });
  }

  private loadInitialClients(): void {
    this.isLoading.set(true);
    this.searchClients('').subscribe({
      next: (results) => {        
        this.searchResults.set(results);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('🔍 Error loading initial clients:', error);
        this.searchResults.set([]);
        this.isLoading.set(false);
      }
    });
  }

  private searchClients(query: string) {
    const filters = this.buildFilters(query);
        
    
    // Preparar parámetros para la búsqueda
    const params: any = {};
    if (this.professionalId) {
      params.userId = this.professionalId;
    }
    
    return this.clientsService.clientControllerFindAll(params).pipe(
      map(clients => {        
        
        // Filtrar clientes por query
        let filtered = clients;
        
        if (query && query.trim().length > 0) {
          const searchTerm = query.toLowerCase().trim();
          filtered = clients.filter(client => 
            this.clientMatchesSearch(client, searchTerm)
          );
        }
        
        // Aplicar filtros adicionales
        if (filters.status && filters.status !== 'all') {
          filtered = filtered.filter(c => c.status === filters.status);
        }
        
        if (filters.hasEmail) {
          filtered = filtered.filter(c => c.email && c.email.trim().length > 0);
        }
        
        if (filters.hasPhone) {
          filtered = filtered.filter(c => c.phone && c.phone.trim().length > 0);
        }
                
        
        // Convertir a ClientSearchResult y ordenar
        return this.processSearchResults(filtered, query);
      }),
      catchError(error => {
        console.error('🔍 CLIENT SEARCH - Error:', error);
        this.isLoading.set(false);
        return of([]);
      })
    );
  }

  private clientMatchesSearch(client: ClientResponseDto, searchTerm: string): boolean {
    const fieldsToSearch = [
      client.name,
      client.lastName,
      client.email,
      client.phone,
      client.fullname
    ];

    return fieldsToSearch.some(field => 
      field && field.toLowerCase().includes(searchTerm)
    );
  }

  private getSearchMatches(client: ClientResponseDto, query: string): string[] {
    if (!query || query.trim().length === 0) return [];
    
    const searchTerm = query.toLowerCase().trim();
    const matches: string[] = [];
    
    if (client.name && client.name.toLowerCase().includes(searchTerm)) {
      matches.push('Nombre');
    }
    if (client.lastName && client.lastName.toLowerCase().includes(searchTerm)) {
      matches.push('Apellido');
    }
    if (client.email && client.email.toLowerCase().includes(searchTerm)) {
      matches.push('Email');
    }
    if (client.phone && client.phone.includes(searchTerm)) {
      matches.push('Teléfono');
    }
    if (client.fullname && client.fullname.toLowerCase().includes(searchTerm)) {
      matches.push('Nombre completo');
    }
    
    return matches;
  }

  private processSearchResults(clients: ClientResponseDto[], query: string): ClientSearchResult[] {
    return clients.map(client => ({
      ...client,
      displayName: this.getClientDisplayName(client),
      searchMatches: this.getSearchMatches(client, query),
      isRecentlyActive: this.isClientRecentlyActive(client)
    })).sort((a, b) => {
      // Ordenar por relevancia: primero los que coinciden en nombre, luego por fecha de creación
      const aNameMatch = query ? a.displayName.toLowerCase().includes(query.toLowerCase()) : false;
      const bNameMatch = query ? b.displayName.toLowerCase().includes(query.toLowerCase()) : false;
      
      if (aNameMatch && !bNameMatch) return -1;
      if (!aNameMatch && bNameMatch) return 1;
      
      // Si ambos coinciden o ninguno, ordenar por fecha de creación (más reciente primero)
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bDate - aDate;
    });
  }

  private getClientDisplayName(client: ClientResponseDto): string {
    if (client.fullname) return client.fullname;
    if (client.name && client.lastName) {
      return `${client.name} ${client.lastName}`;
    }
    if (client.name) return client.name;
    if (client.lastName) return client.lastName;
    if (client.email) return client.email;
    return 'Cliente sin nombre';
  }

  private isClientRecentlyActive(client: ClientResponseDto): boolean {
    if (!client.createdAt) return false;
    const created = new Date(client.createdAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return created > thirtyDaysAgo;
  }

  private buildFilters(query: string): ClientSearchFilters {
    const formValue = this.filtersForm.value;
    return {
      query,
      status: formValue.status,
      hasEmail: formValue.hasEmail,
      hasPhone: formValue.hasPhone
    };
  }

  // Event handlers
  onSearch(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.filtersForm.patchValue({ query });
    this.performSearch();
  }

  onQueryChange(query: string): void {
    this.filtersForm.patchValue({ query });
    // Debounce la búsqueda para evitar llamadas excesivas
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.performSearch();
    }, 300);
  }

  onFilterChange(field: string, value: any): void {
    this.filtersForm.patchValue({ [field]: value });
    this.performSearch();
  }

  onClientSelect(client: ClientResponseDto): void {
    this.clearSearch();
    this.clientSelected.emit(client);
    this.close();
  }

  onClear(): void {
    this.filtersForm.patchValue({
      query: '',
      status: null,
      hasEmail: null,
      hasPhone: null
    });
    this.loadInitialClients();
  }

  private clearSearch(): void {
    this.filtersForm.patchValue({
      query: ''
    });
    this.isLoading.set(false);
  }

  performSearch(): void {
    const query = this.filtersForm.value.query || '';
    this.isLoading.set(true);
    this.searchClients(query).subscribe(results => {
      this.searchResults.set(results);
      this.isLoading.set(false);
    });
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

  // Métodos para formateo de datos
  formatClientInfo(client: ClientSearchResult): string {
    const info: string[] = [];
    
    if (client.email) info.push(client.email);
    if (client.phone) info.push(client.phone);
    
    return info.join(' • ');
  }

  getClientInitials(client: ClientResponseDto): string {
    if (client.name && client.lastName) {
      return `${client.name.charAt(0)}${client.lastName.charAt(0)}`.toUpperCase();
    }
    if (client.name) {
      return client.name.charAt(0).toUpperCase();
    }
    if (client.email) {
      return client.email.charAt(0).toUpperCase();
    }
    return 'C';
  }

  getMatchesBadgeText(matches: string[]): string {
    if (matches.length === 0) return '';
    if (matches.length === 1) return matches[0];
    return `${matches[0]} +${matches.length - 1}`;
  }

  ngOnDestroy(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }
}