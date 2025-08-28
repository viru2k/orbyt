import { Component, OnInit, signal, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, of, catchError } from 'rxjs';

// PrimeNG Components
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';

// Orb Components
import { 
  OrbCardComponent, 
  OrbButtonComponent
} from '@orb-components';

// Services and Models
import { RewardsService } from '../../../../api/services/rewards.service';
import { ClientResponseDto } from '../../../../api/models';

export interface ClientSearchResult extends ClientResponseDto {
  displayName?: string;
  rewardsCount?: number;
  lastActivity?: string;
}

@Component({
  selector: 'app-client-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AutoCompleteModule,
    ButtonModule,
    CardModule,
    TagModule,
    AvatarModule,
    OrbCardComponent,
    OrbButtonComponent
  ],
  template: `
    <div class="client-search-container">
      <orb-card>
        <div orbHeader>
          <h3><i class="fa fa-search"></i> Buscar Cliente</h3>
          <p>Busca clientes por nombre, teléfono, email o número de membresía</p>
        </div>
        
        <div orbBody>
          <!-- Search Input -->
          <div class="search-section">
            <p-autoComplete
              [(ngModel)]="selectedClient"
              [suggestions]="searchResults()"
              (completeMethod)="onSearch($event)"
              field="displayName"
              [dropdown]="true"
              [multiple]="false"
              [minLength]="2"
              placeholder="Escribe para buscar cliente..."
              styleClass="w-100">
              
              <!-- Custom Template for Search Results -->
              <ng-template let-client pTemplate="item">
                <div class="client-result-item">
                  <p-avatar 
                    [label]="getClientInitials(client)" 
                    shape="circle" 
                    size="large"
                    styleClass="mr-3">
                  </p-avatar>
                  
                  <div class="client-details">
                    <div class="client-name">
                      <strong>{{ client.name }} {{ client.lastName }}</strong>
                      <p-tag *ngIf="client.membershipNumber" 
                             value="{{ client.membershipNumber }}" 
                             severity="info" 
                             styleClass="ml-2">
                      </p-tag>
                    </div>
                    
                    <div class="client-info">
                      <small class="text-muted">
                        <span *ngIf="client.email">
                          <i class="fa fa-envelope"></i> {{ client.email }}
                        </span>
                        <span *ngIf="client.phone" class="ml-3">
                          <i class="fa fa-phone"></i> {{ client.phone }}
                        </span>
                      </small>
                    </div>
                    
                    <div class="rewards-info" *ngIf="client.rewardsCount !== undefined">
                      <small class="text-success">
                        <i class="fa fa-star"></i> {{ client.rewardsCount }} recompensa(s)
                      </small>
                    </div>
                  </div>
                </div>
              </ng-template>
              
              <!-- Empty State -->
              <ng-template pTemplate="empty">
                <div class="empty-results">
                  <div *ngIf="!searching(); else searchingTemplate" class="text-center p-4">
                    <i class="fa fa-search fa-2x text-muted mb-3"></i>
                    <p class="text-muted">
                      {{ searchQuery().length < 2 ? 'Escribe al menos 2 caracteres para buscar' : 'No se encontraron clientes' }}
                    </p>
                  </div>
                  
                  <ng-template #searchingTemplate>
                    <div class="text-center p-4">
                      <i class="fa fa-spinner fa-spin fa-2x text-muted mb-3"></i>
                      <p class="text-muted">Buscando clientes...</p>
                    </div>
                  </ng-template>
                </div>
              </ng-template>
            </p-autoComplete>
          </div>

          <!-- Selected Client Display -->
          <div class="selected-client" *ngIf="selectedClient">
            <h4>Cliente Seleccionado</h4>
            
            <div class="client-card">
              <div class="client-header">
                <p-avatar 
                  [label]="getClientInitials(selectedClient)" 
                  shape="circle" 
                  size="xlarge"
                  styleClass="client-avatar">
                </p-avatar>
                
                <div class="client-main-info">
                  <h3>{{ selectedClient.name }} {{ selectedClient.lastName }}</h3>
                  <p-tag *ngIf="selectedClient.membershipNumber" 
                         [value]="selectedClient.membershipNumber" 
                         severity="info">
                  </p-tag>
                  
                  <div class="client-status">
                    <p-tag [value]="getStatusLabel(selectedClient.status)" 
                           [severity]="getStatusSeverity(selectedClient.status)">
                    </p-tag>
                  </div>
                </div>
              </div>
              
              <div class="client-contact-info">
                <div class="info-row" *ngIf="selectedClient.email">
                  <i class="fa fa-envelope"></i>
                  <span>{{ selectedClient.email }}</span>
                </div>
                
                <div class="info-row" *ngIf="selectedClient.phone">
                  <i class="fa fa-phone"></i>
                  <span>{{ selectedClient.phone }}</span>
                </div>
                
                <div class="info-row" *ngIf="selectedClient.address">
                  <i class="fa fa-map-marker-alt"></i>
                  <span>{{ selectedClient.address }}</span>
                </div>
              </div>
              
              <!-- Action Buttons -->
              <div class="client-actions">
                <orb-button
                  label="Ver Recompensas"
                  icon="fa fa-star"
                  variant="primary"
                  (clicked)="viewClientRewards(selectedClient)">
                </orb-button>
                
                <orb-button
                  label="Historial"
                  icon="fa fa-history"
                  variant="secondary"
                  (clicked)="viewClientHistory(selectedClient)">
                </orb-button>
                
                <orb-button
                  label="Aplicar Recompensa"
                  icon="fa fa-gift"
                  variant="success"
                  (clicked)="applyReward(selectedClient)">
                </orb-button>
              </div>
            </div>
          </div>
        </div>
      </orb-card>
    </div>
  `,
  styleUrls: ['./client-search.component.scss']
})
export class ClientSearchComponent implements OnInit {
  private rewardsService = inject(RewardsService);

  // Outputs
  clientSelected = output<ClientResponseDto>();
  viewRewards = output<ClientResponseDto>();
  viewHistory = output<ClientResponseDto>();
  applyRewardRequested = output<ClientResponseDto>();

  // State
  searchQuery = signal('');
  searchResults = signal<ClientSearchResult[]>([]);
  searching = signal(false);
  selectedClient: ClientSearchResult | null = null;

  ngOnInit(): void {
    // Any initialization logic
  }

  onSearch(event: any): void {
    const query = event.query;
    this.searchQuery.set(query);
    
    if (!query || query.trim().length < 2) {
      this.searchResults.set([]);
      return;
    }

    this.searching.set(true);

    // Use the rewards service to search clients
    // Note: This will be updated once the API models are regenerated
    this.searchClients(query)
      .pipe(
        catchError(error => {
          console.error('Error searching clients:', error);
          this.searching.set(false);
          return of([]);
        })
      )
      .subscribe(clients => {
        const processedClients = this.processClientResults(clients);
        this.searchResults.set(processedClients);
        this.searching.set(false);
      });
  }

  private searchClients(query: string) {
    // Use the actual API endpoint
    return this.rewardsService.rewardsControllerSearchClientsForRewards({ query }).pipe(
      debounceTime(300),
      distinctUntilChanged()
    );
  }

  private processClientResults(clients: ClientResponseDto[]): ClientSearchResult[] {
    return clients.map(client => ({
      ...client,
      displayName: `${client.name} ${client.lastName}`,
      rewardsCount: Math.floor(Math.random() * 5), // Mock data
      lastActivity: 'Hace 2 días' // Mock data
    }));
  }

  viewClientRewards(client: ClientSearchResult): void {
    this.viewRewards.emit(client);
  }

  viewClientHistory(client: ClientSearchResult): void {
    this.viewHistory.emit(client);
  }

  applyReward(client: ClientSearchResult): void {
    this.applyRewardRequested.emit(client);
  }

  getClientInitials(client: ClientSearchResult): string {
    if (!client?.name || !client?.lastName) return '?';
    return `${client.name.charAt(0)}${client.lastName.charAt(0)}`.toUpperCase();
  }

  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      'ACTIVE': 'Activo',
      'INACTIVE': 'Inactivo',
      'CREATED': 'Creado',
      'UNUSED': 'Sin usar'
    };
    return statusMap[status] || status;
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' {
    const severityMap: { [key: string]: 'success' | 'info' | 'warning' | 'danger' } = {
      'ACTIVE': 'success',
      'INACTIVE': 'danger',
      'CREATED': 'info',
      'UNUSED': 'warning'
    };
    return severityMap[status] || 'info';
  }
}