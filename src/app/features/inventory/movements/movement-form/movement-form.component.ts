import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MovementStore } from '../../shared/stores/movement.store';
import { CreateStockMovementDto } from '../../../../api/models';
import { FormButtonAction } from '@orb-models';
import { UtilsService } from '@orb-services';

// PrimeNG & Orb Components
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';
import { SharedModule } from 'primeng/api';
import { OrbFormFooterComponent, OrbFormFieldComponent, OrbTextInputComponent, OrbTextAreaComponent } from '@orb-components';
import { OrbCardComponent } from '@orb-shared-components/application/orb-card/orb-card.component';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';

export interface MovementTypeOption {
  label: string;
  value: 'in' | 'out' | 'adjustment' | 'usage';
  icon: string;
  description: string;
}

@Component({
  selector: 'orb-movement-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    FloatLabelModule,
    DropdownModule,
    InputNumberModule,
    CalendarModule,
    TextareaModule,
    SharedModule,
    OrbFormFooterComponent,
    OrbFormFieldComponent,
    OrbTextAreaComponent,
    OrbCardComponent,
    ToastModule
  ],
  templateUrl: './movement-form.component.html',
  styleUrls: ['./movement-form.component.scss']
})
export class MovementFormComponent implements OnInit {
  @Input() productId!: number;
  @Input() productName!: string;
  @Output() saved = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private movementStore = inject(MovementStore);
  public utilsService = inject(UtilsService);

  form!: FormGroup;

  get movementTypes(): MovementTypeOption[] {
    return [
    {
      label: 'Entrada',
      value: 'in',
      icon: 'pi pi-arrow-down',
      description: 'Compra, devolución de cliente, recepción de stock'
    },
    {
      label: 'Salida',
      value: 'out',
      icon: 'pi pi-arrow-up',
      description: 'Venta, defecto, robo, pérdida'
    },
    {
      label: 'Ajuste',
      value: 'adjustment',
      icon: 'pi pi-sliders-h',
      description: 'Corrección de inventario, ajuste manual'
    },
    {
      label: 'Uso Interno',
      value: 'usage',
      icon: 'pi pi-cog',
      description: 'Consumo interno, muestras, degustación'
    }
    ];
  }

  footerActions: FormButtonAction[] = [
    { label: 'Cancelar', action: 'cancel', styleType: 'p-button-text', severity: 'secondary' },
    { label: 'Registrar Movimiento', action: 'save', styleType: 'p-button-success', buttonType: 'submit', severity: 'info' },
  ];

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.form = this.fb.group({
      type: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      reason: [''],
      date: [new Date(), Validators.required]
    });
  }

  handleFooterAction(action: string): void {
    if (action === 'save') {
      this.onSubmit();
    } else if (action === 'cancel') {
      this.cancel.emit();
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();

    const createDto: CreateStockMovementDto = {
      productId: this.productId,
      type: formValue.type,
      quantity: formValue.quantity,
      reason: formValue.reason || undefined
    };

    this.movementStore.createMovement(createDto);
    this.saved.emit();
  }

  getSelectedTypeDescription(): string {
    const selectedType = this.form.get('type')?.value;
    if (!selectedType) return '';
    
    const typeOption = this.movementTypes.find(t => t.value === selectedType);
    return typeOption?.description || '';
  }
}