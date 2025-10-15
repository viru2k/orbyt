import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
  signal,
  computed,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormArray,
  FormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';

// PrimeNG Components
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { OrbTableComponent } from '@orb-shared-components/orb-table/orb-table.component';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { MessageModule } from 'primeng/message';
import { CheckboxModule } from 'primeng/checkbox';

// Orb Components
import {
  OrbButtonComponent,
  OrbTextInputComponent,
  OrbFormFieldComponent,
  OrbFormFooterComponent,
  OrbSelectComponent,
  OrbDatepickerComponent,
  OrbTextAreaComponent,
  OrbCheckboxComponent,
  OrbCardComponent,
  OrbTagComponent,
} from '@orb-components';
import { OrbCurrencyInputComponent } from '@orb-shared-components/orb-currency-input/orb-currency-input.component';
import { OrbNumberInputComponent } from '@orb-shared-components/orb-number-input/orb-number-input.component';
import { ClientSelectorComponent } from '../../../shared/components/client-selector/client-selector.component';
import { ClientSearchModalComponent } from '../../../shared/components/client-search-modal/client-search-modal.component';

// Services and Models
import { InvoicesService } from '../../../api/services/invoices.service';
import { ClientsService } from '../../../api/services/clients.service';
import { ProductsService } from '../../../api/services/products.service';
import { RewardsService } from '../../../api/services/rewards.service';
import { InvoiceResponseDto } from '../../../api/models/invoice-response-dto';
import { CreateInvoiceDto } from '../../../api/models/create-invoice-dto';
import { UpdateInvoiceDto } from '../../../api/models/update-invoice-dto';
import { CreateInvoiceItemDto } from '../../../api/models/create-invoice-item-dto';
import { ClientResponseDto } from '../../../api/models/client-response-dto';
import { ProductResponseDto } from '../../../api/models/product-response-dto';
import {
  CustomerRewardResponseDto,
  TriggerPurchaseCompletedDto,
  PurchaseCompletedResponseDto,
} from '../../../api/models';
import { MessageService, ConfirmationService } from 'primeng/api';
import { FormButtonAction, TableColumn, OrbTableFeatures } from '@orb-models';
import { ItemSelectorModalComponent, InvoiceItemSelection } from './item-selector-modal.component';

interface InvoiceItem {
  itemId?: number | null;
  itemType: 'service' | 'product' | 'manual';
  type?: 'reward' | 'service' | 'product' | 'manual';
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  total: number;
  notes?: string;
  category?: string;
  rewardId?: number;
  duration?: number;
}

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    OrbTableComponent,
    ToastModule,
    ConfirmDialogModule,
    DialogModule,
    ProgressBarModule,
    TagModule,
    CardModule,
    DividerModule,
    MessageModule,
    CheckboxModule,
    OrbTextInputComponent,
    OrbFormFieldComponent,
    OrbFormFooterComponent,
    OrbSelectComponent,
    OrbDatepickerComponent,
    OrbTextAreaComponent,
    OrbButtonComponent,
    OrbCurrencyInputComponent,
    OrbNumberInputComponent,
    ItemSelectorModalComponent,
    OrbCheckboxComponent,
    OrbCardComponent,
    OrbTagComponent,
    ClientSelectorComponent,
    ClientSearchModalComponent
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './invoice-form.component.html',
  styleUrls: ['./invoice-form.component.scss'],
})
export class InvoiceFormComponent implements OnInit {
  @Input() invoice?: InvoiceResponseDto;
  @Output() saved = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private invoicesService = inject(InvoicesService);
  private clientsService = inject(ClientsService);
  private productsService = inject(ProductsService);
  private rewardsService = inject(RewardsService);
  private messageService = inject(MessageService);

  invoiceForm!: FormGroup;
  loading = signal(false);
  isEditMode = false;

  // Data signals
  clientOptions = signal<ClientResponseDto[]>([]);
  productOptions = signal<ProductResponseDto[]>([]);

  // Rewards signals
  selectedClient = signal<ClientResponseDto | null>(null);
  clientRewards = signal<CustomerRewardResponseDto[]>([]);
  availablePoints = signal(0);
  showRewardsPreview = signal(false);
  showRewardsModal = signal(false);
  showClientSearchModal = signal(false);
  rewardsToGenerate = signal<PurchaseCompletedResponseDto | null>(null);
  pointsToApply = signal(0);
  appliedRewards = signal<number[]>([]);

  // Table columns and features
  rewardsColumns: TableColumn[] = [
    { field: 'reward', header: 'Recompensa' },
    { field: 'type', header: 'Tipo' },
    { field: 'value', header: 'Valor' },
    { field: 'points', header: 'Puntos' },
    { field: 'apply', header: 'Aplicar' },
  ];

  itemsColumns: TableColumn[] = [
    { field: 'type', header: 'Tipo' },
    { field: 'description', header: 'Descripción' },
    { field: 'quantity', header: 'Cantidad' },
    { field: 'unitPrice', header: 'Precio Unit.' },
    { field: 'discount', header: 'Descuento' },
    { field: 'total', header: 'Total' },
    { field: 'actions', header: '', width: '60px' },
  ];

  rewardsTableFeatures: OrbTableFeatures = {
    showGlobalSearch: false,
  };

  itemsTableFeatures: OrbTableFeatures = {
    showGlobalSearch: false,
  };

  // Invoice items
  items: InvoiceItem[] = [];

  // Modal control
  showItemSelectorModal = false;

  // Totals
  subtotal = 0;
  generalDiscount = 0;
  taxAmount = 0;
  pointsDiscountAmount = 0;
  total = 0;

  statusOptions = [
    { label: 'Borrador', value: 'draft' },
    { label: 'Pendiente', value: 'pending' },
    { label: 'Pagada', value: 'paid' },
    { label: 'Cancelada', value: 'cancelled' },
  ];

  paymentMethodOptions = [
    { label: 'Efectivo', value: 'cash' },
    { label: 'Tarjeta', value: 'card' },
    { label: 'Transferencia', value: 'transfer' },
    { label: 'Cheque', value: 'check' },
    { label: 'Otro', value: 'other' },
  ];

  discountTypeOptions = [
    { label: '%', value: 'percentage' },
    { label: '€', value: 'fixed' },
  ];

  footerActions: FormButtonAction[] = [
    { label: 'Cancelar', action: 'cancel', severity: 'secondary', styleType: 'text' },
    { label: 'Guardar', action: 'save', severity: 'success', buttonType: 'submit', outlined: true },
  ];

  ngOnInit(): void {
    this.isEditMode = !!this.invoice;
    this.initForm();
    this.loadClients();
    this.loadProducts();

    if (this.isEditMode && this.invoice) {
      this.populateForm();
    }
  }

  private initForm(): void {
    const today = new Date().toISOString().split('T')[0];

    this.invoiceForm = this.fb.group({
      clientId: [null, Validators.required],
      consultationId: [null],
      dueDate: [today],
      status: ['draft', Validators.required],
      paymentMethod: [null],
      paymentReference: [''],
      paymentNotes: [''],
      notes: [''],
      discount: [0],
      discountType: ['percentage'],
      taxRate: [21], // Default IVA rate
    });

    // Subscribe to changes for real-time calculation
    this.invoiceForm.valueChanges.subscribe(() => {
      this.calculateTotals();
    });

    // Subscribe to client changes to load rewards
    this.invoiceForm.get('clientId')?.valueChanges.subscribe((clientId) => {
      if (clientId) {
        this.loadClientRewards(clientId);
        const client = this.clientOptions().find((c) => c.id === clientId);
        this.selectedClient.set(client || null);
      } else {
        this.clearRewardsData();
      }
    });
  }

  private loadClients(): void {
    this.clientsService.clientControllerFindAll().subscribe({
      next: (clients) => {
        this.clientOptions.set(clients);
      },
      error: (error) => {
        console.error('Error loading clients:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al cargar la lista de clientes',
        });
      },
    });
  }

  private loadProducts(): void {
    this.productsService.productControllerFindAll().subscribe({
      next: (products) => {
        this.productOptions.set(products);
      },
      error: (error) => {
        console.error('Error loading products:', error);
      },
    });
  }

  private populateForm(): void {
    if (!this.invoice) return;

    this.invoiceForm.patchValue({
      clientId: this.invoice.clientId,
      consultationId: this.invoice.consultationId,
      dueDate: this.invoice.dueDate ? new Date(this.invoice.dueDate) : null,
      status: this.invoice.status,
      paymentMethod: this.invoice.paymentMethod,
      paymentReference: this.invoice.paymentReference,
      paymentNotes: this.invoice.paymentNotes,
      notes: this.invoice.notes,
      discount: this.invoice.discount,
      discountType: this.invoice.discountType,
      taxRate: this.invoice.taxRate,
    });

    // Populate items
    this.items = this.invoice.items.map((item) => ({
      itemId: item.itemId,
      itemType: item.itemType,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      discountType: item.discountType,
      total: 0, // Will be recalculated
      notes: item.notes,
    }));

    // Recalculate totals for all items
    this.items.forEach((item, index) => {
      this.updateItemTotal(index);
    });
  }

  showItemSelector(): void {
    this.showItemSelectorModal = true;
  }

  onItemSelected(selection: InvoiceItemSelection): void {
    const newIndex = this.items.length;

    this.items.push({
      itemId: selection.itemId,
      itemType: selection.itemType,
      description: selection.description,
      quantity: 1,
      unitPrice: selection.basePrice,
      discount: 0,
      discountType: 'percentage',
      total: 0, // Will be calculated by updateItemTotal
      category: selection.category,
      duration: selection.duration,
    });

    // Recalculate the total for the new item
    this.updateItemTotal(newIndex);
    this.showItemSelectorModal = false;
  }

  onItemSelectorCancel(): void {
    this.showItemSelectorModal = false;
  }

  addManualItem(): void {
    const newIndex = this.items.length;

    this.items.push({
      itemId: null,
      itemType: 'manual',
      description: 'Item manual',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      discountType: 'percentage',
      total: 0,
      category: 'Manual',
    });

    // Calculate total for the new manual item
    this.updateItemTotal(newIndex);
  }

  getItemTypeLabel(type: string): string {
    switch (type) {
      case 'product':
        return 'Producto';
      case 'service':
        return 'Servicio';
      case 'manual':
        return 'Manual';
      default:
        return type;
    }
  }

  getItemTypeSeverity(type: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
    switch (type) {
      case 'product':
        return 'info';
      case 'service':
        return 'success';
      case 'manual':
        return 'warning';
      default:
        return 'secondary';
    }
  }

  removeItem(index: number): void {
    this.items.splice(index, 1);
    this.calculateTotals();
  }

  updateItemTotal(index: number): void {
    const item = this.items[index];
    if (!item) return;

    let itemTotal = item.quantity * item.unitPrice;

    if ((item.discount || 0) > 0) {
      if (item.discountType === 'percentage') {
        itemTotal -= (itemTotal * (item.discount || 0)) / 100;
      } else {
        itemTotal -= item.discount || 0;
      }
    }

    item.total = Math.max(0, itemTotal);
    this.calculateTotals();
  }

  calculateTotals(): void {
    // Calculate subtotal from items
    this.subtotal = this.items.reduce((sum, item) => sum + item.total, 0);

    // Calculate general discount
    const discountValue = this.invoiceForm.get('discount')?.value || 0;
    const discountType = this.invoiceForm.get('discountType')?.value || 'percentage';

    if (discountType === 'percentage') {
      this.generalDiscount = (this.subtotal * discountValue) / 100;
    } else {
      this.generalDiscount = discountValue;
    }

    // Calculate points discount (1 point = 0.01 EUR)
    this.pointsDiscountAmount = this.pointsToApply() * 0.01;

    // Calculate tax
    const taxRate = this.invoiceForm.get('taxRate')?.value || 0;
    const taxableAmount = this.subtotal - this.generalDiscount - this.pointsDiscountAmount;
    this.taxAmount = (Math.max(0, taxableAmount) * taxRate) / 100;

    // Calculate total
    this.total = Math.max(0, taxableAmount + this.taxAmount);
  }

  onSubmit(): void {
    if (this.invoiceForm.invalid || this.items.length === 0) {
      this.invoiceForm.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario incompleto',
        detail: 'Por favor, completa todos los campos requeridos y agrega al menos un item',
      });
      return;
    }

    this.loading.set(true);

    const formValue = this.invoiceForm.value;
    const invoiceItems: CreateInvoiceItemDto[] = this.items.map((item) => {
      const baseItem: CreateInvoiceItemDto = {
        itemType: item.itemType || 'manual',
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        discount: Number(item.discount) || 0,
        discountType: item.discountType || 'percentage',
        notes: item.notes,
      };

      // Only include itemId for products and services (not for manual items)
      if (item.itemType !== 'manual' && item.itemId) {
        baseItem.itemId = item.itemId;
      }

      return baseItem;
    });

    if (this.isEditMode && this.invoice) {
      const updateData: UpdateInvoiceDto = {
        ...formValue,
        items: invoiceItems,
        dueDate: formValue.dueDate
          ? (formValue.dueDate instanceof Date ? formValue.dueDate.toISOString() : new Date(formValue.dueDate).toISOString())
          : undefined,
      };

      this.invoicesService
        .invoiceControllerUpdate({ id: this.invoice.id, body: updateData })
        .subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Factura actualizada exitosamente',
            });
            this.saved.emit();
            this.loading.set(false);
          },
          error: (error) => {
            console.error('Error updating invoice:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Error al actualizar la factura',
            });
            this.loading.set(false);
          },
        });
    } else {
      const createData: CreateInvoiceDto = {
        ...formValue,
        items: invoiceItems,
        dueDate: formValue.dueDate
          ? (formValue.dueDate instanceof Date ? formValue.dueDate.toISOString() : new Date(formValue.dueDate).toISOString())
          : undefined,
      };

      this.invoicesService.invoiceControllerCreate({ body: createData }).subscribe({
        next: (newInvoice) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Factura creada exitosamente',
          });

          // Process rewards for the new invoice
          this.processRewardsForInvoice(newInvoice);

          this.saved.emit();
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error creating invoice:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al crear la factura',
          });
          this.loading.set(false);
        },
      });
    }
  }

  onActionClicked(action: string): void {
    if (action === 'cancel') {
      this.cancel.emit();
    } else if (action === 'save') {
      this.onSubmit();
    }
  }

  // Rewards Management Methods
  private loadClientRewards(clientId: number): void {
    this.rewardsService.rewardsControllerGetClientActiveRewards({ clientId }).subscribe({
      next: (rewards) => {
        this.clientRewards.set(rewards || []);

        // Calculate available points from earned rewards
        const totalPoints = rewards.reduce((sum, reward) => {
          if (reward.status === 'EARNED' && reward.rewardProgram?.rewardType === 'POINTS') {
            return sum + (reward.rewardProgram.rewardValue || 0);
          }
          return sum;
        }, 0);

        this.availablePoints.set(totalPoints);
        this.showRewardsPreview.set(rewards.length > 0);

        // Check for redeemable rewards and show notification
        const hasRedeemableRewards = rewards.some((reward) => reward.status === 'EARNED');
        if (hasRedeemableRewards) {
          this.messageService.add({
            severity: 'warn',
            summary: '⭐ Recompensas Disponibles',
            detail: `El cliente tiene ${
              rewards.filter((r) => r.status === 'EARNED').length
            } recompensa(s) disponible(s) para canjear`,
            life: 6000,
          });
        }
      },
      error: (error) => {
        console.error('Error loading client rewards:', error);
        this.clearRewardsData();
      },
    });
  }

  private clearRewardsData(): void {
    this.selectedClient.set(null);
    this.clientRewards.set([]);
    this.availablePoints.set(0);
    this.showRewardsPreview.set(false);
    this.pointsToApply.set(0);
    this.appliedRewards.set([]);
    this.calculateTotals();
  }

  applyPoints(points: number): void {
    const maxPoints = Math.min(this.availablePoints(), Math.floor(this.subtotal * 100)); // Max points based on total
    this.pointsToApply.set(Math.min(points, maxPoints));
    this.calculateTotals();
  }

  clearAppliedPoints(): void {
    this.pointsToApply.set(0);
    this.calculateTotals();
  }

  getMaxApplicablePoints(): number {
    // Maximum points that can be applied (cannot exceed total cost in cents)
    return Math.min(this.availablePoints(), Math.floor(this.subtotal * 100));
  }

  getRewardStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      IN_PROGRESS: 'En Progreso',
      EARNED: 'Ganada',
      REDEEMED: 'Canjeada',
      EXPIRED: 'Expirada',
    };
    return statusMap[status] || status;
  }

  getRewardStatusSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' {
    const severityMap: { [key: string]: 'success' | 'info' | 'warning' | 'danger' } = {
      IN_PROGRESS: 'info',
      EARNED: 'success',
      REDEEMED: 'info',
      EXPIRED: 'danger',
    };
    return severityMap[status] || 'info';
  }

  onRewardsModalClose(): void {
    this.showRewardsModal.set(false);
    this.rewardsToGenerate.set(null);
  }

  private processRewardsForInvoice(invoice: InvoiceResponseDto): void {
    if (!this.selectedClient()) return;

    const rewardsData: TriggerPurchaseCompletedDto = {
      clientId: this.selectedClient()!.id,
      invoiceId: invoice.id,
      purchaseAmount: this.total,
      paymentMethod: this.invoiceForm.get('paymentMethod')?.value || 'other',
      paymentDate: new Date().toISOString(),
      items: this.items.map((item) => ({
        serviceId: item.itemId || 1,
        quantity: item.quantity,
        amount: item.total,
      })),
    };

    this.rewardsService.rewardsControllerTriggerPurchaseCompleted({ body: rewardsData }).subscribe({
      next: (response) => {
        this.rewardsToGenerate.set(response);
        this.showRewardsModal.set(true);

        // Refresh client rewards data
        this.loadClientRewards(this.selectedClient()!.id);
      },
      error: (error) => {
        console.error('Error processing rewards:', error);
        // Don't show error to user as the invoice was created successfully
        // Just log the error for debugging
      },
    });
  }

  // Reward application methods
  applyRewardAsItem(reward: CustomerRewardResponseDto, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    if (!reward.id || this.appliedRewards().includes(reward.id)) {
      return;
    }

    // Add reward as an invoice item
    const rewardValue = this.getRewardDiscountValue(reward);
    const newItem: InvoiceItem = {
      itemType: 'manual',
      type: 'reward',
      description: `Recompensa: ${reward.rewardProgram?.name || 'Descuento'}`,
      quantity: 1,
      unitPrice: -rewardValue, // Negative value for discount
      total: -rewardValue,
      rewardId: reward.id,
    };

    this.items.push(newItem);

    // Track applied reward
    const currentApplied = this.appliedRewards();
    this.appliedRewards.set([...currentApplied, reward.id]);

    this.calculateTotals();

    this.messageService.add({
      severity: 'success',
      summary: 'Recompensa Aplicada',
      detail: `Se aplicó la recompensa como descuento de ${this.getRewardValueDisplay(reward)}`,
      life: 3000,
    });
  }

  cancelRewardApplication(reward: CustomerRewardResponseDto, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    if (!reward.id || !this.appliedRewards().includes(reward.id)) {
      return;
    }

    // Remove reward from items
    this.items = this.items.filter((item) => item.rewardId !== reward.id);

    // Remove from applied rewards
    const currentApplied = this.appliedRewards();
    this.appliedRewards.set(currentApplied.filter((id) => id !== reward.id));

    this.calculateTotals();

    this.messageService.add({
      severity: 'info',
      summary: 'Recompensa Cancelada',
      detail: 'Se removió la recompensa de la factura',
      life: 3000,
    });
  }

  private getRewardDiscountValue(reward: CustomerRewardResponseDto): number {
    if (!reward.rewardProgram) return 0;

    const rewardValue = reward.rewardProgram.rewardValue || 0;
    const rewardType = reward.rewardProgram.rewardType;

    switch (rewardType) {
      case 'DISCOUNT_PERCENTAGE':
        return (this.subtotal * rewardValue) / 100;
      case 'DISCOUNT_AMOUNT':
        return rewardValue;
      case 'POINTS':
        return rewardValue * 0.01; // 1 punto = 0.01 euros
      default:
        return rewardValue;
    }
  }

  getRewardTypeLabel(type?: string): string {
    if (!type) return 'Descuento';

    const typeMap: { [key: string]: string } = {
      DISCOUNT_PERCENTAGE: 'Descuento %',
      DISCOUNT_AMOUNT: 'Descuento €',
      FREE_SERVICE: 'Servicio Gratis',
      POINTS: 'Puntos',
    };
    return typeMap[type] || 'Descuento';
  }

  getRewardValueDisplay(reward: CustomerRewardResponseDto): string {
    if (!reward.rewardProgram?.rewardValue) return '';

    const value = reward.rewardProgram.rewardValue;
    const type = reward.rewardProgram.rewardType;

    switch (type) {
      case 'DISCOUNT_PERCENTAGE':
        return `${value}%`;
      case 'DISCOUNT_AMOUNT':
        return `${value}€`;
      case 'POINTS':
        return `${value} pts`;
      default:
        return value.toString();
    }
  }

  getRewardSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' {
    const severityMap: { [key: string]: 'success' | 'info' | 'warning' | 'danger' } = {
      IN_PROGRESS: 'info',
      EARNED: 'success',
      REDEEMED: 'info',
      EXPIRED: 'danger',
    };
    return severityMap[status] || 'info';
  }

  getStatusClass(status: string): string {
    return status === 'EARNED' ? 'status-earned' : 'status-other';
  }

  // Métodos para PrimeNG Message
  getRewardMessageSeverity(
    reward: CustomerRewardResponseDto,
  ): 'success' | 'info' | 'warn' | 'error' {
    switch (reward.status) {
      case 'EARNED':
        return 'success'; // Verde para recompensas listas para canjear
      case 'IN_PROGRESS':
        return 'info'; // Azul para recompensas en progreso
      case 'REDEEMED':
        return 'warn'; // Amarillo para recompensas ya canjeadas
      case 'EXPIRED':
        return 'error'; // Rojo para recompensas expiradas
      default:
        return 'info';
    }
  }

  getRewardIcon(reward: CustomerRewardResponseDto): string {
    const type = reward.rewardProgram?.rewardType;
    switch (type) {
      case 'DISCOUNT_PERCENTAGE':
        return 'fa fa-percentage';
      case 'DISCOUNT_AMOUNT':
        return 'fa fa-euro-sign';
      case 'FREE_SERVICE':
        return 'fa fa-gift';
      case 'POINTS':
        return 'fa fa-coins';
      default:
        return 'fa fa-star';
    }
  }

  getProgressText(reward: CustomerRewardResponseDto): string {
    if (reward.status === 'IN_PROGRESS') {
      const progress = reward.currentProgress || 0;
      const target = reward.targetValue || 0;
      const percentage = target > 0 ? Math.round((progress / target) * 100) : 0;
      return `Progreso: ${progress}/${target} (${percentage}%)`;
    }
    return '';
  }

  // Nueva función para obtener solo recompensas disponibles (EARNED y con descuentos/puntos)
  availableRewards = computed(() => {
    return this.clientRewards().filter(
      (reward) =>
        reward.status === 'EARNED' &&
        reward.rewardProgram?.rewardType &&
        ['DISCOUNT_PERCENTAGE', 'DISCOUNT_AMOUNT', 'POINTS'].includes(
          reward.rewardProgram.rewardType,
        ),
    );
  });

  // Nueva función para severity de tipos de reward
  getRewardTypeSeverity(type?: string): 'success' | 'info' | 'warning' | 'danger' {
    const severityMap: { [key: string]: 'success' | 'info' | 'warning' | 'danger' } = {
      DISCOUNT_PERCENTAGE: 'success',
      DISCOUNT_AMOUNT: 'info',
      POINTS: 'warning',
      FREE_SERVICE: 'info',
    };
    return severityMap[type || ''] || 'info';
  }

  // Función para manejar el toggle del checkbox
  toggleRewardApplication(reward: CustomerRewardResponseDto, checked: boolean): void {
    if (!reward.id || reward.status !== 'EARNED') {
      return;
    }

    if (checked) {
      this.applyRewardAsItem(reward);
    } else {
      this.cancelRewardApplication(reward);
    }
  }

  // Client Search Modal Methods
  openClientSearchModal(): void {
    this.showClientSearchModal.set(true);
  }

  onClientSelected(client: ClientResponseDto): void {
    this.selectedClient.set(client);
    this.invoiceForm.patchValue({
      clientId: client.id,
    });
    this.showClientSearchModal.set(false);

    // Load client rewards if client is selected
    if (client.id) {
      this.loadClientRewards(client.id);
    }
  }

  onClientSearchModalClose(): void {
    this.showClientSearchModal.set(false);
  }

  clearSelectedClient(): void {
    this.selectedClient.set(null);
    this.invoiceForm.patchValue({
      clientId: null,
    });
    this.clearRewardsData();
  }
}
