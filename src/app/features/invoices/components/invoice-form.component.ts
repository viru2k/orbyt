import { Component, EventEmitter, Input, OnInit, Output, inject, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// PrimeNG Components
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TableModule } from 'primeng/table';
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
import { OrbButtonComponent, OrbTextInputComponent, OrbFormFieldComponent, OrbFormFooterComponent, OrbSelectComponent, OrbDatepickerComponent, OrbTextAreaComponent } from '@orb-components';

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
import { CustomerRewardResponseDto, TriggerPurchaseCompletedDto, PurchaseCompletedResponseDto } from '../../../api/models';
import { MessageService, ConfirmationService } from 'primeng/api';
import { FormButtonAction } from '@orb-models';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ItemSelectorModalComponent, InvoiceItemSelection } from './item-selector-modal.component';

interface InvoiceItem {
  itemId?: number | null;
  itemType?: 'service' | 'product' | 'manual';
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
    TableModule,
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
    FloatLabelModule,
    ItemSelectorModalComponent
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="invoice-form-container">
      <form [formGroup]="invoiceForm" (ngSubmit)="onSubmit()">
        <!-- Basic Information -->
        <div class="form-section">
          <h3><i class="fa fa-info-circle"></i> Información Básica</h3>

          <!-- Header Row: Cliente, Fecha, Tipo de Comprobante -->
          <div class="header-row">
            <orb-form-field label="Cliente" [required]="true" class="header-client">
              <orb-select
                formControlName="clientId"
                [options]="clientOptions()"
                optionLabel="fullname"
                optionValue="id"
                [showClear]="true"
                [filter]="true"
                filterBy="fullname,email">
              </orb-select>
            </orb-form-field>

            <orb-form-field label="Fecha de Vencimiento" class="header-date">
              <p-floatlabel variant="on">
                <orb-datepicker
                  formControlName="dueDate"
                  [showIcon]="true"
                  dateFormat="dd/mm/yy">
                </orb-datepicker>
              </p-floatlabel>
            </orb-form-field>

            <orb-form-field label="Estado" class="header-status">
              <orb-select
                formControlName="status"
                [options]="statusOptions"
                optionLabel="label"
                optionValue="value">
              </orb-select>
            </orb-form-field>
          </div>

          <!-- Additional Fields Row -->
          <div class="form-grid">
            <orb-form-field label="Método de Pago">
              <orb-select
                formControlName="paymentMethod"
                [options]="paymentMethodOptions"
                optionLabel="label"
                optionValue="value">
              </orb-select>
            </orb-form-field>
          </div>
        </div>

        <!-- Available Rewards Table -->
        <div class="form-section" *ngIf="selectedClient() && availableRewards().length > 0">
          <h3>
            <i class="fa fa-star"></i> Descuentos y Recompensas Disponibles
          </h3>

          <p-table [value]="availableRewards()" styleClass="rewards-table">
            <ng-template pTemplate="header">
              <tr>
                <th>Recompensa</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Puntos</th>
                <th style="width: 80px;">Aplicar</th>
              </tr>
            </ng-template>

            <ng-template pTemplate="body" let-reward>
              <tr [class.applied-reward]="appliedRewards().includes(reward.id!)">
                <td>
                  <div class="reward-info">
                    <strong>{{ reward.rewardProgram?.name || 'Recompensa' }}</strong>
                    <br>
                    <small class="text-muted">{{ reward.rewardProgram?.description }}</small>
                  </div>
                </td>
                <td>
                  <p-tag
                    [value]="getRewardTypeLabel(reward.rewardProgram?.rewardType)"
                    [severity]="getRewardTypeSeverity(reward.rewardProgram?.rewardType)">
                  </p-tag>
                </td>
                <td>
                  <span class="reward-value">{{ getRewardValueDisplay(reward) }}</span>
                </td>
                <td>
                  <span class="points-display" *ngIf="reward.rewardProgram?.rewardType === 'POINTS'">
                    {{ reward.currentProgress || 0 }} pts
                  </span>
                  <span *ngIf="reward.rewardProgram?.rewardType !== 'POINTS'" class="text-muted">-</span>
                </td>
                <td class="text-center">
                  <p-checkbox
                    [ngModel]="appliedRewards().includes(reward.id!)"
                    (ngModelChange)="toggleRewardApplication(reward, $event)"
                    [disabled]="reward.status !== 'EARNED'"
                    binary="true">
                  </p-checkbox>
                </td>
              </tr>
            </ng-template>

            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="5" class="text-center text-muted py-3">
                  No hay recompensas disponibles para aplicar
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>

        <!-- Items Section -->
        <div class="form-section">
          <h3>
            <i class="fa fa-list"></i> Items de la Factura
            <div class="item-actions">
              <orb-button
                label="Seleccionar Item"
                icon="fa fa-search"
                (clicked)="showItemSelector()"
                variant="primary"
                size="small">
              </orb-button>
              <orb-button
                label="Agregar Manual"
                icon="fa fa-plus"
                (clicked)="addManualItem()"
                variant="secondary"
                size="small">
              </orb-button>
            </div>
          </h3>

          <div class="items-table" *ngIf="items.length > 0">
            <p-table [value]="items" [scrollable]="true" scrollHeight="300px">
              <ng-template pTemplate="header">
                <tr>
                  <th>Tipo</th>
                  <th>Descripción</th>
                  <th>Cantidad</th>
                  <th>Precio Unit.</th>
                  <th>Descuento</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-item let-i="rowIndex">
                <tr>
                  <td>
                    <span class="item-type-badge" [ngClass]="'type-' + item.itemType">
                      {{ getItemTypeLabel(item.itemType) }}
                    </span>
                    <div class="item-category" *ngIf="item.category">
                      <small>{{ item.category }}</small>
                    </div>
                  </td>
                  <td>
                    <orb-text-input
                      [(ngModel)]="item.description"
                      [ngModelOptions]="{standalone: true}"
                      (ngModelChange)="updateItemTotal(i)"
                      >
                    </orb-text-input>
                  </td>
                  <td>
                    <input
                      type="number"
                      class="orb-input"
                      [(ngModel)]="item.quantity"
                      [ngModelOptions]="{standalone: true}"
                      (ngModelChange)="updateItemTotal(i)"
                      min="1"
                      step="1"
                      placeholder="1">
                  </td>
                  <td>
                    <input
                      type="number"
                      class="orb-input"
                      [(ngModel)]="item.unitPrice"
                      [ngModelOptions]="{standalone: true}"
                      (ngModelChange)="updateItemTotal(i)"
                      min="0"
                      step="0.01"
                      placeholder="0.00">
                  </td>
                  <td>
                    <div class="discount-container">
                      <input
                        type="number"
                        class="orb-input"
                        [(ngModel)]="item.discount"
                        [ngModelOptions]="{standalone: true}"
                        (ngModelChange)="updateItemTotal(i)"
                        min="0"
                        step="0.01"
                        placeholder="0">
                      <orb-select
                        [(ngModel)]="item.discountType"
                        [ngModelOptions]="{standalone: true}"
                        [options]="discountTypeOptions"
                        (ngModelChange)="updateItemTotal(i)"
                        optionLabel="label"
                        optionValue="value">
                      </orb-select>
                    </div>
                  </td>
                  <td>
                    <strong>{{ item.total | currency:'EUR':'symbol':'1.2-2' }}</strong>
                  </td>
                  <td>
                    <orb-button
                      icon="fa fa-trash"
                      (clicked)="removeItem(i)"
                      variant="danger"
                      size="small">
                    </orb-button>
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </div>

          <div class="empty-items" *ngIf="items.length === 0">
            <i class="fa fa-inbox"></i>
            <p>No hay items en la factura. Haz clic en "Agregar Item" para comenzar.</p>
          </div>
        </div>

        <!-- Summary Section -->
        <div class="form-section">
          <h3><i class="fa fa-calculator"></i> Resumen</h3>
          
          <div class="summary-grid">
            <div class="summary-left">
              <orb-form-field label="Descuento General">
                <div class="discount-container">
                  <input
                    type="number"
                    class="orb-input"
                    formControlName="discount"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    (input)="calculateTotals()">
                  <orb-select
                    formControlName="discountType"
                    [options]="discountTypeOptions"
                    (selectionChange)="calculateTotals()"
                    optionLabel="label"
                    optionValue="value">
                  </orb-select>
                </div>
              </orb-form-field>

              <orb-form-field label="Tasa de Impuestos (%)">
                                <div class="discount-container">
  <input
                    type="number"
                    class="orb-input"
                    formControlName="taxRate"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="21"
                    (input)="calculateTotals()">
                                </div>
              

              </orb-form-field>
            </div>

            <div class="summary-right">
              <div class="summary-totals">
                <div class="summary-row">
                  <span>Subtotal:</span>
                  <span>{{ subtotal | currency:'EUR':'symbol':'1.2-2' }}</span>
                </div>
                <div class="summary-row" *ngIf="generalDiscount > 0">
                  <span>Descuento:</span>
                  <span>-{{ generalDiscount | currency:'EUR':'symbol':'1.2-2' }}</span>
                </div>
                <div class="summary-row" *ngIf="taxAmount > 0">
                  <span>Impuestos:</span>
                  <span>{{ taxAmount | currency:'EUR':'symbol':'1.2-2' }}</span>
                </div>
                <div class="summary-row" *ngIf="pointsDiscountAmount > 0">
                  <span>Descuento con puntos:</span>
                  <span>-{{ pointsDiscountAmount | currency:'EUR':'symbol':'1.2-2' }}</span>
                </div>
                <div class="summary-row total">
                  <span><strong>Total:</strong></span>
                  <span><strong>{{ total | currency:'EUR':'symbol':'1.2-2' }}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Rewards Section -->
        <div class="form-section" *ngIf="showRewardsPreview()">
          <h3><i class="fa fa-star"></i> Recompensas del Cliente</h3>

          <p-card styleClass="rewards-card">
            <ng-template pTemplate="header">
              <div class="rewards-header">
                <div class="client-info" *ngIf="selectedClient()">
                  <h4>{{ selectedClient()?.name }} {{ selectedClient()?.lastName }}</h4>
                  <p *ngIf="selectedClient()?.email" class="client-email">
                    <i class="fa fa-envelope"></i> {{ selectedClient()?.email }}
                  </p>
                </div>
              </div>
            </ng-template>

            <div class="rewards-content">
              <!-- Available Points -->
              <div class="points-section">
                <div class="points-header">
                  <h5><i class="fa fa-coins"></i> Puntos Disponibles</h5>
                  <div class="points-badge">
                    <span class="points-count">{{ availablePoints() }}</span>
                    <span class="points-label">puntos</span>
                  </div>
                </div>

                <div class="points-value">
                  <small>Valor: {{ (availablePoints() * 0.01) | currency:'EUR':'symbol':'1.2-2' }}</small>
                </div>

                <!-- Points Application -->
                <div class="points-application" *ngIf="availablePoints() > 0">
                  <div class="apply-points-container">
                    <label for="pointsInput">Aplicar puntos como descuento:</label>
                    <div class="points-input-group">
                      <input
                        id="pointsInput"
                        type="number"
                        class="orb-input points-input"
                        [value]="pointsToApply()"
                        (input)="applyPoints(+$any($event).target.value)"
                        [min]="0"
                        [max]="getMaxApplicablePoints()"
                        placeholder="0">
                      <span class="points-suffix">pts</span>
                      <orb-button
                        label="Aplicar Todo"
                        size="small"
                        variant="secondary"
                        (clicked)="applyPoints(getMaxApplicablePoints())">
                      </orb-button>
                      <orb-button
                        label="Limpiar"
                        size="small"
                        variant="danger"
                        (clicked)="clearAppliedPoints()"
                        *ngIf="pointsToApply() > 0">
                      </orb-button>
                    </div>
                    <small class="points-help">
                      Máximo aplicable: {{ getMaxApplicablePoints() }} pts
                      ({{ (getMaxApplicablePoints() * 0.01) | currency:'EUR':'symbol':'1.2-2' }})
                    </small>
                  </div>
                </div>
              </div>

              <p-divider></p-divider>

              <!-- Active Rewards Preview -->
              <div class="rewards-preview">
                <h5><i class="fa fa-gift"></i> Recompensas Activas</h5>
                <div class="rewards-list">
                  <div class="reward-item" *ngFor="let reward of clientRewards()">
                    <div class="reward-info">
                      <span class="reward-name">{{ reward.rewardProgram?.name }}</span>
                      <p-tag
                        [value]="getRewardStatusLabel(reward.status)"
                        [severity]="getRewardStatusSeverity(reward.status)"
                        size="small">
                      </p-tag>
                    </div>
                    <div class="reward-progress" *ngIf="reward.status === 'IN_PROGRESS'">
                      <p-progressBar
                        [value]="(reward.currentProgress || 0) / (reward.targetValue || 1) * 100"
                        [style]="{height: '0.5rem'}">
                      </p-progressBar>
                      <small>{{ reward.currentProgress || 0 }} / {{ reward.targetValue || 0 }}</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </p-card>
        </div>

        <!-- Additional Information -->
        <div class="form-section">
          <h3><i class="fa fa-sticky-note"></i> Información Adicional</h3>
          
          <div class="form-grid">
            <orb-form-field label="Notas de la Factura">
              <orb-text-area
                formControlName="notes"
                [rows]="3">
              </orb-text-area>
            </orb-form-field>

            <orb-form-field label="Referencia de Pago">
              <orb-text-input
                formControlName="paymentReference"
                >
              </orb-text-input>
            </orb-form-field>

            <orb-form-field label="Notas de Pago">
              <orb-text-area
                formControlName="paymentNotes"                
                [rows]="3">
              </orb-text-area>
            </orb-form-field>
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
    <p-confirmDialog></p-confirmDialog>

    <!-- Item Selector Modal -->
    <app-item-selector-modal
      [(visible)]="showItemSelectorModal"
      (itemSelected)="onItemSelected($event)"
      (cancel)="onItemSelectorCancel()">
    </app-item-selector-modal>

    <!-- Rewards Generation Modal -->
    <p-dialog
      [visible]="showRewardsModal()"
      [modal]="true"
      [closable]="true"
      [resizable]="false"
      [draggable]="false"
      styleClass="rewards-modal"
      header="¡Recompensas Generadas!"
      [style]="{width: '500px'}"
      (onHide)="onRewardsModalClose()">

      <div class="rewards-modal-content" *ngIf="rewardsToGenerate()">
        <!-- Client Info -->
        <div class="modal-client-info" *ngIf="selectedClient()">
          <h4><i class="fa fa-user"></i> {{ selectedClient()?.name }} {{ selectedClient()?.lastName }}</h4>
          <p *ngIf="selectedClient()?.email">
            <i class="fa fa-envelope"></i> {{ selectedClient()?.email }}
          </p>
        </div>

        <p-divider></p-divider>

        <!-- Rewards Summary -->
        <div class="rewards-summary">
          <div class="summary-item points-earned">
            <div class="summary-icon">
              <i class="fa fa-coins fa-2x"></i>
            </div>
            <div class="summary-content">
              <h3>{{ rewardsToGenerate()?.pointsEarned || 0 }}</h3>
              <p>Puntos Ganados</p>
              <small>Valor: {{ ((rewardsToGenerate()?.pointsEarned || 0) * 0.01) | currency:'EUR':'symbol':'1.2-2' }}</small>
            </div>
          </div>

          <div class="summary-item rewards-unlocked" *ngIf="(rewardsToGenerate()?.rewardsUnlocked || 0) > 0">
            <div class="summary-icon">
              <i class="fa fa-gift fa-2x"></i>
            </div>
            <div class="summary-content">
              <h3>{{ rewardsToGenerate()?.rewardsUnlocked || 0 }}</h3>
              <p>Recompensas Desbloqueadas</p>
              <small>¡Nuevas recompensas disponibles!</small>
            </div>
          </div>
        </div>

        <!-- Success Message -->
        <div class="success-message">
          <i class="fa fa-check-circle"></i>
          <p>Las recompensas se han aplicado exitosamente a la cuenta del cliente.</p>
        </div>
      </div>

      <ng-template pTemplate="footer">
        <orb-button
          label="Continuar"
          variant="primary"
          (clicked)="onRewardsModalClose()">
        </orb-button>
      </ng-template>
    </p-dialog>
  `,
  styleUrls: ['./invoice-form.component.scss']
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
  rewardsToGenerate = signal<PurchaseCompletedResponseDto | null>(null);
  pointsToApply = signal(0);
  appliedRewards = signal<number[]>([]);

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
    { label: 'Cancelada', value: 'cancelled' }
  ];

  paymentMethodOptions = [
    { label: 'Efectivo', value: 'cash' },
    { label: 'Tarjeta', value: 'card' },
    { label: 'Transferencia', value: 'transfer' },
    { label: 'Cheque', value: 'check' },
    { label: 'Otro', value: 'other' }
  ];

  discountTypeOptions = [
    { label: '%', value: 'percentage' },
    { label: '€', value: 'fixed' }
  ];

  footerActions: FormButtonAction[] = [
    { label: 'Cancelar', action: 'cancel', styleType: 'p-button-text', severity: 'secondary' },
    { label: 'Guardar', action: 'save', styleType: 'p-button-success', buttonType: 'submit', severity: 'info' }
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
      taxRate: [21] // Default IVA rate
    });

    // Subscribe to changes for real-time calculation
    this.invoiceForm.valueChanges.subscribe(() => {
      this.calculateTotals();
    });

    // Subscribe to client changes to load rewards
    this.invoiceForm.get('clientId')?.valueChanges.subscribe((clientId) => {
      if (clientId) {
        this.loadClientRewards(clientId);
        const client = this.clientOptions().find(c => c.id === clientId);
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
          detail: 'Error al cargar la lista de clientes'
        });
      }
    });
  }

  private loadProducts(): void {
    this.productsService.productControllerFindAll().subscribe({
      next: (products) => {
        this.productOptions.set(products);
      },
      error: (error) => {
        console.error('Error loading products:', error);
      }
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
      taxRate: this.invoice.taxRate
    });

    // Populate items
    this.items = this.invoice.items.map(item => ({
      itemId: item.itemId,
      itemType: item.itemType,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      discountType: item.discountType,
      total: 0, // Will be recalculated
      notes: item.notes
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
      duration: selection.duration
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
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      discountType: 'percentage',
      total: 0
    });

    // Calculate total for the new manual item
    this.updateItemTotal(newIndex);
  }

  getItemTypeLabel(type: string): string {
    switch (type) {
      case 'product': return 'Producto';
      case 'service': return 'Servicio';
      case 'manual': return 'Manual';
      default: return type;
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
        itemTotal -= (itemTotal * (item.discount || 0) / 100);
      } else {
        itemTotal -= (item.discount || 0);
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
      this.generalDiscount = this.subtotal * discountValue / 100;
    } else {
      this.generalDiscount = discountValue;
    }

    // Calculate points discount (1 point = 0.01 EUR)
    this.pointsDiscountAmount = this.pointsToApply() * 0.01;

    // Calculate tax
    const taxRate = this.invoiceForm.get('taxRate')?.value || 0;
    const taxableAmount = this.subtotal - this.generalDiscount - this.pointsDiscountAmount;
    this.taxAmount = Math.max(0, taxableAmount) * taxRate / 100;

    // Calculate total
    this.total = Math.max(0, taxableAmount + this.taxAmount);
  }

  onSubmit(): void {
    if (this.invoiceForm.invalid || this.items.length === 0) {
      this.invoiceForm.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario incompleto',
        detail: 'Por favor, completa todos los campos requeridos y agrega al menos un item'
      });
      return;
    }

    this.loading.set(true);

    const formValue = this.invoiceForm.value;
    const invoiceItems: CreateInvoiceItemDto[] = this.items.map(item => ({
      itemId: item.itemId || 0, // Use 0 for manual items
      itemType: (item.itemType === 'manual' ? 'service' : item.itemType) as 'service' | 'product', // Convert manual to service for backend
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount || 0,
      discountType: item.discountType || 'percentage',
      notes: item.notes
    }));

    if (this.isEditMode && this.invoice) {
      const updateData: UpdateInvoiceDto = {
        ...formValue,
        items: invoiceItems,
        dueDate: formValue.dueDate ? formValue.dueDate.toISOString() : undefined
      };

      this.invoicesService.invoiceControllerUpdate({ id: this.invoice.id, body: updateData }).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Factura actualizada exitosamente'
          });
          this.saved.emit();
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error updating invoice:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al actualizar la factura'
          });
          this.loading.set(false);
        }
      });
    } else {
      const createData: CreateInvoiceDto = {
        ...formValue,
        items: invoiceItems,
        dueDate: formValue.dueDate ? formValue.dueDate.toISOString() : undefined
      };

      this.invoicesService.invoiceControllerCreate({ body: createData }).subscribe({
        next: (newInvoice) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Factura creada exitosamente'
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
            detail: 'Error al crear la factura'
          });
          this.loading.set(false);
        }
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
        const hasRedeemableRewards = rewards.some(reward => reward.status === 'EARNED');
        if (hasRedeemableRewards) {
          this.messageService.add({
            severity: 'warn',
            summary: '⭐ Recompensas Disponibles',
            detail: `El cliente tiene ${rewards.filter(r => r.status === 'EARNED').length} recompensa(s) disponible(s) para canjear`,
            life: 6000
          });
        }
      },
      error: (error) => {
        console.error('Error loading client rewards:', error);
        this.clearRewardsData();
      }
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
      items: this.items.map(item => ({
        serviceId: item.itemId || 1,
        quantity: item.quantity,
        amount: item.total
      }))
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
      }
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
      type: 'reward',
      description: `Recompensa: ${reward.rewardProgram?.name || 'Descuento'}`,
      quantity: 1,
      unitPrice: -rewardValue, // Negative value for discount
      total: -rewardValue,
      rewardId: reward.id
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
      life: 3000
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
    this.items = this.items.filter(item => item.rewardId !== reward.id);

    // Remove from applied rewards
    const currentApplied = this.appliedRewards();
    this.appliedRewards.set(currentApplied.filter(id => id !== reward.id));

    this.calculateTotals();

    this.messageService.add({
      severity: 'info',
      summary: 'Recompensa Cancelada',
      detail: 'Se removió la recompensa de la factura',
      life: 3000
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
      'DISCOUNT_PERCENTAGE': 'Descuento %',
      'DISCOUNT_AMOUNT': 'Descuento €',
      'FREE_SERVICE': 'Servicio Gratis',
      'POINTS': 'Puntos'
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
      'IN_PROGRESS': 'info',
      'EARNED': 'success',
      'REDEEMED': 'info',
      'EXPIRED': 'danger'
    };
    return severityMap[status] || 'info';
  }

  getStatusClass(status: string): string {
    return status === 'EARNED' ? 'status-earned' : 'status-other';
  }

  // Métodos para PrimeNG Message
  getRewardMessageSeverity(reward: CustomerRewardResponseDto): 'success' | 'info' | 'warn' | 'error' {
    switch (reward.status) {
      case 'EARNED':
        return 'success';  // Verde para recompensas listas para canjear
      case 'IN_PROGRESS':
        return 'info';     // Azul para recompensas en progreso
      case 'REDEEMED':
        return 'warn';     // Amarillo para recompensas ya canjeadas
      case 'EXPIRED':
        return 'error';    // Rojo para recompensas expiradas
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
    return this.clientRewards().filter(reward =>
      reward.status === 'EARNED' &&
      reward.rewardProgram?.rewardType &&
      ['DISCOUNT_PERCENTAGE', 'DISCOUNT_AMOUNT', 'POINTS'].includes(reward.rewardProgram.rewardType)
    );
  });

  // Nueva función para severity de tipos de reward
  getRewardTypeSeverity(type?: string): 'success' | 'info' | 'warning' | 'danger' {
    const severityMap: { [key: string]: 'success' | 'info' | 'warning' | 'danger' } = {
      'DISCOUNT_PERCENTAGE': 'success',
      'DISCOUNT_AMOUNT': 'info',
      'POINTS': 'warning',
      'FREE_SERVICE': 'info'
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
}