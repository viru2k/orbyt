import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  OnChanges,
  SimpleChanges,
  signal,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';

// PrimeNG Components
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

// Orb Components
import { OrbFormFooterComponent } from '@orb-components';

// Services and Models
import { RewardsService } from '../../../../api/services/rewards.service';
import {
  ClientResponseDto,
  RewardProgramResponseDto,
  TriggerPurchaseCompletedDto,
} from '../../../../api/models';
import { FormButtonAction } from '@orb-models';

export interface ManualRewardApplication {
  clientId: number;
  programId: number;
  reason: string;
  appliedBy: number;
  notifyClient: boolean;
  simulatedAmount: number;
}

@Component({
  selector: 'app-reward-application-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DialogModule,
    DropdownModule,
    ButtonModule,
    CheckboxModule,
    ProgressSpinnerModule,
    MessageModule,
    ToastModule,
    OrbFormFooterComponent,
  ],
  providers: [MessageService],
  template: `
    <p-dialog
      [(visible)]="visible"
      [modal]="true"
      [closable]="true"
      [resizable]="false"
      [draggable]="false"
      styleClass="reward-application-modal"
      header="Aplicar Recompensa Manual"
      [style]="{ width: '600px', minHeight: '400px' }"
      (onHide)="onCancel()"
    >
      <div class="modal-content">
        <!-- Client Info -->
        <div class="client-info" *ngIf="client">
          <h4><i class="fa fa-user"></i> Cliente Seleccionado</h4>
          <p>
            <strong>{{ client.name }} {{ client.lastName }}</strong>
          </p>
          <p *ngIf="client.email" class="text-muted">
            <i class="fa fa-envelope"></i> {{ client.email }}
          </p>
          <p *ngIf="client.phone" class="text-muted">
            <i class="fa fa-phone"></i> {{ client.phone }}
          </p>
        </div>

        <!-- Form -->
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="reward-form">
          <!-- Loading State -->
          <div *ngIf="loadingPrograms()" class="loading-center">
            <p-progressSpinner
              strokeWidth="3"
              [style]="{ width: '30px', height: '30px' }"
            ></p-progressSpinner>
            <p>Cargando programas de recompensas...</p>
          </div>

          <!-- Error State -->
          <p-message *ngIf="errorMessage()" severity="error" [text]="errorMessage()"> </p-message>

          <!-- Form Fields -->
          <div *ngIf="!loadingPrograms() && !errorMessage()" class="form-fields">
            <!-- Program Selection -->
            <div class="field">
              <label for="programId">Programa de Recompensa *</label>
              <p-dropdown
                id="programId"
                formControlName="programId"
                [options]="programOptions()"
                optionLabel="label"
                optionValue="value"
                placeholder="Selecciona un programa"
                [style]="{ width: '100%' }"
                (onChange)="onProgramChange($event)"
              >
              </p-dropdown>
              <small
                *ngIf="form.get('programId')?.invalid && form.get('programId')?.touched"
                class="field-error"
              >
                Selecciona un programa de recompensa
              </small>
            </div>

            <!-- Selected Program Info -->
            <div *ngIf="selectedProgram()" class="program-info">
              <h5><i class="fa fa-info-circle"></i> Información del Programa</h5>
              <p>
                <strong>{{ selectedProgram()?.name }}</strong>
              </p>
              <p class="program-description">{{ selectedProgram()?.description }}</p>
              <div class="program-details">
                <span class="detail-item">
                  <i class="fa fa-star"></i>
                  Recompensa: {{ getRewardTypeLabel(selectedProgram()?.rewardType) }}
                </span>
                <span class="detail-item">
                  <i class="fa fa-coins"></i>
                  Valor: {{ selectedProgram()?.rewardValue }}
                </span>
              </div>
            </div>

            <!-- Simulated Amount -->
            <div class="field">
              <label for="simulatedAmount">Monto de Compra Simulado *</label>
              <input
                id="simulatedAmount"
                type="number"
                formControlName="simulatedAmount"
                class="p-inputtext p-component"
                placeholder="Ej: 150.00"
                min="0"
                step="0.01"
              />
              <small class="field-help">
                Monto de compra ficticio para calcular puntos y recompensas
              </small>
              <small
                *ngIf="form.get('simulatedAmount')?.invalid && form.get('simulatedAmount')?.touched"
                class="field-error"
              >
                Ingresa un monto válido mayor a 0
              </small>
            </div>

            <!-- Reason -->
            <div class="field">
              <label for="reason">Motivo de Aplicación Manual *</label>
              <textarea
                id="reason"
                formControlName="reason"
                rows="3"
                class="p-inputtextarea p-component"
                placeholder="Describe el motivo para aplicar esta recompensa manualmente..."
              >
              </textarea>
              <small
                *ngIf="form.get('reason')?.invalid && form.get('reason')?.touched"
                class="field-error"
              >
                El motivo es requerido
              </small>
            </div>

            <!-- Notify Client -->
            <div class="field">
              <p-checkbox formControlName="notifyClient" binary="true" inputId="notifyClient">
              </p-checkbox>
              <label for="notifyClient" class="checkbox-label">
                Notificar al cliente por email
              </label>
            </div>

            <!-- Debug Info (temporal) -->
            <div
              *ngIf="form.invalid"
              class="debug-info"
              style="background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 4px;"
            >
              <h5>Debug - Form Status:</h5>
              <p><strong>Form Valid:</strong> {{ form.valid }}</p>
              <p><strong>Form Errors:</strong></p>
              <ul>
                <li *ngIf="form.get('programId')?.invalid">
                  <strong>programId:</strong> {{ form.get('programId')?.errors | json }}
                </li>
                <li *ngIf="form.get('simulatedAmount')?.invalid">
                  <strong>simulatedAmount:</strong> {{ form.get('simulatedAmount')?.errors | json }}
                </li>
                <li *ngIf="form.get('reason')?.invalid">
                  <strong>reason:</strong> {{ form.get('reason')?.errors | json }} (longitud:
                  {{ form.get('reason')?.value?.length || 0 }})
                </li>
              </ul>
            </div>
          </div>
        </form>
      </div>

      <!-- Footer Actions -->
      <ng-template pTemplate="footer">
        <orb-form-footer
          [buttons]="footerActions"
          alignment="right"
          (actionClicked)="handleFooterAction($event)"
        >
        </orb-form-footer>
      </ng-template>
    </p-dialog>
  `,
  styleUrls: ['./reward-application-modal.component.scss'],
})
export class RewardApplicationModalComponent implements OnInit, OnChanges {
  @Input() visible = false;
  @Input() client: ClientResponseDto | null = null;
  @Output() applied = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private rewardsService = inject(RewardsService);
  private messageService = inject(MessageService);

  form!: FormGroup;

  // Signals
  loadingPrograms = signal(false);
  applying = signal(false);
  errorMessage = signal('');
  availablePrograms = signal<RewardProgramResponseDto[]>([]);
  selectedProgram = signal<RewardProgramResponseDto | null>(null);
  programOptions = signal<{ label: string; value: number }[]>([]);

  // Footer actions configuration
  get footerActions(): FormButtonAction[] {
    // Debug para ver qué campos están inválidos
    if (this.form?.invalid) {
      console.log('Form is invalid. Errors:', this.getFormErrors());
    }

    return [
      {
        label: 'Cancelar',
        action: 'cancel',
        severity: 'secondary',
        variant: 'outlined',
        disabled: this.applying(),
      },
      {
        label: this.applying() ? 'Aplicando...' : 'Aplicar Recompensa',
        action: 'save',
        severity: 'info',
        variant: 'outlined',
        buttonType: 'submit',
        disabled: this.form?.invalid || this.applying(),
        loading: this.applying(),
      },
    ];
  }

  // Función temporal para debug
  private getFormErrors(): any {
    const errors: any = {};
    Object.keys(this.form.controls).forEach((key) => {
      const control = this.form.get(key);
      if (control && control.invalid) {
        errors[key] = control.errors;
      }
    });
    return errors;
  }

  ngOnInit(): void {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['client'] && this.client) {
      this.loadRewardPrograms();
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      programId: [null, [Validators.required]],
      simulatedAmount: [100, [Validators.required, Validators.min(0.01)]],
      reason: ['', [Validators.required, Validators.minLength(10)]],
      notifyClient: [true],
    });
  }

  private loadRewardPrograms(): void {
    if (!this.client) return;

    this.loadingPrograms.set(true);
    this.errorMessage.set('');

    this.rewardsService.rewardsControllerGetAllRewardPrograms().subscribe({
      next: (programs) => {
        // Filter only active programs
        const activePrograms = programs.filter((p) => p.status === 'ACTIVE');
        this.availablePrograms.set(activePrograms);

        // Create dropdown options
        const options = activePrograms.map((program) => ({
          label: `${program.name} - ${this.getRewardTypeLabel(program.rewardType)} ${
            program.rewardValue
          }`,
          value: program.id,
        }));
        this.programOptions.set(options);

        this.loadingPrograms.set(false);
      },
      error: (error) => {
        console.error('Error loading reward programs:', error);
        this.errorMessage.set('Error al cargar programas de recompensas. Inténtalo nuevamente.');
        this.loadingPrograms.set(false);
      },
    });
  }

  onProgramChange(event: any): void {
    const programId = event.value;
    const program = this.availablePrograms().find((p) => p.id === programId);
    this.selectedProgram.set(program || null);
  }

  onSubmit(): void {
    if (this.form.invalid || !this.client) return;

    this.applying.set(true);

    const formValue = this.form.value;
    const requestData: TriggerPurchaseCompletedDto = {
      clientId: this.client.id,
      invoiceId: 999999, // Fake invoice ID for manual application
      purchaseAmount: formValue.simulatedAmount,
      paymentMethod: 'other',
      paymentDate: new Date().toISOString(),
      items: [
        {
          serviceId: 1, // Default service for manual application
          quantity: 1,
          amount: formValue.simulatedAmount,
        },
      ],
    };

    this.rewardsService.rewardsControllerTriggerPurchaseCompleted({ body: requestData }).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Recompensa Aplicada',
          detail: `Se otorgaron ${response.pointsEarned} puntos al cliente. ${response.rewardsUnlocked} recompensas desbloqueadas.`,
        });

        this.applying.set(false);
        this.applied.emit();
        this.resetForm();
      },
      error: (error) => {
        console.error('Error applying reward:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo aplicar la recompensa. Inténtalo nuevamente.',
        });
        this.applying.set(false);
      },
    });
  }

  onCancel(): void {
    this.resetForm();
    this.cancelled.emit();
  }

  private resetForm(): void {
    this.form.reset({
      programId: null,
      simulatedAmount: 100,
      reason: '',
      notifyClient: true,
    });
    this.selectedProgram.set(null);
    this.applying.set(false);
    this.errorMessage.set('');
  }

  getRewardTypeLabel(type: string | undefined): string {
    const labels: Record<string, string> = {
      DISCOUNT_PERCENTAGE: '% Descuento',
      DISCOUNT_FIXED: '$ Descuento',
      FREE_SERVICE: 'Servicio Gratis',
      GIFT_CARD: 'Tarjeta Regalo',
      CASHBACK: 'Cashback',
    };
    return labels[type || ''] || type || '';
  }

  handleFooterAction(action: string): void {
    if (action === 'save') {
      this.onSubmit();
    } else if (action === 'cancel') {
      this.onCancel();
    }
  }
}
