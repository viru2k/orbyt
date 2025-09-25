import { Injectable, inject } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { exhaustMap, tap, switchMap, catchError, of } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { linkToGlobalState } from '../component-state.reducer';
import { Store } from '@ngrx/store';
import { NotificationService } from '@orb-services';
import { NotificationSeverity } from '@orb-models';
import {
  InvoiceResponseDto,
  InvoiceItemResponseDto,
  SalesStatsResponseDto,
  CreateInvoiceDto,
  UpdateInvoiceDto,
  ProcessPaymentDto
} from '../../api/models';
import { InvoicesService } from '../../api/services/invoices.service';

export interface InvoicesState {
  // Invoices
  invoices: InvoiceResponseDto[];
  pendingInvoices: InvoiceResponseDto[];
  overdueInvoices: InvoiceResponseDto[];
  selectedInvoice: InvoiceResponseDto | null;

  // Sales and statistics
  salesStats: SalesStatsResponseDto | null;
  todaySales: any | null;

  // Filters
  filters: {
    status?: string;
    clientId?: number;
    from?: string;
    to?: string;
    minAmount?: number;
    maxAmount?: number;
    page?: number;
    limit?: number;
  };

  // UI state
  loading: boolean;
  loadingPending: boolean;
  loadingOverdue: boolean;
  loadingStats: boolean;
  loadingTodaySales: boolean;
  processing: boolean; // For payment processing
  error: any | null;
}

const initialState: InvoicesState = {
  invoices: [],
  pendingInvoices: [],
  overdueInvoices: [],
  selectedInvoice: null,
  salesStats: null,
  todaySales: null,
  filters: {
    page: 1,
    limit: 20
  },
  loading: false,
  loadingPending: false,
  loadingOverdue: false,
  loadingStats: false,
  loadingTodaySales: false,
  processing: false,
  error: null
};

@Injectable({ providedIn: 'root' })
export class InvoicesStore extends ComponentStore<InvoicesState> {
  private readonly invoicesService = inject(InvoicesService);
  private readonly notificationService = inject(NotificationService);

  constructor(private readonly globalStore: Store) {
    super(initialState);
    linkToGlobalState(this.state$, 'InvoicesStore', this.globalStore);
  }

  // Selectors
  readonly invoices$ = this.select((state) => state.invoices);
  readonly pendingInvoices$ = this.select((state) => state.pendingInvoices);
  readonly overdueInvoices$ = this.select((state) => state.overdueInvoices);
  readonly selectedInvoice$ = this.select((state) => state.selectedInvoice);
  readonly salesStats$ = this.select((state) => state.salesStats);
  readonly todaySales$ = this.select((state) => state.todaySales);
  readonly filters$ = this.select((state) => state.filters);
  readonly loading$ = this.select((state) => state.loading);
  readonly loadingPending$ = this.select((state) => state.loadingPending);
  readonly loadingOverdue$ = this.select((state) => state.loadingOverdue);
  readonly loadingStats$ = this.select((state) => state.loadingStats);
  readonly loadingTodaySales$ = this.select((state) => state.loadingTodaySales);
  readonly processing$ = this.select((state) => state.processing);

  // Computed selectors
  readonly selectInvoicesByStatus = (status: string) =>
    this.select(
      this.invoices$,
      (invoices) => invoices.filter(i => i.status === status)
    );

  readonly selectInvoicesByClient = (clientId: number) =>
    this.select(
      this.invoices$,
      (invoices) => invoices.filter(i => i.clientId === clientId)
    );

  readonly selectPaidInvoices = this.select(
    this.invoices$,
    (invoices) => invoices.filter(i => i.status === 'paid')
  );

  readonly selectDraftInvoices = this.select(
    this.invoices$,
    (invoices) => invoices.filter(i => i.status === 'draft')
  );

  readonly selectCancelledInvoices = this.select(
    this.invoices$,
    (invoices) => invoices.filter(i => i.status === 'cancelled')
  );

  readonly selectTotalRevenue = this.select(
    this.invoices$,
    (invoices) => invoices
      .filter(i => i.status === 'paid')
      .reduce((sum, invoice) => sum + (invoice.total || 0), 0)
  );

  readonly selectPendingRevenue = this.select(
    this.pendingInvoices$,
    (invoices) => invoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0)
  );

  readonly selectOverdueRevenue = this.select(
    this.overdueInvoices$,
    (invoices) => invoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0)
  );

  readonly selectInvoicesSummary = this.select(
    this.invoices$,
    this.pendingInvoices$,
    this.overdueInvoices$,
    (invoices, pending, overdue) => ({
      total: invoices.length,
      pending: pending.length,
      overdue: overdue.length,
      paid: invoices.filter(i => i.status === 'paid').length,
      draft: invoices.filter(i => i.status === 'draft').length,
      cancelled: invoices.filter(i => i.status === 'cancelled').length
    })
  );

  // Updaters
  private readonly setLoading = this.updater((state, loading: boolean) => ({
    ...state,
    loading
  }));

  private readonly setLoadingPending = this.updater((state, loadingPending: boolean) => ({
    ...state,
    loadingPending
  }));

  private readonly setLoadingOverdue = this.updater((state, loadingOverdue: boolean) => ({
    ...state,
    loadingOverdue
  }));

  private readonly setLoadingStats = this.updater((state, loadingStats: boolean) => ({
    ...state,
    loadingStats
  }));

  private readonly setLoadingTodaySales = this.updater((state, loadingTodaySales: boolean) => ({
    ...state,
    loadingTodaySales
  }));

  private readonly setProcessing = this.updater((state, processing: boolean) => ({
    ...state,
    processing
  }));

  private readonly setInvoices = this.updater((state, invoices: InvoiceResponseDto[]) => ({
    ...state,
    invoices,
    loading: false
  }));

  private readonly setPendingInvoices = this.updater((state, pendingInvoices: InvoiceResponseDto[]) => ({
    ...state,
    pendingInvoices,
    loadingPending: false
  }));

  private readonly setOverdueInvoices = this.updater((state, overdueInvoices: InvoiceResponseDto[]) => ({
    ...state,
    overdueInvoices,
    loadingOverdue: false
  }));

  private readonly setSelectedInvoice = this.updater((state, invoice: InvoiceResponseDto | null) => ({
    ...state,
    selectedInvoice: invoice
  }));

  private readonly setSalesStats = this.updater((state, salesStats: SalesStatsResponseDto) => ({
    ...state,
    salesStats,
    loadingStats: false
  }));

  private readonly setTodaySales = this.updater((state, todaySales: any) => ({
    ...state,
    todaySales,
    loadingTodaySales: false
  }));

  private readonly setFilters = this.updater((state, filters: Partial<InvoicesState['filters']>) => ({
    ...state,
    filters: { ...state.filters, ...filters }
  }));

  private readonly addInvoice = this.updater((state, invoice: InvoiceResponseDto) => ({
    ...state,
    invoices: [invoice, ...state.invoices]
  }));

  private readonly updateInvoice = this.updater((state, invoice: InvoiceResponseDto) => ({
    ...state,
    invoices: state.invoices.map(i => i.id === invoice.id ? invoice : i),
    pendingInvoices: state.pendingInvoices.map(i => i.id === invoice.id ? invoice : i),
    overdueInvoices: state.overdueInvoices.map(i => i.id === invoice.id ? invoice : i),
    selectedInvoice: state.selectedInvoice?.id === invoice.id ? invoice : state.selectedInvoice
  }));

  private readonly removeInvoice = this.updater((state, invoiceId: number) => ({
    ...state,
    invoices: state.invoices.filter(i => i.id !== invoiceId),
    pendingInvoices: state.pendingInvoices.filter(i => i.id !== invoiceId),
    overdueInvoices: state.overdueInvoices.filter(i => i.id !== invoiceId),
    selectedInvoice: state.selectedInvoice?.id === invoiceId ? null : state.selectedInvoice
  }));

  private readonly setError = this.updater((state, error: any) => ({
    ...state,
    error,
    loading: false,
    loadingPending: false,
    loadingOverdue: false,
    loadingStats: false,
    loadingTodaySales: false,
    processing: false
  }));

  // Effects
  readonly loadInvoices = this.effect<Partial<InvoicesState['filters']>>((params$) =>
    params$.pipe(
      tap((params) => {
        this.setFilters(params);
        this.setLoading(true);
      }),
      exhaustMap((params) => {
        const currentFilters = this.get().filters;
        const finalParams = { ...currentFilters, ...params };

        return this.invoicesService.invoiceControllerFindAll(finalParams).pipe(
          tapResponse(
            (invoices: InvoiceResponseDto[]) => {
              this.setInvoices(invoices);
            },
            (error: any) => {
              console.error('Error loading invoices:', error);
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al cargar las facturas.'
              );
            }
          )
        );
      })
    )
  );

  readonly loadInvoiceById = this.effect<number>((invoiceId$) =>
    invoiceId$.pipe(
      tap(() => this.setLoading(true)),
      exhaustMap((id) =>
        this.invoicesService.invoiceControllerFindOne({ id }).pipe(
          tapResponse(
            (invoice: InvoiceResponseDto) => {
              this.setSelectedInvoice(invoice);
              this.setLoading(false);
            },
            (error: any) => {
              console.error('Error loading invoice:', error);
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al cargar la factura.'
              );
            }
          )
        )
      )
    )
  );

  readonly loadPendingInvoices = this.effect<void>((trigger$) =>
    trigger$.pipe(
      tap(() => this.setLoadingPending(true)),
      exhaustMap(() =>
        this.invoicesService.invoiceControllerGetPendingInvoices().pipe(
          tapResponse(
            (invoices: InvoiceResponseDto[]) => {
              this.setPendingInvoices(invoices);
            },
            (error: any) => {
              console.error('Error loading pending invoices:', error);
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al cargar las facturas pendientes.'
              );
            }
          )
        )
      )
    )
  );

  readonly loadOverdueInvoices = this.effect<void>((trigger$) =>
    trigger$.pipe(
      tap(() => this.setLoadingOverdue(true)),
      exhaustMap(() =>
        this.invoicesService.invoiceControllerGetOverdueInvoices().pipe(
          tapResponse(
            (invoices: InvoiceResponseDto[]) => {
              this.setOverdueInvoices(invoices);
            },
            (error: any) => {
              console.error('Error loading overdue invoices:', error);
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al cargar las facturas vencidas.'
              );
            }
          )
        )
      )
    )
  );

  readonly loadSalesStats = this.effect<{ from?: string; to?: string }>((params$) =>
    params$.pipe(
      tap(() => this.setLoadingStats(true)),
      exhaustMap((params) =>
        this.invoicesService.invoiceControllerGetSalesStats(params).pipe(
          tapResponse(
            (stats: SalesStatsResponseDto) => {
              this.setSalesStats(stats);
            },
            (error: any) => {
              console.error('Error loading sales stats:', error);
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al cargar las estadísticas de ventas.'
              );
            }
          )
        )
      )
    )
  );

  readonly loadTodaySales = this.effect<void>((trigger$) =>
    trigger$.pipe(
      tap(() => this.setLoadingTodaySales(true)),
      exhaustMap(() =>
        this.invoicesService.invoiceControllerGetTodaySales().pipe(
          tapResponse(
            (sales: any) => {
              this.setTodaySales(sales);
            },
            (error: any) => {
              console.error('Error loading today sales:', error);
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al cargar las ventas de hoy.'
              );
            }
          )
        )
      )
    )
  );

  readonly createInvoice = this.effect<CreateInvoiceDto>((invoiceData$) =>
    invoiceData$.pipe(
      tap(() => this.setLoading(true)),
      exhaustMap((invoiceData) =>
        this.invoicesService.invoiceControllerCreate({ body: invoiceData }).pipe(
          tapResponse(
            (invoice: InvoiceResponseDto) => {
              this.addInvoice(invoice);
              this.setLoading(false);
              this.notificationService.showSuccess(
                NotificationSeverity.Success,
                'Factura creada con éxito.'
              );
            },
            (error: any) => {
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al crear la factura.'
              );
            }
          )
        )
      )
    )
  );

  readonly updateInvoice = this.effect<{ id: number; invoiceData: UpdateInvoiceDto }>((params$) =>
    params$.pipe(
      tap(() => this.setLoading(true)),
      exhaustMap(({ id, invoiceData }) =>
        this.invoicesService.invoiceControllerUpdate({ id, body: invoiceData }).pipe(
          tapResponse(
            (invoice: InvoiceResponseDto) => {
              this.updateInvoice(invoice);
              this.setLoading(false);
              this.notificationService.showSuccess(
                NotificationSeverity.Success,
                'Factura actualizada con éxito.'
              );
            },
            (error: any) => {
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al actualizar la factura.'
              );
            }
          )
        )
      )
    )
  );

  readonly deleteInvoice = this.effect<number>((invoiceId$) =>
    invoiceId$.pipe(
      tap(() => this.setLoading(true)),
      exhaustMap((id) =>
        this.invoicesService.invoiceControllerRemove({ id }).pipe(
          tapResponse(
            () => {
              this.removeInvoice(id);
              this.setLoading(false);
              this.notificationService.showSuccess(
                NotificationSeverity.Success,
                'Factura eliminada con éxito.'
              );
            },
            (error: any) => {
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al eliminar la factura.'
              );
            }
          )
        )
      )
    )
  );

  readonly cancelInvoice = this.effect<{ id: number; reason?: string }>((params$) =>
    params$.pipe(
      tap(() => this.setLoading(true)),
      exhaustMap(({ id, reason }) =>
        this.invoicesService.invoiceControllerCancel({ id, body: { reason } }).pipe(
          tapResponse(
            (invoice: InvoiceResponseDto) => {
              this.updateInvoice(invoice);
              this.setLoading(false);
              this.notificationService.showSuccess(
                NotificationSeverity.Success,
                'Factura cancelada con éxito.'
              );
            },
            (error: any) => {
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al cancelar la factura.'
              );
            }
          )
        )
      )
    )
  );

  readonly processPayment = this.effect<{ id: number; paymentData: ProcessPaymentDto }>((params$) =>
    params$.pipe(
      tap(() => this.setProcessing(true)),
      exhaustMap(({ id, paymentData }) =>
        this.invoicesService.invoiceControllerProcessPayment({ id, body: paymentData }).pipe(
          tapResponse(
            (invoice: InvoiceResponseDto) => {
              this.updateInvoice(invoice);
              this.setProcessing(false);
              this.notificationService.showSuccess(
                NotificationSeverity.Success,
                'Pago procesado con éxito.'
              );
              // Refresh related data
              this.loadPendingInvoices();
              this.loadOverdueInvoices();
              this.loadTodaySales();
            },
            (error: any) => {
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al procesar el pago.'
              );
            }
          )
        )
      )
    )
  );

  // Utility methods
  updateFilters(filters: Partial<InvoicesState['filters']>): void {
    this.setFilters(filters);
    this.loadInvoices(filters);
  }

  clearFilters(): void {
    const defaultFilters = { page: 1, limit: 20 };
    this.setFilters(defaultFilters);
    this.loadInvoices({});
  }

  refreshInvoices(): void {
    const currentFilters = this.get().filters;
    this.loadInvoices(currentFilters);
  }

  refreshPendingInvoices(): void {
    this.loadPendingInvoices();
  }

  refreshOverdueInvoices(): void {
    this.loadOverdueInvoices();
  }

  refreshSalesStats(): void {
    this.loadSalesStats({});
  }

  refreshTodaySales(): void {
    this.loadTodaySales();
  }

  refreshDashboardData(): void {
    this.loadPendingInvoices();
    this.loadOverdueInvoices();
    this.loadSalesStats({});
    this.loadTodaySales();
  }

  selectInvoice(invoice: InvoiceResponseDto): void {
    this.setSelectedInvoice(invoice);
  }

  clearSelectedInvoice(): void {
    this.setSelectedInvoice(null);
  }

  getInvoiceById(id: number): InvoiceResponseDto | undefined {
    return this.get().invoices.find(invoice => invoice.id === id);
  }

  getInvoicesByStatus(status: string): InvoiceResponseDto[] {
    return this.get().invoices.filter(invoice => invoice.status === status);
  }

  getInvoicesByClient(clientId: number): InvoiceResponseDto[] {
    return this.get().invoices.filter(invoice => invoice.clientId === clientId);
  }

  getTotalInvoices(): number {
    return this.get().invoices.length;
  }

  getPaidInvoices(): InvoiceResponseDto[] {
    return this.getInvoicesByStatus('paid');
  }

  getDraftInvoices(): InvoiceResponseDto[] {
    return this.getInvoicesByStatus('draft');
  }

  getCancelledInvoices(): InvoiceResponseDto[] {
    return this.getInvoicesByStatus('cancelled');
  }

  getTotalRevenue(): number {
    return this.get().invoices
      .filter(i => i.status === 'paid')
      .reduce((sum, invoice) => sum + (invoice.total || 0), 0);
  }

  getPendingRevenue(): number {
    return this.get().pendingInvoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
  }

  getOverdueRevenue(): number {
    return this.get().overdueInvoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
  }

  getInvoicesSummary() {
    const state = this.get();
    return {
      total: state.invoices.length,
      pending: state.pendingInvoices.length,
      overdue: state.overdueInvoices.length,
      paid: state.invoices.filter(i => i.status === 'paid').length,
      draft: state.invoices.filter(i => i.status === 'draft').length,
      cancelled: state.invoices.filter(i => i.status === 'cancelled').length,
      totalRevenue: this.getTotalRevenue(),
      pendingRevenue: this.getPendingRevenue(),
      overdueRevenue: this.getOverdueRevenue()
    };
  }

  // Helper methods for invoice calculations
  calculateInvoiceTotal(invoice: InvoiceResponseDto): number {
    if (!invoice.items) return 0;
    const subtotal = invoice.items.reduce((sum, item) =>
      sum + (item.quantity * item.unitPrice), 0
    );
    const taxes = subtotal * (invoice.taxRate || 0) / 100;
    const discount = subtotal * (invoice.discountRate || 0) / 100;
    return subtotal + taxes - discount;
  }

  isInvoiceOverdue(invoice: InvoiceResponseDto): boolean {
    if (invoice.status === 'paid' || !invoice.dueDate) return false;
    return new Date(invoice.dueDate) < new Date();
  }

  getDaysUntilDue(invoice: InvoiceResponseDto): number {
    if (!invoice.dueDate) return 0;
    const now = new Date();
    const dueDate = new Date(invoice.dueDate);
    const diffTime = dueDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}