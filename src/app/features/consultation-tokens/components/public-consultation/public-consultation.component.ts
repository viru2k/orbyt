import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG Components
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { MessagesModule } from 'primeng/messages';
import { MessageModule } from 'primeng/message';

// Store and Services
import { ConsultationTokenStore } from '@orb-stores';

@Component({
  selector: 'app-public-consultation',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    ProgressSpinnerModule,
    TagModule,
    DividerModule,
    MessagesModule,
    MessageModule
  ],
  templateUrl: './public-consultation.component.html',
  styleUrls: ['./public-consultation.component.scss']
})
export class PublicConsultationComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private tokenStore = inject(ConsultationTokenStore);

  // Observables
  loading$ = this.tokenStore.loading;
  error$ = this.tokenStore.error;
  validationResult$ = this.tokenStore.validationResult;
  consultationData$ = this.tokenStore.publicConsultationData;

  token: string = '';
  tokenValidated = false;
  accessGranted = false;

  ngOnInit(): void {
    // Get token from route parameters
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.token = params['token'];
        if (this.token) {
          this.validateToken();
        } else {
          this.router.navigate(['/dashboard']);
        }
      });

    // Subscribe to validation result changes using effect
    // We'll handle this through direct observation since these are signals
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    // Clear store data when leaving
    this.tokenStore.clearValidationResult();
    this.tokenStore.clearPublicConsultationData();
  }

  validateToken(): void {
    this.tokenStore.validateToken(this.token);
  }

  accessConsultation(): void {
    this.tokenStore.accessConsultationByToken(this.token);
    this.accessGranted = true;
  }

  useTokenForAction(action: string, data?: any): void {
    this.tokenStore.useTokenAndAccessConsultation({
      token: this.token,
      action,
      data
    });
  }

  getScenarioInfo(scenario: string): { label: string; color: string; icon: string } {
    const scenarios: Record<string, { label: string; color: string; icon: string }> = {
      'pre-consultation': {
        label: 'Pre-consulta',
        color: 'info',
        icon: 'pi-clock'
      },
      'post-consultation': {
        label: 'Post-consulta',
        color: 'success',
        icon: 'pi-check-circle'
      },
      'follow-up': {
        label: 'Seguimiento',
        color: 'warning',
        icon: 'pi-refresh'
      },
      'emergency': {
        label: 'Emergencia',
        color: 'danger',
        icon: 'pi-exclamation-triangle'
      }
    };

    return scenarios[scenario] || {
      label: scenario,
      color: 'secondary',
      icon: 'pi-info-circle'
    };
  }

  getStatusSeverity(status: string): string {
    switch (status?.toLowerCase()) {
      case 'completed': return 'success';
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'danger';
      case 'rescheduled': return 'info';
      default: return 'secondary';
    }
  }

  formatDate(dateString: string | Date): string {
    if (!dateString) return '-';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  downloadRecommendations(): void {
    this.useTokenForAction('download_recommendations');
  }

  confirmAppointment(): void {
    this.useTokenForAction('confirm_appointment');
  }

  rescheduleAppointment(): void {
    this.useTokenForAction('reschedule_appointment');
  }

  provideFeedback(): void {
    this.useTokenForAction('provide_feedback');
  }
}