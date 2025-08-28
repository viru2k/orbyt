import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// PrimeNG Components
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';

// Orb Components
import { OrbButtonComponent, OrbTextInputComponent, OrbFormFieldComponent, OrbFormFooterComponent, OrbSelectComponent, OrbDatepickerComponent, OrbTextAreaComponent } from '@orb-components';

// Services and Models
import { InvoicesService } from '../../../api/services/invoices.service';
import { ClientsService } from '../../../api/services/clients.service';
import { ProductsService } from '../../../api/services/products.service';
import { InvoiceResponseDto } from '../../../api/models/invoice-response-dto';
import { CreateInvoiceDto } from '../../../api/models/create-invoice-dto';
import { UpdateInvoiceDto } from '../../../api/models/update-invoice-dto';
import { CreateInvoiceItemDto } from '../../../api/models/create-invoice-item-dto';
import { ClientResponseDto } from '../../../api/models/client-response-dto';
import { ProductResponseDto } from '../../../api/models/product-response-dto';
import { MessageService, ConfirmationService } from 'primeng/api';
import { FormButtonAction } from '@orb-models';
import { FloatLabelModule } from 'primeng/floatlabel';

interface InvoiceItem {
  itemId: number;
  itemType: 'service' | 'product';
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  total: number;
  notes?: string;
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
    OrbTextInputComponent,
    OrbFormFieldComponent,
    OrbFormFooterComponent,
    OrbSelectComponent,
    OrbDatepickerComponent,
    OrbTextAreaComponent,
    OrbButtonComponent,
    FloatLabelModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="invoice-form-container">
      <form [formGroup]="invoiceForm" (ngSubmit)="onSubmit()">
        <!-- Basic Information -->
        <div class="form-section">
          <h3><i class="fa fa-info-circle"></i> Información Básica</h3>
          
          <div class="form-grid">
            <orb-form-field label="Cliente" [required]="true">
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

            <orb-form-field label="Fecha de Vencimiento">
                 <p-floatlabel variant="on">
  <orb-datepicker
                formControlName="dueDate"
                [showIcon]="true"
                dateFormat="dd/mm/yy">
              </orb-datepicker>
                 </p-floatlabel>
            
            </orb-form-field>

            <orb-form-field label="Estado">
              <orb-select
                formControlName="status"
                [options]="statusOptions"                
                optionLabel="label"
                optionValue="value">
              </orb-select>
            </orb-form-field>

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

        <!-- Items Section -->
        <div class="form-section">
          <h3>
            <i class="fa fa-list"></i> Items de la Factura
            <orb-button
              label="Agregar Item"
              icon="fa fa-plus"
              (clicked)="addItem()"
              variant="secondary"
              size="small">
            </orb-button>
          </h3>

          <div class="items-table" *ngIf="items.length > 0">
            <p-table [value]="items" [scrollable]="true" scrollHeight="300px">
              <ng-template pTemplate="header">
                <tr>
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
                <div class="summary-row total">
                  <span><strong>Total:</strong></span>
                  <span><strong>{{ total | currency:'EUR':'symbol':'1.2-2' }}</strong></span>
                </div>
              </div>
            </div>
          </div>
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
  private messageService = inject(MessageService);

  invoiceForm!: FormGroup;
  loading = signal(false);
  isEditMode = false;

  // Data signals
  clientOptions = signal<ClientResponseDto[]>([]);
  productOptions = signal<ProductResponseDto[]>([]);

  // Invoice items
  items: InvoiceItem[] = [];

  // Totals
  subtotal = 0;
  generalDiscount = 0;
  taxAmount = 0;
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
    } else {
      this.addItem(); // Add one default item for new invoices
    }
  }

  private initForm(): void {
    this.invoiceForm = this.fb.group({
      clientId: [null, Validators.required],
      consultationId: [null],
      dueDate: [null],
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
      total: item.total,
      notes: item.notes
    }));

    this.calculateTotals();
  }

  addItem(): void {
    this.items.push({
      itemId: 0,
      itemType: 'service',
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      discountType: 'percentage',
      total: 0
    });
  }

  removeItem(index: number): void {
    this.items.splice(index, 1);
    this.calculateTotals();
  }

  updateItemTotal(index: number): void {
    const item = this.items[index];
    if (!item) return;

    let itemTotal = item.quantity * item.unitPrice;
    
    if (item.discount > 0) {
      if (item.discountType === 'percentage') {
        itemTotal -= (itemTotal * item.discount / 100);
      } else {
        itemTotal -= item.discount;
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

    // Calculate tax
    const taxRate = this.invoiceForm.get('taxRate')?.value || 0;
    const taxableAmount = this.subtotal - this.generalDiscount;
    this.taxAmount = taxableAmount * taxRate / 100;

    // Calculate total
    this.total = taxableAmount + this.taxAmount;
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
      itemId: item.itemId,
      itemType: item.itemType,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      discountType: item.discountType,
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
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Factura creada exitosamente'
          });
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
}