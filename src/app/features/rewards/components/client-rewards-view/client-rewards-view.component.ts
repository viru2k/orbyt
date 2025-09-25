import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

// PrimeNG Components
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { TabViewModule } from 'primeng/tabview';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

// Orb Components
import { 
  OrbCardComponent, 
  OrbButtonComponent 
} from '@orb-components';

// Local Components
import { ClientSearchComponent, ClientSearchResult } from '../client-search/client-search.component';
import { RewardApplicationModalComponent } from '../reward-application-modal/reward-application-modal.component';

// Services and Models
import { RewardsService } from '../../../../api/services/rewards.service';
import { ClientResponseDto, CustomerRewardResponseDto } from '../../../../api/models';

@Component({
  selector: 'app-client-rewards-view',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    TableModule,
    TagModule,
    ButtonModule,
    ProgressBarModule,
    TabViewModule,
    ToastModule,
    OrbCardComponent,
    OrbButtonComponent,
    ClientSearchComponent,
    RewardApplicationModalComponent
  ],
  providers: [MessageService],
  template: `
    <div class="client-rewards-view-container">
      <!-- Page Header -->
      <div class="page-header">
        <h1><i class="fa fa-users"></i> Vista de Recompensas por Cliente</h1>
        <p>Busca clientes y visualiza sus recompensas activas, historial y progreso</p>
      </div>

      <!-- Client Search Section -->
      <div class="search-section">
        <app-client-search
          (clientSelected)="onClientSelected($event)"
          (viewRewards)="onViewRewards($event)"
          (viewHistory)="onViewHistory($event)"
          (applyRewardRequested)="onApplyRewardRequested($event)">
        </app-client-search>
      </div>

      <!-- Client Rewards Details -->
      <div class="rewards-details" *ngIf="selectedClient()">
        <orb-card>
          <div orbHeader>
            <h3>
              <i class="fa fa-star"></i> 
              Recompensas de {{ selectedClient()?.name }} {{ selectedClient()?.lastName }}
            </h3>
          </div>
          
          <div orbBody>
            <p-tabView>
              <!-- Active Rewards Tab -->
              <p-tabPanel header="Recompensas Activas" leftIcon="pi pi-clock">
                <div *ngIf="loading(); else activeRewardsContent" class="loading-center">
                  <i class="fa fa-spinner fa-spin"></i>
                  <p>Cargando recompensas activas...</p>
                </div>

                <ng-template #activeRewardsContent>
                  <div *ngIf="activeRewards().length === 0" class="empty-state">
                    <i class="fa fa-info-circle fa-2x text-muted mb-3"></i>
                    <p class="text-muted">El cliente no tiene recompensas activas en este momento.</p>
                    <orb-button
                      label="Aplicar Nueva Recompensa"
                      icon="fa fa-plus"
                      variant="primary"
                      (clicked)="onApplyRewardRequested(selectedClient()!)">
                    </orb-button>
                  </div>

                  <p-table 
                    *ngIf="activeRewards().length > 0"
                    [value]="activeRewards()"
                    styleClass="p-datatable-sm">
                    
                    <ng-template pTemplate="header">
                      <tr>
                        <th>Programa</th>
                        <th>Progreso</th>
                        <th>Estado</th>
                        <th>Vencimiento</th>
                        <th>Acciones</th>
                      </tr>
                    </ng-template>
                    
                    <ng-template pTemplate="body" let-reward>
                      <tr>
                        <td>
                          <strong>{{ reward.rewardProgram?.name || 'Programa sin nombre' }}</strong>
                          <br>
                          <small class="text-muted">{{ reward.rewardProgram?.description }}</small>
                        </td>
                        <td>
                          <div class="progress-info">
                            <span class="progress-text">
                              {{ reward.currentProgress || 0 }} / {{ reward.targetValue || 0 }}
                            </span>
                            <p-progressBar 
                              [value]="getProgressPercentage(reward)"
                              styleClass="mt-1">
                            </p-progressBar>
                          </div>
                        </td>
                        <td>
                          <p-tag 
                            [value]="getRewardStatusLabel(reward.status)"
                            [severity]="getRewardStatusSeverity(reward.status)">
                          </p-tag>
                        </td>
                        <td>
                          <span *ngIf="reward.expiresAt">
                            {{ formatDate(reward.expiresAt) }}
                          </span>
                          <span *ngIf="!reward.expiresAt" class="text-muted">Sin vencimiento</span>
                        </td>
                        <td>
                          <orb-button
                            *ngIf="reward.status === 'EARNED'"
                            label="Canjear"
                            icon="fa fa-gift"
                            size="small"
                            variant="success"
                            (clicked)="redeemReward(reward)">
                          </orb-button>
                        </td>
                      </tr>
                    </ng-template>

                    <ng-template pTemplate="emptymessage">
                      <tr>
                        <td colspan="5" class="empty-message">
                          No hay recompensas activas
                        </td>
                      </tr>
                    </ng-template>
                  </p-table>
                </ng-template>
              </p-tabPanel>

              <!-- Redeemed Rewards Tab -->
              <p-tabPanel header="Historial de Canjes" leftIcon="pi pi-history">
                <div *ngIf="loading(); else redeemedRewardsContent" class="loading-center">
                  <i class="fa fa-spinner fa-spin"></i>
                  <p>Cargando historial...</p>
                </div>

                <ng-template #redeemedRewardsContent>
                  <p-table 
                    [value]="redeemedRewards()"
                    [paginator]="true"
                    [rows]="10"
                    styleClass="p-datatable-sm">
                    
                    <ng-template pTemplate="header">
                      <tr>
                        <th>Programa</th>
                        <th>Estado</th>
                        <th>Fecha</th>
                        <th>Valor</th>
                        <th>Tipo</th>
                      </tr>
                    </ng-template>

                    <ng-template pTemplate="body" let-reward>
                      <tr>
                        <td>{{ reward.rewardProgram?.name || 'Programa sin nombre' }}</td>
                        <td>
                          <p-tag
                            [value]="getRewardStatusLabel(reward.status)"
                            [severity]="getRewardStatusSeverity(reward.status)">
                          </p-tag>
                        </td>
                        <td>{{ formatDate(reward.redeemedAt || reward.createdAt) }}</td>
                        <td>
                          <span class="reward-value">{{ getRewardValueDisplay(reward) }}</span>
                        </td>
                        <td>
                          <p-tag [value]="getRewardTypeLabel(reward.rewardProgram?.rewardType)"></p-tag>
                        </td>
                      </tr>
                    </ng-template>

                    <ng-template pTemplate="emptymessage">
                      <tr>
                        <td colspan="5" class="empty-message">
                          El cliente no tiene historial de recompensas
                        </td>
                      </tr>
                    </ng-template>
                  </p-table>
                </ng-template>
              </p-tabPanel>
            </p-tabView>
          </div>
        </orb-card>
      </div>

      <!-- Toast Messages -->
      <p-toast></p-toast>

      <!-- Reward Application Modal -->
      <app-reward-application-modal
        [visible]="showRewardApplicationModal()"
        [client]="clientForRewardApplication()"
        (applied)="onRewardApplicationCompleted()"
        (cancelled)="onRewardApplicationCancelled()">
      </app-reward-application-modal>
    </div>
  `,
  styleUrls: ['./client-rewards-view.component.scss']
})
export class ClientRewardsViewComponent implements OnInit {
  private rewardsService = inject(RewardsService);
  private messageService = inject(MessageService);
  private http = inject(HttpClient);

  // State
  selectedClient = signal<ClientResponseDto | null>(null);
  loading = signal(false);
  activeRewards = signal<CustomerRewardResponseDto[]>([]);
  redeemedRewards = signal<CustomerRewardResponseDto[]>([]);
  showRewardApplicationModal = signal(false);
  clientForRewardApplication = signal<ClientResponseDto | null>(null);

  ngOnInit(): void {
    // Initialize any data if needed
  }

  onClientSelected(client: ClientSearchResult): void {
    this.selectedClient.set(client);
    this.loadClientRewards(client.id);
  }

  onViewRewards(client: ClientSearchResult): void {
    this.onClientSelected(client);
  }

  onViewHistory(client: ClientSearchResult): void {
    this.onClientSelected(client);
    // Could scroll to history tab or set active tab
  }

  onApplyRewardRequested(client: ClientResponseDto): void {
    this.showRewardApplicationModal.set(true);
    this.clientForRewardApplication.set(client);
  }

  private loadClientRewards(clientId: number): void {
    this.loading.set(true);

    // Load active rewards
    this.rewardsService.rewardsControllerGetClientActiveRewards({ clientId }).subscribe({
      next: (rewards) => {
        this.activeRewards.set(rewards || []);
      },
      error: (error) => {
        console.error('Error loading active rewards:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las recompensas activas'
        });
      }
    });

    // Load client reward history (using direct HTTP call due to OpenAPI generation issue)
    this.http.get<CustomerRewardResponseDto[]>(`http://localhost:3000/rewards/customer/${clientId}/history`).subscribe({
      next: (rewards) => {
        console.log('Raw reward history data:', rewards);
        const rewardsList = Array.isArray(rewards) ? rewards : [];
        console.log('Rewards list:', rewardsList);
        console.log('Reward statuses:', rewardsList.map(r => ({ id: r.id, status: r.status })));

        // Show all rewards in history, not just redeemed ones
        // const redeemed = rewardsList.filter(r => r.status === 'REDEEMED');
        // For now, let's show all historical rewards
        const historicalRewards = rewardsList;
        console.log('Historical rewards to display:', historicalRewards);

        this.redeemedRewards.set(historicalRewards);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading reward history:', error);
        this.loading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el historial de recompensas'
        });
      }
    });
  }

  redeemReward(reward: CustomerRewardResponseDto): void {
    if (!this.selectedClient() || !reward.id) return;

    this.rewardsService.rewardsControllerRedeemReward({
      clientId: this.selectedClient()!.id,
      rewardId: reward.id
    }).subscribe({
      next: (redeemedReward) => {
        this.messageService.add({
          severity: 'success',
          summary: '¡Recompensa Canjeada!',
          detail: 'La recompensa se ha canjeado exitosamente'
        });
        
        // Refresh client rewards
        this.loadClientRewards(this.selectedClient()!.id);
      },
      error: (error) => {
        console.error('Error redeeming reward:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error al Canjear',
          detail: 'No se pudo canjear la recompensa. Inténtalo de nuevo.'
        });
      }
    });
  }

  getProgressPercentage(reward: CustomerRewardResponseDto): number {
    if (!reward.currentProgress || !reward.targetValue) return 0;
    return Math.min(100, (Number(reward.currentProgress) / Number(reward.targetValue)) * 100);
  }

  getRewardStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      'IN_PROGRESS': 'En Progreso',
      'EARNED': 'Ganada',
      'REDEEMED': 'Canjeada',
      'EXPIRED': 'Expirada'
    };
    return statusMap[status] || status;
  }

  getRewardStatusSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' {
    const severityMap: { [key: string]: 'success' | 'info' | 'warning' | 'danger' } = {
      'IN_PROGRESS': 'info',
      'EARNED': 'success',
      'REDEEMED': 'info',
      'EXPIRED': 'danger'
    };
    return severityMap[status] || 'info';
  }

  getRewardTypeLabel(type?: string): string {
    if (!type) return 'Desconocido';
    
    const typeMap: { [key: string]: string } = {
      'DISCOUNT_PERCENTAGE': 'Descuento %',
      'DISCOUNT_AMOUNT': 'Descuento $',
      'FREE_SERVICE': 'Servicio Gratis',
      'POINTS': 'Puntos'
    };
    return typeMap[type] || type;
  }

  getRewardValueDisplay(reward: CustomerRewardResponseDto): string {
    if (!reward.rewardProgram?.rewardValue) return '';
    
    const value = reward.rewardProgram.rewardValue;
    const type = reward.rewardProgram.rewardType;
    
    switch (type) {
      case 'DISCOUNT_PERCENTAGE':
        return `${value}%`;
      case 'DISCOUNT_AMOUNT':
        return `$${value}`;
      case 'POINTS':
        return `${value} pts`;
      default:
        return value.toString();
    }
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  onRewardApplicationCompleted(): void {
    this.showRewardApplicationModal.set(false);
    this.clientForRewardApplication.set(null);

    // Refresh client rewards if there's a selected client
    if (this.selectedClient()) {
      this.loadClientRewards(this.selectedClient()!.id);
    }
  }

  onRewardApplicationCancelled(): void {
    this.showRewardApplicationModal.set(false);
    this.clientForRewardApplication.set(null);
  }
}