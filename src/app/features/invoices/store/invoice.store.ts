import { Injectable, computed, signal } from '@angular/core';
import { InvoiceResponseDto } from '../../../api/models/invoice-response-dto';
import { InvoicesService } from '../../../api/services/invoices.service';

export interface InvoicesState {
  invoices: InvoiceResponseDto[];
  loading: boolean;
  error: string | null;
  selectedInvoice: InvoiceResponseDto | null;
  totalRevenue: number;
  filters: {
    status: string | null;
    search: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class InvoiceStore {
  // State signals
  private state = signal<InvoicesState>({
    invoices: [],
    loading: false,
    error: null,
    selectedInvoice: null,
    totalRevenue: 0,
    filters: {
      status: null,
      search: ''
    }
  });

  // Computed selectors
  readonly invoices = computed(() => this.state().invoices);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);
  readonly selectedInvoice = computed(() => this.state().selectedInvoice);
  readonly totalRevenue = computed(() => this.state().totalRevenue);
  readonly filters = computed(() => this.state().filters);

  // Computed statistics
  readonly pendingInvoices = computed(() => 
    this.state().invoices.filter(invoice => invoice.status === 'pending').length
  );

  readonly overdueInvoices = computed(() => 
    this.state().invoices.filter(invoice => invoice.status === 'overdue').length
  );

  readonly paidInvoices = computed(() => 
    this.state().invoices.filter(invoice => invoice.status === 'paid').length
  );

  readonly draftInvoices = computed(() => 
    this.state().invoices.filter(invoice => invoice.status === 'draft').length
  );

  readonly cancelledInvoices = computed(() => 
    this.state().invoices.filter(invoice => invoice.status === 'cancelled').length
  );

  readonly totalInvoices = computed(() => this.state().invoices.length);

  readonly averageInvoiceAmount = computed(() => {
    const invoices = this.state().invoices;
    if (invoices.length === 0) return 0;
    const total = invoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
    return total / invoices.length;
  });

  readonly paymentRate = computed(() => {
    const invoices = this.state().invoices;
    if (invoices.length === 0) return 0;
    const paidCount = invoices.filter(i => i.status === 'paid').length;
    return Math.round((paidCount / invoices.length) * 100);
  });

  // Filtered invoices based on current filters
  readonly filteredInvoices = computed(() => {
    const filters = this.state().filters;
    let filtered = this.state().invoices;

    // Filter by status
    if (filters.status) {
      filtered = filtered.filter(invoice => invoice.status === filters.status);
    }

    // Filter by search term
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(invoice => 
        invoice.invoiceNumber.toLowerCase().includes(searchLower) ||
        (invoice.client as any)?.name?.toLowerCase().includes(searchLower) ||
        (invoice.client as any)?.email?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  });

  constructor(private invoicesService: InvoicesService) {}

  // Actions
  setLoading(loading: boolean): void {
    this.state.update(state => ({ ...state, loading }));
  }

  setError(error: string | null): void {
    this.state.update(state => ({ ...state, error }));
  }

  setInvoices(invoices: InvoiceResponseDto[]): void {
    this.state.update(state => ({ ...state, invoices }));
  }

  setSelectedInvoice(invoice: InvoiceResponseDto | null): void {
    this.state.update(state => ({ ...state, selectedInvoice: invoice }));
  }

  setTotalRevenue(totalRevenue: number): void {
    this.state.update(state => ({ ...state, totalRevenue }));
  }

  setFilters(filters: Partial<InvoicesState['filters']>): void {
    this.state.update(state => ({
      ...state,
      filters: { ...state.filters, ...filters }
    }));
  }

  addInvoice(invoice: InvoiceResponseDto): void {
    this.state.update(state => ({
      ...state,
      invoices: [invoice, ...state.invoices]
    }));
  }

  updateInvoice(updatedInvoice: InvoiceResponseDto): void {
    this.state.update(state => ({
      ...state,
      invoices: state.invoices.map(invoice =>
        invoice.id === updatedInvoice.id ? updatedInvoice : invoice
      ),
      selectedInvoice: state.selectedInvoice?.id === updatedInvoice.id 
        ? updatedInvoice 
        : state.selectedInvoice
    }));
  }

  removeInvoice(invoiceId: number): void {
    this.state.update(state => ({
      ...state,
      invoices: state.invoices.filter(invoice => invoice.id !== invoiceId),
      selectedInvoice: state.selectedInvoice?.id === invoiceId 
        ? null 
        : state.selectedInvoice
    }));
  }

  // Async operations
  async loadInvoices(params?: any): Promise<void> {
    this.setLoading(true);
    this.setError(null);

    try {
      const response = await this.invoicesService.invoiceControllerFindAll(params).toPromise();
      const invoices = Array.isArray(response) ? response : (response as any)?.data || [];
      this.setInvoices(invoices);
    } catch (error: any) {
      console.error('Error loading invoices:', error);
      this.setError('Error al cargar las facturas');
      this.setInvoices([]);
    } finally {
      this.setLoading(false);
    }
  }

  async loadInvoiceById(id: number): Promise<InvoiceResponseDto | null> {
    this.setLoading(true);
    this.setError(null);

    try {
      const invoice = await this.invoicesService.invoiceControllerFindOne({ id }).toPromise();
      if (invoice) {
        this.setSelectedInvoice(invoice);
        return invoice;
      }
      return null;
    } catch (error: any) {
      console.error('Error loading invoice:', error);
      this.setError('Error al cargar la factura');
      return null;
    } finally {
      this.setLoading(false);
    }
  }

  async loadStats(): Promise<void> {
    try {
      const stats = await this.invoicesService.invoiceControllerGetSalesStats().toPromise();
      this.setTotalRevenue((stats as any)?.totalRevenue || 0);
    } catch (error: any) {
      console.error('Error loading stats:', error);
      this.setTotalRevenue(0);
    }
  }

  async createInvoice(invoiceData: any): Promise<InvoiceResponseDto | null> {
    this.setLoading(true);
    this.setError(null);

    try {
      const newInvoice = await this.invoicesService.invoiceControllerCreate({ body: invoiceData }).toPromise();
      if (newInvoice) {
        this.addInvoice(newInvoice);
        return newInvoice;
      }
      return null;
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      this.setError('Error al crear la factura');
      return null;
    } finally {
      this.setLoading(false);
    }
  }

  async updateInvoiceById(id: number, invoiceData: any): Promise<InvoiceResponseDto | null> {
    this.setLoading(true);
    this.setError(null);

    try {
      const updatedInvoice = await this.invoicesService.invoiceControllerUpdate({ id, body: invoiceData }).toPromise();
      if (updatedInvoice) {
        this.updateInvoice(updatedInvoice);
        return updatedInvoice;
      }
      return null;
    } catch (error: any) {
      console.error('Error updating invoice:', error);
      this.setError('Error al actualizar la factura');
      return null;
    } finally {
      this.setLoading(false);
    }
  }

  async processPayment(id: number, paymentData: any): Promise<InvoiceResponseDto | null> {
    this.setLoading(true);
    this.setError(null);

    try {
      const updatedInvoice = await this.invoicesService.invoiceControllerProcessPayment({ id, body: paymentData }).toPromise();
      if (updatedInvoice) {
        this.updateInvoice(updatedInvoice);
        return updatedInvoice;
      }
      return null;
    } catch (error: any) {
      console.error('Error processing payment:', error);
      this.setError('Error al procesar el pago');
      return null;
    } finally {
      this.setLoading(false);
    }
  }

  async cancelInvoice(id: number): Promise<InvoiceResponseDto | null> {
    this.setLoading(true);
    this.setError(null);

    try {
      const cancelledInvoice = await this.invoicesService.invoiceControllerCancel({ id }).toPromise();
      if (cancelledInvoice) {
        this.updateInvoice(cancelledInvoice);
        return cancelledInvoice;
      }
      return null;
    } catch (error: any) {
      console.error('Error cancelling invoice:', error);
      this.setError('Error al cancelar la factura');
      return null;
    } finally {
      this.setLoading(false);
    }
  }

  async deleteInvoice(id: number): Promise<boolean> {
    this.setLoading(true);
    this.setError(null);

    try {
      await this.invoicesService.invoiceControllerRemove({ id }).toPromise();
      this.removeInvoice(id);
      return true;
    } catch (error: any) {
      console.error('Error deleting invoice:', error);
      this.setError('Error al eliminar la factura');
      return false;
    } finally {
      this.setLoading(false);
    }
  }

  // Utility methods
  clearError(): void {
    this.setError(null);
  }

  clearSelectedInvoice(): void {
    this.setSelectedInvoice(null);
  }

  resetFilters(): void {
    this.setFilters({ status: null, search: '' });
  }

  // Check if invoice is overdue
  isInvoiceOverdue(invoice: InvoiceResponseDto): boolean {
    if (!invoice.dueDate || invoice.isPaid) return false;
    return new Date(invoice.dueDate) < new Date();
  }

  // Get invoices by status
  getInvoicesByStatus(status: string): InvoiceResponseDto[] {
    return this.state().invoices.filter(invoice => invoice.status === status);
  }

  // Get monthly invoice stats for charts
  getMonthlyInvoiceStats(months: number = 6): { labels: string[], data: number[] } {
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const now = new Date();
    const labels: string[] = [];
    const data: number[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(monthNames[date.getMonth()]);
      
      const monthRevenue = this.state().invoices
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
}