import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// PrimeNG Components
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { InputNumberModule } from 'primeng/inputnumber';

// Orb Components
import { OrbButtonComponent, OrbTextInputComponent, OrbFormFieldComponent, OrbFormFooterComponent, OrbSelectComponent, OrbDatepickerComponent, OrbTextAreaComponent } from '@orb-components';

// Services and Models
import { InvoicesService } from '../../../api/services/invoices.service';
import { InvoiceResponseDto } from '../../../api/models/invoice-response-dto';
import { ProcessPaymentDto } from '../../../api/models/process-payment-dto';
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
    OrbTextInputComponent,
    OrbFormFieldComponent,
    OrbFormFooterComponent,
    OrbSelectComponent,
    OrbDatepickerComponent,
    OrbTextAreaComponent,
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

        <!-- Form Footer -->
        <orb-form-footer 
          [buttons]="footerActions"
          alignment="right"
          (actionClicked)="onActionClicked($event)">
        </orb-form-footer>
      </form>
    </div>

    <p-toast></p-toast>
  `,
  styleUrls: ['./payment-form.component.scss']
})
export class PaymentFormComponent implements OnInit {
  @Input() invoice?: InvoiceResponseDto;
  @Output() saved = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private invoicesService = inject(InvoicesService);
  private messageService = inject(MessageService);

  paymentForm!: FormGroup;
  loading = signal(false);
  today = new Date();

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
        this.messageService.add({
          severity: 'success',
          summary: 'Pago Procesado',
          detail: isFullyPaid 
            ? 'El pago ha sido procesado exitosamente. La factura está completamente pagada.'
            : `El pago ha sido procesado exitosamente. Monto pendiente: ${response.remainingAmount.toFixed(2)}€`
        });
        this.saved.emit();
        this.loading.set(false);
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
}