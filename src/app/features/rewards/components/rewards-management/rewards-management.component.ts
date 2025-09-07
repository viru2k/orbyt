import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

// PrimeNG Components
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { CalendarModule } from 'primeng/calendar';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';

// Orb Components
import { 
  OrbCardComponent, 
  OrbButtonComponent,
  OrbDialogComponent,
  OrbFormFieldComponent,
  OrbTextInputComponent,
  OrbTextAreaComponent,
  OrbTableComponent,
  OrbActionsPopoverComponent,
  OrbBreadcrumbComponent
} from '@orb-components';
import { TableColumn, OrbTableFeatures, OrbActionItem } from '@orb-models';
import { MenuItem } from 'primeng/api';

// Services and Models
import { RewardsManagementService } from '../../services/rewards-management.service';
import { 
  RewardProgram, 
  CreateRewardProgramDto, 
  UpdateRewardProgramDto,
  RewardType 
} from '../../models/reward.models';

@Component({
  selector: 'app-rewards-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    DropdownModule,
    CheckboxModule,
    CalendarModule,
    TableModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    OrbCardComponent,
    OrbButtonComponent,
    OrbDialogComponent,
    OrbFormFieldComponent,
    OrbTextInputComponent,
    OrbTextAreaComponent,
    OrbTableComponent,
    OrbActionsPopoverComponent,
    OrbBreadcrumbComponent
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="rewards-management-container">
      <orb-card>
        <div orbHeader>
          <h2><i class="fa fa-gift"></i> Gestión de Programas de Recompensas</h2>
          <p class="header-subtitle">Configura y administra los programas de fidelización</p>
        </div>

        <div orbBody>
          <orb-breadcrumb [items]="breadcrumbItems"></orb-breadcrumb>
          
          <div class="management-header">
            <orb-button
              label="Nuevo Programa"
              icon="fa fa-plus"
              variant="primary"
              (clicked)="openCreateDialog()">
            </orb-button>

            <orb-button
              label="Actualizar Datos"
              icon="fa fa-refresh"
              variant="secondary"
              (clicked)="refreshData()">
            </orb-button>
          </div>

          <!-- Programs Table -->
          <orb-table
            [value]="rewardPrograms()"
            [columns]="tableColumns"
            [tableFeatures]="tableFeaturesConfig"
            [loading]="loading()"
            [rowsPerPageOptions]="[15, 30, 50]"
            [rows]="15">
            
            <ng-template #cellTemplate let-column="column" let-data="data">
              @switch (column.field) {
                @case ('name') {
                  <div class="program-info">
                    <strong>{{ data.name }}</strong>
                    <small class="text-muted">{{ data.description }}</small>
                  </div>
                }
                @case ('rewardType') {
                  <p-tag 
                    [value]="getRewardTypeLabel(data.rewardType)"
                    [severity]="getRewardTypeSeverity(data.rewardType)">
                  </p-tag>
                }
                @case ('pointsRequired') {
                  {{ data.pointsRequired | number }}
                }
                @case ('rewardValue') {
                  {{ formatRewardValue(data) }}
                }
                @case ('statusText') {
                  <p-tag 
                    [value]="data.isActive ? 'Activo' : 'Inactivo'"
                    [severity]="data.isActive ? 'success' : 'secondary'">
                  </p-tag>
                }
                @case ('startDate') {
                  <div class="dates">
                    <small>Inicio: {{ formatDate(data.startDate) }}</small>
                    <small *ngIf="data.endDate">Fin: {{ formatDate(data.endDate) }}</small>
                  </div>
                }
                @case ('actions') {
                  <orb-actions-popover 
                    [actions]="rewardRowActions"
                    [itemData]="data">
                  </orb-actions-popover>
                }
              }
            </ng-template>
            
            <ng-template #emptyTemplate>
              <div class="empty-message">
                <i class="fa fa-gift fa-3x text-muted"></i>
                <p>No hay programas de recompensas configurados</p>
                <orb-button
                  label="Crear Primer Programa"
                  variant="primary"
                  (clicked)="openCreateDialog()">
                </orb-button>
              </div>
            </ng-template>
          </orb-table>
        </div>
      </orb-card>

      <!-- Create/Edit Program Dialog -->
      <orb-dialog 
        [(visible)]="showProgramDialog" 
        [header]="isEditing ? '✏️ Editar Programa' : '🎁 Nuevo Programa de Recompensas'"
        size="xl">
        
        <form [formGroup]="programForm" (ngSubmit)="saveProgram()">
          <div class="form-grid">
            <!-- Basic Information -->
            <div class="form-section">
              <h4>Información Básica</h4>
              
              <div class="form-field">
                <orb-form-field label="Nombre del Programa" [required]="true">
                  <orb-text-input
                    inputId="name"
                    formControlName="name"
                    placeholder="Ej: Programa de Fidelidad VIP">
                  </orb-text-input>
                </orb-form-field>
              </div>

              <div class="form-field">
                <orb-form-field label="Descripción">
                  <orb-text-area
                    inputId="description"
                    formControlName="description"
                    [rows]="3"
                    [autoResize]="true">
                  </orb-text-area>
                </orb-form-field>
              </div>
            </div>

            <!-- Reward Configuration -->
            <div class="form-section">
              <h4>Configuración de Recompensa</h4>
              
              <div class="form-row">
                <div class="form-field">
                  <label for="rewardType">Tipo de Recompensa *</label>
                  <p-dropdown
                    id="rewardType"
                    formControlName="rewardType"
                    [options]="rewardTypeOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Seleccionar tipo">
                  </p-dropdown>
                </div>

                <div class="form-field">
                  <label for="rewardValue">Valor de Recompensa *</label>
                  <p-inputNumber
                    id="rewardValue"
                    formControlName="rewardValue"
                    [min]="0"
                    [suffix]="getRewardValueSuffix()"
                    placeholder="0">
                  </p-inputNumber>
                </div>
              </div>

              <div class="form-row">
                <div class="form-field">
                  <label for="pointsRequired">Puntos Requeridos *</label>
                  <p-inputNumber
                    id="pointsRequired"
                    formControlName="pointsRequired"
                    [min]="1"
                    placeholder="100">
                  </p-inputNumber>
                </div>

                <div class="form-field">
                  <label for="maxRedemptions">Límite de Canjes</label>
                  <p-inputNumber
                    id="maxRedemptions"
                    formControlName="maxRedemptions"
                    [min]="1"
                    placeholder="Sin límite">
                  </p-inputNumber>
                </div>
              </div>
            </div>

            <!-- Validity Period -->
            <div class="form-section">
              <h4>Período de Vigencia</h4>
              
              <div class="form-row">
                <div class="form-field">
                  <label for="startDate">Fecha de Inicio *</label>
                  <p-calendar
                    id="startDate"
                    formControlName="startDate"
                    dateFormat="dd/mm/yy"
                    [showIcon]="true"
                    placeholder="Seleccionar fecha">
                  </p-calendar>
                </div>

                <div class="form-field">
                  <label for="endDate">Fecha de Fin</label>
                  <p-calendar
                    id="endDate"
                    formControlName="endDate"
                    dateFormat="dd/mm/yy"
                    [showIcon]="true"
                    placeholder="Sin fecha límite">
                  </p-calendar>
                </div>
              </div>
            </div>
          </div>

          <div class="dialog-actions">
            <orb-button
              type="button"
              label="Cancelar"
              variant="secondary"
              (clicked)="closeProgramDialog()">
            </orb-button>
            
            <orb-button
              type="submit"
              [label]="isEditing ? 'Actualizar' : 'Crear Programa'"
              variant="primary"
              [disabled]="programForm.invalid || saving()"
              [loading]="saving()">
            </orb-button>
          </div>
        </form>
      </orb-dialog>
    </div>

    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>
  `,
  styleUrls: ['./rewards-management.component.scss']
})
export class RewardsManagementComponent implements OnInit {
  private fb = inject(FormBuilder);
  private rewardsService = inject(RewardsManagementService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // Table configuration
  tableColumns: TableColumn[] = [
    { field: 'name', header: 'Programa', sortable: true },
    { field: 'rewardType', header: 'Tipo de Recompensa', sortable: true },
    { field: 'pointsRequired', header: 'Puntos Requeridos', sortable: true },
    { field: 'rewardValue', header: 'Valor', sortable: true },
    { field: 'statusText', header: 'Estado', sortable: true },
    { field: 'startDate', header: 'Vigencia', sortable: true },
    { field: 'actions', header: 'Acciones', sortable: false }
  ];

  tableFeaturesConfig: OrbTableFeatures = {
    showGlobalSearch: true,
    globalSearchPlaceholder: 'Buscar programas...'
  };

  rewardRowActions: OrbActionItem<RewardProgram>[] = [
    {
      label: 'Editar',
      icon: 'fa fa-edit',
      action: (program?: RewardProgram) => {
        if (program) {
          this.editProgram(program);
        }
      }
    },
    {
      label: 'Cambiar estado',
      icon: 'fa fa-toggle-on',
      action: (program?: RewardProgram) => {
        if (program) {
          this.toggleProgramStatus(program);
        }
      }
    },
    {
      label: 'Eliminar',
      icon: 'fa fa-trash',
      action: (program?: RewardProgram) => {
        if (program) {
          this.deleteProgram(program);
        }
      }
    }
  ];

  breadcrumbItems: MenuItem[] = [
    { label: 'Inicio', icon: 'fa fa-home', routerLink: '/dashboard' },
    { label: 'Gestión', icon: 'fa fa-cogs' },
    { label: 'Recompensas', icon: 'fa fa-gift' }
  ];

  // State signals
  rewardPrograms = signal<RewardProgram[]>([]);
  loading = signal(false);
  saving = signal(false);
  showProgramDialog = false;
  isEditing = false;
  editingProgram: RewardProgram | null = null;

  programForm!: FormGroup;

  // Dropdown options
  rewardTypeOptions = [
    { label: 'Descuento Porcentual', value: RewardType.DISCOUNT_PERCENTAGE },
    { label: 'Descuento Fijo', value: RewardType.DISCOUNT_FIXED },
    { label: 'Servicio Gratuito', value: RewardType.FREE_SERVICE },
    { label: 'Tarjeta de Regalo', value: RewardType.GIFT_CARD },
    { label: 'Cashback', value: RewardType.CASHBACK }
  ];

  // Computed properties  
  filteredPrograms = signal<RewardProgram[]>([]);

  ngOnInit(): void {
    this.initializeForm();
    this.loadRewardPrograms();
  }

  private initializeForm(): void {
    this.programForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      businessTypeId: [1], // Default to current business type
      rewardType: [RewardType.DISCOUNT_PERCENTAGE, Validators.required],
      rewardValue: [0, [Validators.required, Validators.min(0)]],
      pointsRequired: [100, [Validators.required, Validators.min(1)]],
      maxRedemptions: [null],
      startDate: [new Date(), Validators.required],
      endDate: [null]
    });
  }

  loadRewardPrograms(): void {
    this.loading.set(true);
    this.rewardsService.loadRewardPrograms().subscribe({
      next: (programs) => {
        this.rewardPrograms.set(programs);
        this.loading.set(false);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los programas de recompensas'
        });
        this.loading.set(false);
      }
    });
  }

  openCreateDialog(): void {
    this.isEditing = false;
    this.editingProgram = null;
    this.programForm.reset();
    this.programForm.patchValue({
      businessTypeId: 1,
      rewardType: RewardType.DISCOUNT_PERCENTAGE,
      rewardValue: 0,
      pointsRequired: 100,
      startDate: new Date()
    });
    this.showProgramDialog = true;
  }

  editProgram(program: RewardProgram): void {
    this.isEditing = true;
    this.editingProgram = program;
    this.programForm.patchValue({
      ...program,
      startDate: new Date(program.startDate),
      endDate: program.endDate ? new Date(program.endDate) : null
    });
    this.showProgramDialog = true;
  }

  saveProgram(): void {
    if (this.programForm.invalid) return;

    this.saving.set(true);
    const formValues = this.programForm.value;
    
    // Format dates
    const programData = {
      ...formValues,
      startDate: formValues.startDate.toISOString(),
      endDate: formValues.endDate ? formValues.endDate.toISOString() : null
    };

    const operation$ = this.isEditing
      ? this.rewardsService.updateRewardProgram(this.editingProgram!.id, programData)
      : this.rewardsService.createRewardProgram(programData);

    operation$.subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: `Programa ${this.isEditing ? 'actualizado' : 'creado'} exitosamente`
        });
        this.closeProgramDialog();
        this.loadRewardPrograms();
        this.saving.set(false);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `No se pudo ${this.isEditing ? 'actualizar' : 'crear'} el programa`
        });
        this.saving.set(false);
      }
    });
  }

  closeProgramDialog(): void {
    this.showProgramDialog = false;
    this.isEditing = false;
    this.editingProgram = null;
    this.programForm.reset();
  }

  toggleProgramStatus(program: RewardProgram): void {
    const action = program.isActive ? 'desactivar' : 'activar';
    
    this.confirmationService.confirm({
      message: `¿Está seguro de que desea ${action} este programa?`,
      header: `${action.charAt(0).toUpperCase() + action.slice(1)} Programa`,
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.rewardsService.updateRewardProgram(program.id, { 
          isActive: !program.isActive 
        }).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: `Programa ${action}do exitosamente`
            });
            this.loadRewardPrograms();
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: `No se pudo ${action} el programa`
            });
          }
        });
      }
    });
  }

  deleteProgram(program: RewardProgram): void {
    this.confirmationService.confirm({
      message: '¿Está seguro de que desea eliminar este programa? Esta acción no se puede deshacer.',
      header: 'Eliminar Programa',
      icon: 'pi pi-trash',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.rewardsService.deleteRewardProgram(program.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Programa eliminado exitosamente'
            });
            this.loadRewardPrograms();
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo eliminar el programa'
            });
          }
        });
      }
    });
  }

  refreshData(): void {
    this.loadRewardPrograms();
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.programForm.get(fieldName);
    return !!(field?.invalid && (field?.dirty || field?.touched));
  }

  getRewardTypeLabel(type: string): string {
    const option = this.rewardTypeOptions.find(opt => opt.value === type);
    return option?.label || type;
  }

  getRewardTypeSeverity(type: string): string {
    switch (type) {
      case RewardType.DISCOUNT_PERCENTAGE:
      case RewardType.DISCOUNT_FIXED:
        return 'success';
      case RewardType.FREE_SERVICE:
        return 'info';
      case RewardType.GIFT_CARD:
        return 'warn';
      case RewardType.CASHBACK:
        return 'secondary';
      default:
        return 'secondary';
    }
  }

  formatRewardValue(program: RewardProgram): string {
    switch (program.rewardType) {
      case RewardType.DISCOUNT_PERCENTAGE:
        return `${program.rewardValue}%`;
      case RewardType.DISCOUNT_FIXED:
      case RewardType.CASHBACK:
        return `$${program.rewardValue}`;
      case RewardType.GIFT_CARD:
        return `$${program.rewardValue}`;
      case RewardType.FREE_SERVICE:
        return 'Servicio gratuito';
      default:
        return program.rewardValue.toString();
    }
  }

  getRewardValueSuffix(): string {
    const type = this.programForm.get('rewardType')?.value;
    switch (type) {
      case RewardType.DISCOUNT_PERCENTAGE:
        return '%';
      case RewardType.DISCOUNT_FIXED:
      case RewardType.CASHBACK:
      case RewardType.GIFT_CARD:
        return '$';
      default:
        return '';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES');
  }
}