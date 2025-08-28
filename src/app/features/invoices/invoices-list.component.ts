import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ChartModule } from 'primeng/chart';
import { MessageService, ConfirmationService } from 'primeng/api';
import { OrbActionsPopoverComponent, OrbTableComponent, OrbCardComponent, OrbButtonComponent, OrbDialogComponent } from '@orb-components';

import { InvoicesService } from '../../api/services/invoices.service';
import { InvoiceResponseDto } from '../../api/models/invoice-response-dto';
import { TableColumn, OrbActionItem } from '@orb-models';
import { InvoiceStore } from './store/invoice.store';
import { InvoiceFormComponent } from './components/invoice-form.component';
import { InvoiceDetailsComponent } from './components/invoice-details.component';
import { PaymentFormComponent } from './components/payment-form.component';

@Component({
  selector: 'app-invoices-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    TagModule,
    DialogModule,
    ToastModule,
    ConfirmDialogModule,
    ChartModule,
    OrbActionsPopoverComponent,
    OrbTableComponent,
    OrbCardComponent,
    OrbButtonComponent,
    OrbDialogComponent,
    InvoiceFormComponent,
    InvoiceDetailsComponent,
    PaymentFormComponent
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <orb-card>
      <div orbHeader>
        <h2><i class="fa fa-file-invoice-dollar"></i> Gestión de Facturas</h2>
        <div class="header-actions">
          <orb-button 
            label="Nueva Factura" 
            icon="fa fa-plus" 
            (clicked)="openNewInvoiceDialog()"
            variant="success">
          </orb-button>
          <orb-button 
            label="Estadísticas" 
            icon="fa fa-chart-line" 
            (clicked)="viewStats()"
            variant="secondary">
          </orb-button>
        </div>
      </div>

      <div orbBody>
        <div class="stats-cards">
          <div class="stat-card">
            <div class="stat-content">
              <div class="stat-icon">
                <i class="fa fa-money-bill-wave"></i>
              </div>
              <div class="stat-details">
                <h3>{{ invoiceStore.totalRevenue() | currency:'EUR':'symbol':'1.2-2' }}</h3>
                <p>Ingresos Totales</p>
              </div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-content">
              <div class="stat-icon pending">
                <i class="fa fa-clock"></i>
              </div>
              <div class="stat-details">
                <h3>{{ invoiceStore.pendingInvoices() }}</h3>
                <p>Facturas Pendientes</p>
              </div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-content">
              <div class="stat-icon overdue">
                <i class="fa fa-exclamation-triangle"></i>
              </div>
              <div class="stat-details">
                <h3>{{ invoiceStore.overdueInvoices() }}</h3>
                <p>Facturas Vencidas</p>
              </div>
            </div>
          </div>
        </div>

        <div class="filters-section">
          <div class="filters-grid">
            <div class="filter-item">
              <label>Estado:</label>
              <p-dropdown 
                [options]="statusOptions" 
                [(ngModel)]="selectedStatus"                
                optionLabel="label"
                optionValue="value"
                [showClear]="true"
                (onChange)="loadInvoices()">
              </p-dropdown>
            </div>
            <div class="filter-item">
              <label>Buscar:</label>
              <span class="p-input-icon-left">
                <i class="fa fa-search"></i>
                <input 
                  type="text" 
                  pInputText 
                  [(ngModel)]="searchTerm"
                  (input)="onSearch()">
              </span>
            </div>
          </div>
        </div>

        <orb-table
          [value]="invoiceStore.filteredInvoices()"
          [columns]="columns"
          [loading]="invoiceStore.loading()"
          [rowActions]="actions"
          [paginator]="true"
          [rows]="10"
          [rowsPerPageOptions]="[10, 25, 50]"
        >
          <ng-template pTemplate="body" let-invoice let-columns="columns">
            <tr>
              <td *ngFor="let col of columns">
                <ng-container [ngSwitch]="col.field">
                  <ng-container *ngSwitchCase="'actions'">
                    <orb-actions-popover
                      [actions]="actions"
                      [itemData]="invoice">
                    </orb-actions-popover>
                  </ng-container>
                  
                  <ng-container *ngSwitchCase="'invoiceNumber'">
                    <strong>{{ invoice.invoiceNumber }}</strong>
                  </ng-container>
                  
                  <ng-container *ngSwitchCase="'client'">
                    <div class="client-info">
                      <strong>{{ getClientName(invoice) }}</strong>
                      <small>{{ getClientEmail(invoice) }}</small>
                    </div>
                  </ng-container>
                  
                  <ng-container *ngSwitchCase="'createdAt'">
                    <div class="date-info">
                      <div>{{ formatDate(invoice.createdAt) }}</div>
                      <small *ngIf="invoice.dueDate" [class.overdue]="isOverdue(invoice)">
                        Vence: {{ formatDate(invoice.dueDate) }}
                      </small>
                    </div>
                  </ng-container>
                  
                  <ng-container *ngSwitchCase="'total'">
                    <strong class="amount">{{ invoice.total | currency:'EUR':'symbol':'1.2-2' }}</strong>
                  </ng-container>
                  
                  <ng-container *ngSwitchCase="'status'">
                    <p-tag 
                      [value]="getStatusLabel(invoice.status)" 
                      [severity]="getStatusSeverity(invoice.status)">
                    </p-tag>
                  </ng-container>
                  
                  <ng-container *ngSwitchCase="'paidAmount'">
                    <span class="amount paid">{{ invoice.paidAmount | currency:'EUR':'symbol':'1.2-2' }}</span>
                  </ng-container>
                  
                  <ng-container *ngSwitchCase="'remainingAmount'">
                    <span class="amount pending">{{ invoice.remainingAmount | currency:'EUR':'symbol':'1.2-2' }}</span>
                  </ng-container>
                  
                  <ng-container *ngSwitchDefault>
                    {{ invoice[col.field] }}
                  </ng-container>
                </ng-container>
              </td>
            </tr>
          </ng-template>
        </orb-table>
      </div>
    </orb-card>

    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>

    <!-- Statistics Modal -->
    <orb-dialog
      [visible]="displayStatsModal()"
      (visibleChange)="displayStatsModal.set($event)"
      header="📊 Estadísticas de Facturas"
      size="xl"
      (onHide)="onStatsModalClose()"
    >
      <div class="stats-modal-content">
        <!-- Summary Cards -->
        <div class="stats-summary-grid">
          <div class="summary-card">
            <div class="summary-icon">💰</div>
            <div class="summary-details">
              <h3>{{ invoiceStore.totalRevenue() | currency:'EUR':'symbol':'1.2-2' }}</h3>
              <p>Ingresos Totales</p>
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-icon">📋</div>
            <div class="summary-details">
              <h3>{{ invoiceStore.totalInvoices() }}</h3>
              <p>Total Facturas</p>
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-icon">⏰</div>
            <div class="summary-details">
              <h3>{{ invoiceStore.pendingInvoices() }}</h3>
              <p>Pendientes</p>
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-icon">⚠️</div>
            <div class="summary-details">
              <h3>{{ invoiceStore.overdueInvoices() }}</h3>
              <p>Vencidas</p>
            </div>
          </div>
        </div>

        <!-- Charts Section -->
        <div class="charts-section">
          <div class="chart-container">
            <h4>Estado de Facturas</h4>
            <p-chart 
              type="doughnut" 
              [data]="statusChartData" 
              [options]="chartOptions"
              width="300"
              height="300">
            </p-chart>
          </div>
          
          <div class="chart-container">
            <h4>Ingresos por Mes</h4>
            <p-chart 
              type="bar" 
              [data]="revenueChartData" 
              [options]="barChartOptions"
              [width]="'400'"
              [height]="'300'">
            </p-chart>
          </div>
        </div>

        <!-- Additional Stats -->
        <div class="additional-stats">
          <div class="stat-row">
            <span class="stat-label">Factura Promedio:</span>
            <span class="stat-value">{{ getAverageInvoiceAmount() | currency:'EUR':'symbol':'1.2-2' }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Tasa de Pago:</span>
            <span class="stat-value">{{ getPaymentRate() }}%</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Tiempo Promedio de Pago:</span>
            <span class="stat-value">{{ getAveragePaymentTime() }} días</span>
          </div>
        </div>
      </div>
    </orb-dialog>

    <!-- Invoice Form Modal -->
    <orb-dialog
      [visible]="displayInvoiceFormModal()"
      (visibleChange)="displayInvoiceFormModal.set($event)"
      [header]="isEditMode ? '✏️ Editar Factura' : '➕ Nueva Factura'"
      size="xl"
      (onHide)="onInvoiceFormModalClose()"
    >
      <app-invoice-form
        [invoice]="selectedInvoiceForEdit"
        (saved)="onInvoiceSaved()"
        (cancel)="onInvoiceFormModalClose()">
      </app-invoice-form>
    </orb-dialog>

    <!-- Invoice Details Modal -->
    <orb-dialog
      [visible]="displayInvoiceDetailsModal()"
      (visibleChange)="displayInvoiceDetailsModal.set($event)"
      header="📄 Detalles de Factura"
      size="xl"
      (onHide)="onInvoiceDetailsModalClose()"
    >
      <app-invoice-details
        [invoice]="selectedInvoiceForView"
        (edit)="onEditFromDetails($event)"
        (processPayment)="onProcessPaymentFromDetails($event)"
        (downloadPDF)="downloadPDF($event)">
      </app-invoice-details>
    </orb-dialog>

    <!-- Payment Form Modal -->
    <orb-dialog
      [visible]="displayPaymentFormModal()"
      (visibleChange)="displayPaymentFormModal.set($event)"
      header="💳 Procesar Pago"
      size="lg"
      (onHide)="onPaymentFormModalClose()"
    >
      <app-payment-form
        [invoice]="selectedInvoiceForPayment"
        (saved)="onPaymentProcessed()"
        (cancel)="onPaymentFormModalClose()">
      </app-payment-form>
    </orb-dialog>
  `,
  styleUrls: ['./invoices-list.component.scss']
})
export class InvoicesListComponent implements OnInit {
  selectedStatus: string | null = null;
  searchTerm = '';

  // Modal states
  displayStatsModal = signal(false);
  displayInvoiceFormModal = signal(false);
  displayInvoiceDetailsModal = signal(false);
  displayPaymentFormModal = signal(false);

  // Selected invoices for modals
  selectedInvoiceForEdit: InvoiceResponseDto | undefined;
  selectedInvoiceForView: InvoiceResponseDto | undefined;
  selectedInvoiceForPayment: InvoiceResponseDto | undefined;
  isEditMode = false;

  // Chart Data
  statusChartData: any = {};
  revenueChartData: any = {};
  chartOptions: any = {};
  barChartOptions: any = {};

  statusOptions = [
    { label: 'Borrador', value: 'draft' },
    { label: 'Pendiente', value: 'pending' },
    { label: 'Pagada', value: 'paid' },
    { label: 'Cancelada', value: 'cancelled' },
    { label: 'Vencida', value: 'overdue' }
  ];

  // Columnas de la tabla
  columns: TableColumn[] = [
    { field: 'invoiceNumber', header: 'Número', sortable: true },
    { field: 'client', header: 'Cliente', sortable: true },
    { field: 'createdAt', header: 'Fecha', sortable: true },
    { field: 'total', header: 'Total', sortable: true },
    { field: 'status', header: 'Estado', sortable: true },
    { field: 'paidAmount', header: 'Pagado', sortable: true },
    { field: 'remainingAmount', header: 'Pendiente', sortable: true },
    { field: 'actions', header: '', sortable: false , width: '10px' }
  ];

  // Acciones del popover
  actions: OrbActionItem<InvoiceResponseDto>[] = [
    {
      label: 'Ver Detalles',
      icon: 'fas fa-eye',
      action: (item?: InvoiceResponseDto) => item && this.viewInvoice(item)
    },
    {
      label: 'Editar',
      icon: 'fas fa-edit',
      action: (item?: InvoiceResponseDto) => item && this.editInvoice(item),
      visible: (item?: InvoiceResponseDto) => item?.status !== 'paid'
    },
    {
      label: 'Procesar Pago',
      icon: 'fas fa-credit-card',
      action: (item?: InvoiceResponseDto) => item && this.processPayment(item),
      visible: (item?: InvoiceResponseDto) => !item?.isPaid
    },
    {
      label: 'Descargar PDF',
      icon: 'fas fa-download',
      action: (item?: InvoiceResponseDto) => item && this.downloadPDF(item)
    },
    {
      label: 'Cancelar',
      icon: 'fas fa-times-circle',
      action: (item?: InvoiceResponseDto) => item && this.confirmCancelInvoice(item),
      visible: (item?: InvoiceResponseDto) => item?.status !== 'paid' && item?.status !== 'cancelled'
    }
  ];

  constructor(
    private invoicesService: InvoicesService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    public invoiceStore: InvoiceStore
  ) {}

  ngOnInit() {
    this.loadInvoices();
    this.initializeChartOptions();
  }

  loadInvoices() {
    const params: any = {};
    if (this.selectedStatus) {
      params.status = this.selectedStatus;
    }
    if (this.searchTerm) {
      params.search = this.searchTerm;
    }

    this.invoiceStore.loadInvoices(params);
    this.invoiceStore.loadStats();
  }

  onSearch() {
    this.invoiceStore.setFilters({ search: this.searchTerm });
    setTimeout(() => {
      this.loadInvoices();
    }, 300);
  }

  openNewInvoiceDialog() {
    this.isEditMode = false;
    this.selectedInvoiceForEdit = undefined;
    this.displayInvoiceFormModal.set(true);
  }

  viewStats() {
    this.updateChartData();
    this.displayStatsModal.set(true);
  }

  viewInvoice(invoice: InvoiceResponseDto) {
    this.selectedInvoiceForView = invoice;
    this.displayInvoiceDetailsModal.set(true);
  }

  editInvoice(invoice: InvoiceResponseDto) {
    this.isEditMode = true;
    this.selectedInvoiceForEdit = invoice;
    this.displayInvoiceFormModal.set(true);
  }

  processPayment(invoice: InvoiceResponseDto) {
    this.selectedInvoiceForPayment = invoice;
    this.displayPaymentFormModal.set(true);
  }

  downloadPDF(invoice: InvoiceResponseDto) {
    // TODO: Implementar descarga de PDF
    console.log('Downloading PDF for invoice:', invoice);
    this.messageService.add({
      severity: 'info',
      summary: 'Descarga',
      detail: `Descargando PDF de factura ${invoice.invoiceNumber}...`
    });
  }

  confirmCancelInvoice(invoice: InvoiceResponseDto): void {
    this.confirmationService.confirm({
      message: `¿Estás seguro de que quieres cancelar la factura ${invoice.invoiceNumber}?`,
      header: 'Confirmar Cancelación',
      icon: 'fa fa-exclamation-triangle',
      acceptLabel: 'Sí, Cancelar',
      rejectLabel: 'No',
      accept: async () => {
        const result = await this.invoiceStore.cancelInvoice(invoice.id);
        if (result) {
          this.messageService.add({
            severity: 'success',
            summary: 'Cancelado',
            detail: `Factura ${invoice.invoiceNumber} cancelada exitosamente`
          });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al cancelar la factura'
          });
        }
      }
    });
  }

  // Modal event handlers
  onInvoiceFormModalClose(): void {
    this.displayInvoiceFormModal.set(false);
    this.selectedInvoiceForEdit = undefined;
    this.isEditMode = false;
  }

  onInvoiceDetailsModalClose(): void {
    this.displayInvoiceDetailsModal.set(false);
    this.selectedInvoiceForView = undefined;
  }

  onPaymentFormModalClose(): void {
    this.displayPaymentFormModal.set(false);
    this.selectedInvoiceForPayment = undefined;
  }

  onInvoiceSaved(): void {
    this.onInvoiceFormModalClose();
    this.loadInvoices();
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: this.isEditMode ? 'Factura actualizada exitosamente' : 'Factura creada exitosamente'
    });
  }

  onPaymentProcessed(): void {
    this.onPaymentFormModalClose();
    this.loadInvoices();
  }

  onEditFromDetails(invoice: InvoiceResponseDto): void {
    this.onInvoiceDetailsModalClose();
    this.editInvoice(invoice);
  }

  onProcessPaymentFromDetails(invoice: InvoiceResponseDto): void {
    this.onInvoiceDetailsModalClose();
    this.processPayment(invoice);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
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

  // Statistics Modal Methods
  onStatsModalClose(): void {
    this.displayStatsModal.set(false);
  }

  initializeChartOptions(): void {
    this.chartOptions = {
      plugins: {
        legend: {
          position: 'bottom'
        }
      },
      responsive: true,
      maintainAspectRatio: false
    };

    this.barChartOptions = {
      plugins: {
        legend: {
          display: false
        }
      },
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value: any) {
              return '€' + value.toLocaleString();
            }
          }
        }
      }
    };
  }

  updateChartData(): void {
    const invoices = this.invoiceStore.invoices();
    
    // Status Chart Data
    const statusCounts = {
      draft: invoices.filter(i => i.status === 'draft').length,
      pending: invoices.filter(i => i.status === 'pending').length,
      paid: invoices.filter(i => i.status === 'paid').length,
      cancelled: invoices.filter(i => i.status === 'cancelled').length,
      overdue: invoices.filter(i => i.status === 'overdue').length
    };

    this.statusChartData = {
      labels: ['Borrador', 'Pendiente', 'Pagada', 'Cancelada', 'Vencida'],
      datasets: [{
        data: [statusCounts.draft, statusCounts.pending, statusCounts.paid, statusCounts.cancelled, statusCounts.overdue],
        backgroundColor: [
          '#3b82f6', // blue
          '#f59e0b', // amber
          '#10b981', // emerald
          '#ef4444', // red
          '#f97316'  // orange
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };

    // Revenue Chart Data (last 6 months)
    const monthlyRevenue = this.getMonthlyRevenue(invoices);
    this.revenueChartData = {
      labels: monthlyRevenue.labels,
      datasets: [{
        label: 'Ingresos (€)',
        data: monthlyRevenue.data,
        backgroundColor: '#3b82f6',
        borderColor: '#1d4ed8',
        borderWidth: 2
      }]
    };
  }

  getMonthlyRevenue(invoices: InvoiceResponseDto[]): { labels: string[], data: number[] } {
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const now = new Date();
    const labels: string[] = [];
    const data: number[] = [];

    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(monthNames[date.getMonth()]);
      
      const monthRevenue = invoices
        .filter(invoice => {
          const invoiceDate = new Date(invoice.createdAt);
          return invoiceDate.getMonth() === date.getMonth() && 
                 invoiceDate.getFullYear() === date.getFullYear() &&
                 invoice.status === 'paid';
        })
        .reduce((sum, invoice) => sum + (invoice.total || 0), 0);
      
      data.push(monthRevenue);
    }

    return { labels, data };
  }

  getAverageInvoiceAmount(): number {
    return this.invoiceStore.averageInvoiceAmount();
  }

  getPaymentRate(): number {
    return this.invoiceStore.paymentRate();
  }

  getAveragePaymentTime(): number {
    const paidInvoices = this.invoiceStore.invoices().filter(i => i.status === 'paid' && i.dueDate);
    if (paidInvoices.length === 0) return 0;
    
    const totalDays = paidInvoices.reduce((sum, invoice) => {
      const created = new Date(invoice.createdAt);
      const due = new Date(invoice.dueDate!);
      const diffTime = due.getTime() - created.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return sum + diffDays;
    }, 0);
    
    return Math.round(totalDays / paidInvoices.length);
  }

  // Helper methods for client data
  getClientName(invoice: InvoiceResponseDto): string {
    return (invoice.client as any)?.name || 'Cliente no encontrado';
  }

  getClientEmail(invoice: InvoiceResponseDto): string {
    return (invoice.client as any)?.email || '';
  }
}