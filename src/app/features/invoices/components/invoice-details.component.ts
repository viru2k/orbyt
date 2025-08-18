import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

// PrimeNG Components
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';

// Orb Components
import { OrbButtonComponent } from '@orb-components';

// Services and Models
import { InvoiceResponseDto } from '../../../api/models/invoice-response-dto';
import { InvoiceItemResponseDto } from '../../../api/models/invoice-item-response-dto';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-invoice-details',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    TagModule,
    TableModule,
    DividerModule,
    ToastModule,
    OrbButtonComponent,
  ],
  providers: [MessageService],
  template: `
    <div class="invoice-details-container" *ngIf="invoice">
      <!-- Header Section -->
      <div class="invoice-header">
        <div class="header-left">
          <h2>
            <i class="fa fa-file-invoice"></i>
            {{ invoice.invoiceNumber }}
          </h2>
          <p-tag 
            [value]="getStatusLabel(invoice.status)" 
            [severity]="getStatusSeverity(invoice.status)"
            [rounded]="true">
          </p-tag>
        </div>
        <div class="header-actions">
          <orb-button
            *ngIf="invoice.status !== 'paid' && invoice.status !== 'cancelled'"
            label="Editar"
            icon="fa fa-edit"
            (clicked)="onEdit()"
            variant="secondary">
          </orb-button>
          <orb-button
            *ngIf="!invoice.isPaid"
            label="Procesar Pago"
            icon="fa fa-credit-card"
            (clicked)="onProcessPayment()"
            variant="success">
          </orb-button>
          <orb-button
            label="Descargar PDF"
            icon="fa fa-download"
            (clicked)="onDownloadPDF()"
            variant="info">
          </orb-button>
        </div>
      </div>

      <!-- Client and Invoice Info -->
      <div class="info-grid">
        <div class="info-section">
          <h3><i class="fa fa-user"></i> Información del Cliente</h3>
          <div class="info-content">
            <div class="info-row">
              <span class="label">Nombre:</span>
              <span class="value">{{ getClientName(invoice) }}</span>
            </div>
            <div class="info-row" *ngIf="getClientEmail(invoice)">
              <span class="label">Email:</span>
              <span class="value">{{ getClientEmail(invoice) }}</span>
            </div>
            <div class="info-row" *ngIf="getClientPhone(invoice)">
              <span class="label">Teléfono:</span>
              <span class="value">{{ getClientPhone(invoice) }}</span>
            </div>
            <div class="info-row" *ngIf="getClientAddress(invoice)">
              <span class="label">Dirección:</span>
              <span class="value">{{ getClientAddress(invoice) }}</span>
            </div>
          </div>
        </div>

        <div class="info-section">
          <h3><i class="fa fa-calendar"></i> Información de la Factura</h3>
          <div class="info-content">
            <div class="info-row">
              <span class="label">Fecha de Creación:</span>
              <span class="value">{{ formatDate(invoice.createdAt) }}</span>
            </div>
            <div class="info-row" *ngIf="invoice.dueDate">
              <span class="label">Fecha de Vencimiento:</span>
              <span class="value" [class.overdue]="isOverdue(invoice)">{{ formatDate(invoice.dueDate) }}</span>
            </div>
            <div class="info-row" *ngIf="invoice.paymentDate">
              <span class="label">Fecha de Pago:</span>
              <span class="value">{{ formatDate(invoice.paymentDate) }}</span>
            </div>
            <div class="info-row" *ngIf="invoice.paymentMethod">
              <span class="label">Método de Pago:</span>
              <span class="value">{{ getPaymentMethodLabel(invoice.paymentMethod) }}</span>
            </div>
            <div class="info-row" *ngIf="invoice.paymentReference">
              <span class="label">Referencia de Pago:</span>
              <span class="value">{{ invoice.paymentReference }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Items Table -->
      <div class="items-section">
        <h3><i class="fa fa-list"></i> Items de la Factura</h3>
        <p-table [value]="invoice.items" [scrollable]="true" scrollHeight="400px">
          <ng-template pTemplate="header">
            <tr>
              <th>Descripción</th>
              <th>Tipo</th>
              <th>Cantidad</th>
              <th>Precio Unitario</th>
              <th>Descuento</th>
              <th>Total</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-item>
            <tr>
              <td>
                <div class="item-description">
                  <strong>{{ item.description }}</strong>
                  <small *ngIf="item.notes" class="item-notes">{{ item.notes }}</small>
                </div>
              </td>
              <td>
                <p-tag 
                  [value]="getItemTypeLabel(item.itemType)" 
                  [severity]="item.itemType === 'service' ? 'info' : 'success'"
                  [rounded]="true">
                </p-tag>
              </td>
              <td>{{ item.quantity }}</td>
              <td>{{ item.unitPrice | currency:'EUR':'symbol':'1.2-2' }}</td>
              <td>
                <span *ngIf="item.discount > 0">
                  {{ item.discount }}{{ item.discountType === 'percentage' ? '%' : '€' }}
                </span>
                <span *ngIf="item.discount === 0">-</span>
              </td>
              <td><strong>{{ item.total | currency:'EUR':'symbol':'1.2-2' }}</strong></td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <!-- Totals Section -->
      <div class="totals-section">
        <div class="totals-card">
          <div class="total-row">
            <span class="label">Subtotal:</span>
            <span class="value">{{ invoice.subtotal | currency:'EUR':'symbol':'1.2-2' }}</span>
          </div>
          <div class="total-row" *ngIf="invoice.discount > 0">
            <span class="label">
              Descuento ({{ invoice.discount }}{{ invoice.discountType === 'percentage' ? '%' : '€' }}):
            </span>
            <span class="value discount">-{{ getDiscountAmount() | currency:'EUR':'symbol':'1.2-2' }}</span>
          </div>
          <div class="total-row" *ngIf="invoice.tax > 0">
            <span class="label">IVA ({{ invoice.taxRate }}%):</span>
            <span class="value">{{ invoice.tax | currency:'EUR':'symbol':'1.2-2' }}</span>
          </div>
          <p-divider></p-divider>
          <div class="total-row final-total">
            <span class="label"><strong>Total:</strong></span>
            <span class="value"><strong>{{ invoice.total | currency:'EUR':'symbol':'1.2-2' }}</strong></span>
          </div>
        </div>
      </div>

      <!-- Payment Status -->
      <div class="payment-section" *ngIf="invoice.isPaid || invoice.paidAmount > 0">
        <h3><i class="fa fa-credit-card"></i> Estado de Pago</h3>
        <div class="payment-info">
          <div class="payment-grid">
            <div class="payment-item">
              <span class="payment-label">Monto Pagado:</span>
              <span class="payment-value paid">{{ invoice.paidAmount | currency:'EUR':'symbol':'1.2-2' }}</span>
            </div>
            <div class="payment-item">
              <span class="payment-label">Monto Pendiente:</span>
              <span class="payment-value pending">{{ invoice.remainingAmount | currency:'EUR':'symbol':'1.2-2' }}</span>
            </div>
            <div class="payment-item" *ngIf="invoice.paymentDate">
              <span class="payment-label">Fecha de Pago:</span>
              <span class="payment-value">{{ formatDate(invoice.paymentDate) }}</span>
            </div>
            <div class="payment-item" *ngIf="invoice.paymentMethod">
              <span class="payment-label">Método:</span>
              <span class="payment-value">{{ getPaymentMethodLabel(invoice.paymentMethod) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Notes Section -->
      <div class="notes-section" *ngIf="invoice.notes || invoice.paymentNotes">
        <div class="notes-grid">
          <div class="note-item" *ngIf="invoice.notes">
            <h4><i class="fa fa-sticky-note"></i> Notas de la Factura</h4>
            <p>{{ invoice.notes }}</p>
          </div>
          <div class="note-item" *ngIf="invoice.paymentNotes">
            <h4><i class="fa fa-comment-dollar"></i> Notas de Pago</h4>
            <p>{{ invoice.paymentNotes }}</p>
          </div>
        </div>
      </div>
    </div>

    <p-toast></p-toast>
  `,
  styleUrls: ['./invoice-details.component.scss']
})
export class InvoiceDetailsComponent {
  @Input() invoice?: InvoiceResponseDto;
  @Output() edit = new EventEmitter<InvoiceResponseDto>();
  @Output() processPayment = new EventEmitter<InvoiceResponseDto>();
  @Output() downloadPDF = new EventEmitter<InvoiceResponseDto>();

  private messageService = inject(MessageService);

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  isOverdue(invoice: InvoiceResponseDto): boolean {
    if (!invoice.dueDate) return false;
    return new Date(invoice.dueDate) < new Date() && !invoice.isPaid;
  }

  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      'draft': 'Borrador',
      'pending': 'Pendiente',
      'paid': 'Pagada',
      'cancelled': 'Cancelada',
      'overdue': 'Vencida'
    };
    return statusMap[status] || status;
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' {
    const severityMap: { [key: string]: 'success' | 'info' | 'warning' | 'danger' } = {
      'draft': 'info',
      'pending': 'warning',
      'paid': 'success',
      'cancelled': 'danger',
      'overdue': 'danger'
    };
    return severityMap[status] || 'info';
  }

  getPaymentMethodLabel(method: string): string {
    const methodMap: { [key: string]: string } = {
      'cash': 'Efectivo',
      'card': 'Tarjeta',
      'transfer': 'Transferencia',
      'check': 'Cheque',
      'other': 'Otro'
    };
    return methodMap[method] || method;
  }

  getItemTypeLabel(type: string): string {
    return type === 'service' ? 'Servicio' : 'Producto';
  }

  getDiscountAmount(): number {
    if (!this.invoice) return 0;
    
    if (this.invoice.discountType === 'percentage') {
      return this.invoice.subtotal * this.invoice.discount / 100;
    } else {
      return this.invoice.discount;
    }
  }

  onEdit(): void {
    if (this.invoice) {
      this.edit.emit(this.invoice);
    }
  }

  onProcessPayment(): void {
    if (this.invoice) {
      this.processPayment.emit(this.invoice);
    }
  }

  onDownloadPDF(): void {
    if (this.invoice) {
      this.downloadPDF.emit(this.invoice);
      this.messageService.add({
        severity: 'info',
        summary: 'Descarga',
        detail: `Descargando PDF de factura ${this.invoice.invoiceNumber}...`
      });
    }
  }

  // Helper methods for client data
  getClientName(invoice: InvoiceResponseDto): string {
    return (invoice.client as any)?.name || 'Cliente no encontrado';
  }

  getClientEmail(invoice: InvoiceResponseDto): string {
    return (invoice.client as any)?.email || '';
  }

  getClientPhone(invoice: InvoiceResponseDto): string {
    return (invoice.client as any)?.phone || '';
  }

  getClientAddress(invoice: InvoiceResponseDto): string {
    return (invoice.client as any)?.address || '';
  }
}