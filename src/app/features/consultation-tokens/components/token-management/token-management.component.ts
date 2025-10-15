import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, Subject, takeUntil } from 'rxjs';

// PrimeNG Components
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

// Orb Components
import { OrbButtonComponent, OrbCardComponent, OrbSelectComponent } from '@orb-components';

// Store and Services
import { ConsultationTokenStore } from '@orb-stores';
import { NotificationService } from '@orb-services';
import { NotificationSeverity } from '@orb-models';
import { WebSocketService } from '../../../../services/websocket/websocket.service';

interface TokenScenarioOption {
  label: string;
  value: string;
  description: string;
}

@Component({
  selector: 'app-token-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    TagModule,
    TooltipModule,
    DropdownModule,
    DialogModule,
    InputTextModule,
    ProgressSpinnerModule,
    OrbButtonComponent,
    OrbCardComponent,
    OrbSelectComponent
  ],
  templateUrl: './token-management.component.html',
  styleUrls: ['./token-management.component.scss']
})
export class TokenManagementComponent implements OnInit, OnDestroy {
  @Input() consultationId!: number;

  private destroy$ = new Subject<void>();
  private tokenStore = inject(ConsultationTokenStore);
  private notificationService = inject(NotificationService);
  private webSocketService = inject(WebSocketService);

  // Observables
  tokens$ = this.tokenStore.selectTokensWithFormatting;
  loading$ = this.tokenStore.loading;
  error$ = this.tokenStore.error;

  // Modal state
  showCreateTokenDialog = false;
  selectedScenario: string = '';

  scenarioOptions: TokenScenarioOption[] = [
    {
      label: 'Pre-consulta',
      value: 'pre-consultation',
      description: 'Token para acceso antes de la consulta'
    },
    {
      label: 'Post-consulta',
      value: 'post-consultation',
      description: 'Token para acceso despu�s de la consulta'
    },
    {
      label: 'Seguimiento',
      value: 'follow-up',
      description: 'Token para seguimiento posterior'
    },
    {
      label: 'Emergencia',
      value: 'emergency',
      description: 'Token de acceso de emergencia'
    }
  ];

  ngOnInit(): void {
    if (this.consultationId) {
      this.loadTokens();
    }

    // Subscribe to WebSocket notifications
    this.webSocketService.getNotificationsByType('consultation_token')
      .pipe(takeUntil(this.destroy$))
      .subscribe(notifications => {
        // Refresh tokens when new token notifications arrive
        const relevantNotifications = notifications.filter(n => 
          n.data?.consultationId === this.consultationId
        );
        if (relevantNotifications.length > 0) {
          this.loadTokens();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTokens(): void {
    this.tokenStore.loadTokensForConsultation(this.consultationId);
  }

  openCreateTokenDialog(): void {
    this.selectedScenario = '';
    this.showCreateTokenDialog = true;
  }

  closeCreateTokenDialog(): void {
    this.showCreateTokenDialog = false;
    this.selectedScenario = '';
  }

  createToken(): void {
    if (!this.selectedScenario) {
      this.notificationService.showWarn(
        NotificationSeverity.Warn,
        'Por favor selecciona un escenario para el token'
      );
      return;
    }

    this.tokenStore.createTokenByScenario({
      consultationId: this.consultationId,
      scenario: this.selectedScenario
    });

    this.notificationService.showSuccess(
      NotificationSeverity.Success,
      'Token creado exitosamente'
    );

    this.closeCreateTokenDialog();
  }

  createAutoTokens(): void {
    this.tokenStore.createAutoTokens(this.consultationId);
    this.notificationService.showSuccess(
      NotificationSeverity.Success,
      'Tokens autom�ticos creados exitosamente'
    );
  }

  revokeToken(tokenId: number): void {
    if (confirm('�Est�s seguro de que quieres revocar este token?')) {
      this.tokenStore.revokeToken(tokenId);
      this.notificationService.showSuccess(
        NotificationSeverity.Success,
        'Token revocado exitosamente'
      );
    }
  }

  getSelectedScenarioDescription(): string {
    const option = this.scenarioOptions.find(opt => opt.value === this.selectedScenario);
    return option?.description || '';
  }

  copyTokenUrl(token: any): void {
    const url = `${window.location.origin}/consulta/${token.token}`;
    navigator.clipboard.writeText(url).then(() => {
      this.notificationService.showSuccess(
        NotificationSeverity.Success,
        'URL del token copiada al portapapeles'
      );
    }).catch(() => {
      this.notificationService.showError(
        NotificationSeverity.Error,
        'Error al copiar la URL del token'
      );
    });
  }

  getStatusSeverity(status: string): string {
    switch (status) {
      case 'active': return 'success';
      case 'used': return 'info';
      case 'expired': return 'danger';
      default: return 'secondary';
    }
  }

  getScenarioSeverity(scenario: string): string {
    switch (scenario) {
      case 'pre-consultation': return 'info';
      case 'post-consultation': return 'success';
      case 'follow-up': return 'warning';
      case 'emergency': return 'danger';
      default: return 'secondary';
    }
  }

  formatTimeLeft(expiresAt: string): string {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    
    if (diffMs <= 0) {
      return 'Expirado';
    }

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 24) {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} d�a${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      return `${diffMinutes}m`;
    }
  }
}