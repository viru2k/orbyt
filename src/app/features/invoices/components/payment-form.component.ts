import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// PrimeNG Components
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';

// Orb Components
import { OrbButtonComponent, OrbTextInputComponent, OrbFormFieldComponent, OrbFormFooterComponent, OrbSelectComponent, OrbDatepickerComponent, OrbTextAreaComponent } from '@orb-components';

// Services and Models
import { InvoicesService } from '../../../api/services/invoices.service';
import { RewardsService } from '../../../api/services/rewards.service';
import { InvoiceResponseDto } from '../../../api/models/invoice-response-dto';
import { ProcessPaymentDto } from '../../../api/models/process-payment-dto';
import { TriggerPurchaseCompletedDto, CustomerRewardResponseDto, PurchaseCompletedResponseDto } from '../../../api/models';
import { MessageService } from 'primeng/api';
import { FormButtonAction } from '@orb-models';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ToastModule,
    DividerModule,
    InputNumberModule,
    DialogModule,
    ProgressBarModule,
    TagModule,
    OrbTextInputComponent,
    OrbFormFieldComponent,
    OrbFormFooterComponent,
    OrbSelectComponent,
    OrbDatepickerComponent,
    OrbTextAreaComponent,
    OrbButtonComponent,
  ],
  providers: [MessageService],
  template: `
    <div class="payment-form-container" *ngIf="invoice">
      <!-- Invoice Summary -->
      <div class="invoice-summary">
        <h3><i class="fa fa-file-invoice"></i> Resumen de Factura</h3>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="label">Número de Factura:</span>
            <span class="value">{{ invoice.invoiceNumber }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Cliente:</span>
            <span class="value">{{ getClientName(invoice) }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Total de la Factura:</span>
            <span class="value amount">{{ invoice.total | currency:'EUR':'symbol':'1.2-2' }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Monto Pagado:</span>
            <span class="value paid">{{ invoice.paidAmount | currency:'EUR':'symbol':'1.2-2' }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Monto Pendiente:</span>
            <span class="value pending">{{ invoice.remainingAmount | currency:'EUR':'symbol':'1.2-2' }}</span>
          </div>
        </div>
      </div>

      <p-divider></p-divider>

      <!-- Payment Form -->
      <form [formGroup]="paymentForm" (ngSubmit)="onSubmit()">
        <div class="form-section">
          <h3><i class="fa fa-credit-card"></i> Información del Pago</h3>
          
          <div class="form-grid">
            <orb-form-field label="Monto a Pagar" [required]="true">
              <p-inputNumber
                formControlName="amount"
                [min]="0.01"
                [max]="invoice.remainingAmount"
                [step]="0.01"
                mode="currency"
                currency="EUR"
                locale="es-ES"
                [showButtons]="true"
                buttonLayout="horizontal"
                incrementButtonIcon="pi pi-plus"
                decrementButtonIcon="pi pi-minus"
                styleClass="w-full"
                />
              <small class="help-text">
                Máximo disponible: {{ invoice.remainingAmount | currency:'EUR':'symbol':'1.2-2' }}
              </small>
            </orb-form-field>

            <orb-form-field label="Método de Pago *" [required]="true">
              <orb-select
                formControlName="paymentMethod"
                [options]="paymentMethodOptions"
                
                optionLabel="label"
                optionValue="value">
              </orb-select>
            </orb-form-field>

            <orb-form-field label="Fecha de Pago">
              <orb-datepicker
                formControlName="paymentDate"
                
                [showIcon]="true"
                dateFormat="dd/mm/yy"
                [maxDate]="today">
              </orb-datepicker>
            </orb-form-field>

            <orb-form-field label="Referencia de Pago">
              <orb-text-input
                formControlName="paymentReference"
                >
              </orb-text-input>
            </orb-form-field>
          </div>

          <orb-form-field label="Notas del Pago">
            <orb-text-area
              formControlName="paymentNotes"
              
              [rows]="3">
            </orb-text-area>
          </orb-form-field>
        </div>

        <!-- Payment Preview -->
        <div class="payment-preview">
          <h4><i class="fa fa-eye"></i> Vista Previa del Pago</h4>
          <div class="preview-grid">
            <div class="preview-item">
              <span class="label">Monto a Pagar:</span>
              <span class="value amount">{{ paymentForm.get('amount')?.value || 0 | currency:'EUR':'symbol':'1.2-2' }}</span>
            </div>
            <div class="preview-item">
              <span class="label">Nuevo Monto Pagado:</span>
              <span class="value">{{ (invoice.paidAmount + (paymentForm.get('amount')?.value || 0)) | currency:'EUR':'symbol':'1.2-2' }}</span>
            </div>
            <div class="preview-item">
              <span class="label">Nuevo Monto Pendiente:</span>
              <span class="value">{{ (invoice.remainingAmount - (paymentForm.get('amount')?.value || 0)) | currency:'EUR':'symbol':'1.2-2' }}</span>
            </div>
            <div class="preview-item status">
              <span class="label">Estado Resultante:</span>
              <span class="value" [class]="getResultingStatusClass()">
                {{ getResultingStatusLabel() }}
              </span>
            </div>
          </div>
        </div>

        <!-- Rewards Preview Section -->
        <div class="rewards-preview" *ngIf="clientRewards().length > 0">
          <h4><i class="fa fa-star"></i> Recompensas del Cliente</h4>
          <p class="rewards-subtitle">Progreso actual hacia recompensas disponibles</p>
          <div class="rewards-grid">
            <div class="reward-item" *ngFor="let reward of clientRewards()">
              <div class="reward-info">
                <div class="reward-header">
                  <span class="reward-name">{{ reward.rewardProgram?.name }}</span>
                  <p-tag
                    [value]="getRewardStatusLabel(reward.status)"
                    [severity]="getRewardStatusSeverity(reward.status)">
                  </p-tag>
                </div>
                <p class="reward-description">{{ reward.rewardProgram?.description }}</p>
                <div class="progress-container">
                  <div class="progress-info">
                    <span class="progress-text">
                      {{ reward.currentProgress || 0 }} / {{ reward.targetValue || 0 }}
                    </span>
                    <span class="progress-percentage">
                      {{ getProgressPercentage(reward) }}%
                    </span>
                  </div>
                  <p-progressBar
                    [value]="getProgressPercentage(reward)"
                    styleClass="reward-progress">
                  </p-progressBar>
                </div>
                <div class="reward-value" *ngIf="reward.rewardProgram">
                  <i class="fa fa-gift"></i>
                  <span>{{ getRewardValueDisplay(reward) }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="rewards-note" *ngIf="getEstimatedPointsFromPayment() > 0">
            <i class="fa fa-info-circle"></i>
            <span>Este pago podría otorgar aproximadamente <strong>{{ getEstimatedPointsFromPayment() }} puntos</strong> adicionales</span>
          </div>
        </div>

        <!-- Form Footer -->
        <orb-form-footer 
          [buttons]="footerActions"
          alignment="right"
          (actionClicked)="onActionClicked($event)">
        </orb-form-footer>
      </form>
    </div>

    <p-toast></p-toast>

    <!-- Rewards Result Modal -->
    <p-dialog
      [(visible)]="showRewardsResult"
      header="¡Recompensas Obtenidas!"
      [modal]="true"
      [closable]="true"
      [resizable]="false"
      [draggable]="false"
      styleClass="rewards-result-modal"
      [style]="{width: '550px', minHeight: '400px'}">

      <div class="rewards-result" *ngIf="lastRewardResponse()">
        <div class="celebration-section">
          <div class="celebration-icon">
            <i class="fa fa-trophy fa-3x text-warning"></i>
          </div>
          <h3>¡Felicitaciones!</h3>
          <p>El pago ha sido procesado exitosamente y se han otorgado recompensas</p>
        </div>

        <div class="rewards-summary">
          <div class="reward-stats">
            <div class="stat-item" *ngIf="lastRewardResponse()!.pointsEarned > 0">
              <div class="stat-icon">
                <i class="fa fa-coins"></i>
              </div>
              <div class="stat-content">
                <span class="stat-value">{{ lastRewardResponse()!.pointsEarned }}</span>
                <span class="stat-label">Puntos Ganados</span>
              </div>
            </div>

            <div class="stat-item" *ngIf="lastRewardResponse()!.rewardsUnlocked > 0">
              <div class="stat-icon">
                <i class="fa fa-gift"></i>
              </div>
              <div class="stat-content">
                <span class="stat-value">{{ lastRewardResponse()!.rewardsUnlocked }}</span>
                <span class="stat-label">Recompensas Desbloqueadas</span>
              </div>
            </div>
          </div>

          <div class="updated-rewards" *ngIf="updatedClientRewards().length > 0">
            <h4><i class="fa fa-star"></i> Estado Actual de Recompensas</h4>
            <div class="reward-list">
              <div class="reward-update" *ngFor="let reward of updatedClientRewards()">
                <div class="reward-header">
                  <span class="reward-name">{{ reward.rewardProgram?.name }}</span>
                  <p-tag
                    [value]="getRewardStatusLabel(reward.status)"
                    [severity]="getRewardStatusSeverity(reward.status)">
                  </p-tag>
                </div>
                <div class="progress-container">
                  <div class="progress-info">
                    <span class="progress-text">
                      {{ reward.currentProgress || 0 }} / {{ reward.targetValue || 0 }}
                    </span>
                    <span class="progress-percentage">{{ getProgressPercentage(reward) }}%</span>
                  </div>
                  <p-progressBar
                    [value]="getProgressPercentage(reward)"
                    styleClass="reward-progress">
                  </p-progressBar>
                </div>
                <div class="reward-value" *ngIf="reward.rewardProgram">
                  <i class="fa fa-gift"></i>
                  <span>{{ getRewardValueDisplay(reward) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ng-template pTemplate="footer">
        <orb-button
          label="Continuar"
          (clicked)="closeRewardsResult()"
          variant="primary"
          icon="fa fa-check">
        </orb-button>
      </ng-template>
    </p-dialog>
  `,
  styleUrls: ['./payment-form.component.scss']
})
export class PaymentFormComponent implements OnInit {
  @Input() invoice?: InvoiceResponseDto;
  @Output() saved = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private invoicesService = inject(InvoicesService);
  private rewardsService = inject(RewardsService);
  private messageService = inject(MessageService);

  paymentForm!: FormGroup;
  loading = signal(false);
  today = new Date();

  // Nuevas propiedades para recompensas
  clientRewards = signal<CustomerRewardResponseDto[]>([]);
  updatedClientRewards = signal<CustomerRewardResponseDto[]>([]);
  showRewardsResult = signal(false);
  lastRewardResponse = signal<PurchaseCompletedResponseDto | null>(null);

  paymentMethodOptions = [
    { label: 'Efectivo', value: 'cash' },
    { label: 'Tarjeta', value: 'card' },
    { label: 'Transferencia', value: 'transfer' },
    { label: 'Cheque', value: 'check' },
    { label: 'Otro', value: 'other' }
  ];

  footerActions: FormButtonAction[] = [
    { label: 'Cancelar', action: 'cancel', styleType: 'p-button-text', severity: 'secondary' },
    { label: 'Procesar Pago', action: 'save', styleType: 'p-button-success', buttonType: 'submit', severity: 'info' }
  ];

  ngOnInit(): void {
    this.initForm();
    this.loadClientRewards();
  }

  private initForm(): void {
    const remainingAmount = this.invoice?.remainingAmount || 0;
    
    this.paymentForm = this.fb.group({
      amount: [remainingAmount, [Validators.required, Validators.min(0.01), Validators.max(remainingAmount)]],
      paymentMethod: ['', Validators.required],
      paymentDate: [this.today],
      paymentReference: [''],
      paymentNotes: ['']
    });

    // Update validators when amount changes
    this.paymentForm.get('amount')?.valueChanges.subscribe(value => {
      const maxAmount = this.invoice?.remainingAmount || 0;
      this.paymentForm.get('amount')?.setValidators([
        Validators.required,
        Validators.min(0.01),
        Validators.max(maxAmount)
      ]);
      this.paymentForm.get('amount')?.updateValueAndValidity({ emitEvent: false });
    });
  }

  getResultingStatusLabel(): string {
    const paymentAmount = this.paymentForm.get('amount')?.value || 0;
    const remainingAfterPayment = (this.invoice?.remainingAmount || 0) - paymentAmount;
    
    if (remainingAfterPayment <= 0) {
      return 'Pagada Completamente';
    } else {
      return 'Pago Parcial';
    }
  }

  getResultingStatusClass(): string {
    const paymentAmount = this.paymentForm.get('amount')?.value || 0;
    const remainingAfterPayment = (this.invoice?.remainingAmount || 0) - paymentAmount;
    
    if (remainingAfterPayment <= 0) {
      return 'status-paid';
    } else {
      return 'status-partial';
    }
  }

  onSubmit(): void {
    if (this.paymentForm.invalid || !this.invoice) {
      this.paymentForm.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario incompleto',
        detail: 'Por favor, completa todos los campos requeridos'
      });
      return;
    }

    this.loading.set(true);

    const formValue = this.paymentForm.value;
    const paymentData: ProcessPaymentDto = {
      amount: formValue.amount,
      paymentMethod: formValue.paymentMethod,
      paymentDate: formValue.paymentDate ? formValue.paymentDate.toISOString() : undefined,
      paymentReference: formValue.paymentReference || undefined,
      paymentNotes: formValue.paymentNotes || undefined
    };

    this.invoicesService.invoiceControllerProcessPayment({
      id: this.invoice.id,
      body: paymentData
    }).subscribe({
      next: (response) => {
        const isFullyPaid = response.remainingAmount <= 0;

        // Si la factura está completamente pagada, procesar recompensas automáticamente
        if (isFullyPaid && (response.client as any)?.id) {
          this.processRewardsForPaidInvoice(response);
        } else {
          this.showPaymentSuccessMessage(response);
        }
      },
      error: (error) => {
        console.error('Error processing payment:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al procesar el pago. Por favor, intenta nuevamente.'
        });
        this.loading.set(false);
      }
    });
  }

  onActionClicked(action: string): void {
    if (action === 'cancel') {
      this.cancel.emit();
    } else if (action === 'save') {
      this.onSubmit();
    }
  }

  // Helper methods for quick amount setting
  setFullAmount(): void {
    if (this.invoice) {
      this.paymentForm.patchValue({
        amount: this.invoice.remainingAmount
      });
    }
  }

  setHalfAmount(): void {
    if (this.invoice) {
      this.paymentForm.patchValue({
        amount: this.invoice.remainingAmount / 2
      });
    }
  }

  // Helper method for client data
  getClientName(invoice: InvoiceResponseDto): string {
    return (invoice.client as any)?.name || 'Cliente no encontrado';
  }

  /**
   * Procesa automáticamente las recompensas cuando una factura se paga completamente
   */
  processRewardsForPaidInvoice(paidInvoice: InvoiceResponseDto): void {
    const clientId = (paidInvoice.client as any)?.id;
    if (!clientId) {
      this.showPaymentSuccessMessage(paidInvoice);
      return;
    }

    // Preparar datos para trigger de recompensas
    const rewardsData: TriggerPurchaseCompletedDto = {
      clientId: clientId,
      invoiceId: paidInvoice.id,
      purchaseAmount: paidInvoice.total,
      paymentMethod: this.paymentForm.value.paymentMethod,
      paymentDate: this.paymentForm.value.paymentDate?.toISOString() || new Date().toISOString(),
      items: paidInvoice.items?.map(item => ({
        serviceId: (item as any).productId || (item as any).serviceId || item.itemId || 1,
        quantity: item.quantity || 1,
        amount: item.total || item.unitPrice || 0
      })) || []
    };

    // Procesar recompensas automáticamente
    this.rewardsService.rewardsControllerTriggerPurchaseCompleted({ body: rewardsData }).subscribe({
      next: (rewardResponse) => {
        // Guardar respuesta para mostrar en el modal
        this.lastRewardResponse.set(rewardResponse);

        // Recargar recompensas actualizadas del cliente
        this.loadClientRewards().then(() => {
          // Actualizar la lista de recompensas para el modal
          this.updatedClientRewards.set(this.clientRewards());

          // Mostrar modal de resultados
          this.showRewardsResult.set(true);

          this.saved.emit();
          this.loading.set(false);
        });
      },
      error: (rewardError) => {
        console.error('Error processing rewards:', rewardError);

        // Mostrar mensaje de éxito del pago pero advertencia sobre recompensas
        this.messageService.add({
          severity: 'warn',
          summary: 'Pago Procesado - Error en Recompensas',
          detail: 'El pago fue procesado exitosamente, pero hubo un problema al procesar las recompensas. Puedes aplicarlas manualmente.'
        });

        this.saved.emit();
        this.loading.set(false);
      }
    });
  }

  /**
   * Muestra mensaje de éxito para pagos que no activan recompensas
   */
  showPaymentSuccessMessage(response: InvoiceResponseDto): void {
    const isFullyPaid = response.remainingAmount <= 0;

    this.messageService.add({
      severity: 'success',
      summary: 'Pago Procesado',
      detail: isFullyPaid
        ? 'El pago ha sido procesado exitosamente. La factura está completamente pagada.'
        : `El pago ha sido procesado exitosamente. Monto pendiente: ${response.remainingAmount.toFixed(2)}€`
    });

    this.saved.emit();
    this.loading.set(false);
  }

  // Nuevos métodos para el sistema de recompensas

  private async loadClientRewards(): Promise<void> {
    const clientId = (this.invoice?.client as any)?.id;
    if (!clientId) {
      return;
    }

    try {
      const rewards = await this.rewardsService.rewardsControllerGetClientActiveRewards({ clientId }).toPromise();
      this.clientRewards.set(rewards || []);
    } catch (error) {
      console.error('Error loading client rewards:', error);
      this.clientRewards.set([]);
    }
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

  getRewardValueDisplay(reward: CustomerRewardResponseDto): string {
    if (!reward.rewardProgram?.rewardValue) return '';

    const value = reward.rewardProgram.rewardValue;
    const type = reward.rewardProgram.rewardType;

    switch (type) {
      case 'DISCOUNT_PERCENTAGE':
        return `${value}% descuento`;
      case 'DISCOUNT_AMOUNT':
        return `${value}€ descuento`;
      case 'FREE_SERVICE':
        return 'Servicio gratis';
      case 'POINTS':
        return `${value} puntos`;
      default:
        return value.toString();
    }
  }

  getEstimatedPointsFromPayment(): number {
    // Estimación simple: 1 punto por cada euro
    // En un sistema real, esto vendría de la configuración del programa de recompensas
    const paymentAmount = this.paymentForm.get('amount')?.value || 0;
    return Math.floor(paymentAmount);
  }

  closeRewardsResult(): void {
    this.showRewardsResult.set(false);
    this.lastRewardResponse.set(null);
  }
}