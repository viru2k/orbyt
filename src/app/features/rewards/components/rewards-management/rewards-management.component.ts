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
import { DatePickerModule } from 'primeng/datepicker';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
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
  OrbMainHeaderComponent,
  OrbSelectComponent,
  OrbDatepickerComponent,
  OrbTagComponent,
} from '@orb-components';
import { OrbNumberInputComponent } from '@orb-shared-components/orb-number-input/orb-number-input.component';
import { TableColumn, OrbTableFeatures, OrbActionItem } from '@orb-models';
import { MenuItem } from 'primeng/api';

// Services and Models
import { RewardsManagementService } from '../../services/rewards-management.service';
import { RewardProgramResponseDto } from '../../../../api/models/reward-program-response-dto';

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
    DatePickerModule,
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
    OrbMainHeaderComponent,
    OrbSelectComponent,
    OrbDatepickerComponent,
    OrbTagComponent,
    OrbNumberInputComponent
  ],
  providers: [MessageService, ConfirmationService],
  template: `
       <orb-main-header
      title="Gestión de Programas de Recompensas"
      icon="fa fa-cog"
      subtitle="Configura y administra los programas de fidelización">
    </orb-main-header>

      <orb-card>

        <div orbBody>

          <div class="management-header">
            <orb-button
              label="Nuevo Programa"
              severity="info"
              variant="outlined"
              (clicked)="openCreateDialog()"
            >
              <i class="fa fa-plus"></i>
            </orb-button>

            <orb-button
              label="Actualizar Datos"
              severity="secondary"
              variant="outlined"
              (clicked)="refreshData()"
            >
              <i class="fa fa-refresh"></i>
            </orb-button>
          </div>

          <!-- Programs Table -->
          <orb-table
            [value]="rewardPrograms()"
            [columns]="tableColumns"
            [tableFeatures]="tableFeaturesConfig"
            [loading]="loading()"
            [rowsPerPageOptions]="[15, 30, 50]"
            [rows]="15"
          >
            <ng-template pTemplate="body" let-rowData let-columns="columns">
              <tr>
                @for (col of columns; track col.field) {
                  <td [style.width]="col.width">
                    @switch (col.field) {
                      @case ('name') {
                        <div class="program-info">
                          <strong>{{ rowData.name }}</strong>
                          <small class="text-muted" *ngIf="rowData.description">{{ rowData.description }}</small>
                        </div>
                      }
                      @case ('condition') {
                        <div class="condition-info">
                          <orb-tag
                            [value]="getConditionTypeLabel(rowData.conditionType)"
                            [severity]="'info'"
                            size="small"
                          >
                          </orb-tag>
                          <div class="condition-value">
                            <strong>{{ formatConditionValue(rowData) }}</strong>
                          </div>
                        </div>
                      }
                      @case ('reward') {
                        <div class="reward-info">
                          <orb-tag
                            [value]="getRewardTypeLabel(rowData.rewardType)"
                            [severity]="getRewardTypeSeverity(rowData.rewardType)"
                            size="small"
                          >
                          </orb-tag>
                          <div class="reward-value">
                            <strong>{{ formatRewardValue(rowData) }}</strong>
                          </div>
                        </div>
                      }
                      @case ('maxUses') {
                        <div class="text-center">
                          {{ rowData.maxUsesPerCustomer || '-' }}
                        </div>
                      }
                      @case ('statusText') {
                        <orb-tag
                          [value]="getStatusLabel(rowData.status)"
                          [severity]="getStatusSeverity(rowData.status)"
                          size="small"
                        >
                        </orb-tag>
                      }
                      @case ('dates') {
                        <div class="dates-info">
                          <small><strong>Inicio:</strong> {{ formatDate(rowData.validFrom) }}</small>
                          <small *ngIf="rowData.validUntil"><strong>Fin:</strong> {{ formatDate(rowData.validUntil) }}</small>
                          <small *ngIf="!rowData.validUntil" class="text-muted">Sin fecha fin</small>
                        </div>
                      }
                      @case ('actions') {
                        <orb-actions-popover [actions]="rewardRowActions" [itemData]="rowData">
                        </orb-actions-popover>
                      }
                    }
                  </td>
                }
              </tr>
            </ng-template>
          </orb-table>
        </div>
      </orb-card>

      <!-- Create/Edit Program Dialog -->
      <orb-dialog
        [(visible)]="showProgramDialog"
        [header]="isEditing ? '✏️ Editar Programa' : '🎁 Nuevo Programa de Recompensas'"
        size="xl"
      >
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
                    placeholder="Ej: Programa de Fidelidad VIP"
                  >
                  </orb-text-input>
                </orb-form-field>
              </div>

              <div class="form-field">
                <orb-form-field label="Descripción">
                  <orb-text-area
                    inputId="description"
                    formControlName="description"
                    [rows]="3"
                    [autoResize]="true"
                  >
                  </orb-text-area>
                </orb-form-field>
              </div>
            </div>

            <!-- Condition Configuration -->
            <div class="form-section">
              <h4>Configuración de Condición</h4>

              <div class="form-row">
                <div class="form-field">
                  <orb-form-field label="Tipo de Condición" [required]="true">
                    <orb-select
                      inputId="conditionType"
                      formControlName="conditionType"
                      [options]="conditionTypeOptions"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccionar tipo"
                      appendTo="body"
                    >
                    </orb-select>
                  </orb-form-field>
                </div>

                <div class="form-field">
                  <orb-form-field label="Valor de Condición" [required]="true">
                    <orb-number-input
                      inputId="conditionValue"
                      formControlName="conditionValue"
                      [min]="0"
                      placeholder="1"
                      [allowDecimals]="false"
                    >
                    </orb-number-input>
                  </orb-form-field>
                </div>
              </div>
            </div>

            <!-- Reward Configuration -->
            <div class="form-section">
              <h4>Configuración de Recompensa</h4>

              <div class="form-row">
                <div class="form-field">
                  <orb-form-field label="Tipo de Recompensa" [required]="true">
                    <orb-select
                      inputId="rewardType"
                      formControlName="rewardType"
                      [options]="rewardTypeOptions"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccionar tipo"
                      appendTo="body"
                    >
                    </orb-select>
                  </orb-form-field>
                </div>

                <div class="form-field">
                  <orb-form-field label="Valor de Recompensa" [required]="true">
                    <orb-number-input
                      inputId="rewardValue"
                      formControlName="rewardValue"
                      [min]="0"
                      placeholder="0"
                    >
                    </orb-number-input>
                  </orb-form-field>
                </div>
              </div>

              <div class="form-row">
                <div class="form-field">
                  <orb-form-field label="Máximo de Usos por Cliente" [required]="true">
                    <orb-number-input
                      inputId="maxUsesPerCustomer"
                      formControlName="maxUsesPerCustomer"
                      [min]="1"
                      placeholder="1"
                      [allowDecimals]="false"
                    >
                    </orb-number-input>
                  </orb-form-field>
                </div>
              </div>
            </div>

            <!-- Validity Period and Status -->
            <div class="form-section">
              <h4>Período de Vigencia y Estado</h4>

              <div class="form-row">
                <div class="form-field">
                  <orb-form-field label="Fecha de Inicio" [required]="true">
                    <orb-datepicker
                      inputId="startDate"
                      formControlName="startDate"
                      dateFormat="dd/mm/yy"
                      [showIcon]="true"
                      placeholder="Seleccionar fecha"
                      appendTo="body"
                    >
                    </orb-datepicker>
                  </orb-form-field>
                </div>

                <div class="form-field">
                  <orb-form-field label="Fecha de Fin">
                    <orb-datepicker
                      inputId="endDate"
                      formControlName="endDate"
                      dateFormat="dd/mm/yy"
                      [showIcon]="true"
                      placeholder="Sin fecha límite"
                      appendTo="body"
                    >
                    </orb-datepicker>
                  </orb-form-field>
                </div>
              </div>

              <div class="form-row">
                <div class="form-field">
                  <orb-form-field label="Estado del Programa" [required]="true">
                    <orb-select
                      inputId="status"
                      formControlName="status"
                      [options]="statusOptions"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Seleccionar estado"
                      appendTo="body"
                    >
                    </orb-select>
                  </orb-form-field>
                </div>
              </div>
            </div>
          </div>

          <div class="dialog-actions">
            <orb-button
              type="button"
              label="Cancelar"
              severity="secondary"
              variant="outlined"
              (clicked)="closeProgramDialog()"
            >
            </orb-button>

            <orb-button
              type="submit"
              [label]="isEditing ? 'Actualizar' : 'Crear Programa'"
              severity="success"
              variant="outlined"
              [disabled]="programForm.invalid || saving()"
              [loading]="saving()"
            >
            </orb-button>
          </div>
        </form>
      </orb-dialog>
    

    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>
  `,
  styleUrls: ['./rewards-management.component.scss'],
})
export class RewardsManagementComponent implements OnInit {
  private fb = inject(FormBuilder);
  private rewardsService = inject(RewardsManagementService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // Table configuration
  tableColumns: TableColumn[] = [
    { field: 'name', header: 'Programa', sortable: true, width: '25%' },
    { field: 'condition', header: 'Condición', sortable: false, width: '18%' },
    { field: 'reward', header: 'Recompensa', sortable: false, width: '18%' },
    { field: 'maxUses', header: 'Usos Máx.', sortable: true, width: '10%' },
    { field: 'statusText', header: 'Estado', sortable: true, width: '10%' },
    { field: 'dates', header: 'Vigencia', sortable: false, width: '15%' },
    { field: 'actions', header: '', width: '4%', sortable: false },
  ];

  tableFeaturesConfig: OrbTableFeatures = {
    showGlobalSearch: true,
    globalSearchPlaceholder: 'Buscar programas...',
  };

  rewardRowActions: OrbActionItem<RewardProgramResponseDto>[] = [
    {
      label: 'Editar',
      icon: 'fa fa-edit',
      action: (program?: RewardProgramResponseDto) => {
        if (program) {
          this.editProgram(program);
        }
      },
    },
    {
      label: 'Cambiar estado',
      icon: 'fa fa-toggle-on',
      action: (program?: RewardProgramResponseDto) => {
        if (program) {
          this.toggleProgramStatus(program);
        }
      },
    },
    {
      label: 'Eliminar',
      icon: 'fa fa-trash',
      action: (program?: RewardProgramResponseDto) => {
        if (program) {
          this.deleteProgram(program);
        }
      },
    },
  ];



  // State signals
  rewardPrograms = signal<RewardProgramResponseDto[]>([]);
  loading = signal(false);
  saving = signal(false);
  showProgramDialog = false;
  isEditing = false;
  editingProgram: RewardProgramResponseDto | null = null;

  programForm!: FormGroup;

  // Dropdown options
  conditionTypeOptions = [
    { label: 'Número de Visitas', value: 'VISIT_COUNT' },
    { label: 'Monto de Compra', value: 'PURCHASE_AMOUNT' },
    { label: 'Número de Servicios', value: 'SERVICE_COUNT' },
    { label: 'Número de Consultas', value: 'CONSULTATION_COUNT' },
  ];

  rewardTypeOptions = [
    { label: 'Descuento Porcentual', value: 'DISCOUNT_PERCENTAGE' },
    { label: 'Descuento Fijo', value: 'DISCOUNT_AMOUNT' },
    { label: 'Servicio Gratuito', value: 'FREE_SERVICE' },
    { label: 'Puntos', value: 'POINTS' },
  ];

  statusOptions = [
    { label: 'Activo', value: 'ACTIVE' },
    { label: 'Inactivo', value: 'INACTIVE' },
    { label: 'Borrador', value: 'DRAFT' },
  ];

  // Computed properties
  filteredPrograms = signal<RewardProgramResponseDto[]>([]);

  ngOnInit(): void {
    this.initializeForm();
    this.loadRewardPrograms();
  }

  private initializeForm(): void {
    this.programForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      businessTypeId: [1], // Default to current business type
      conditionType: ['VISIT_COUNT', Validators.required],
      conditionValue: [1, [Validators.required, Validators.min(0)]],
      rewardType: ['DISCOUNT_PERCENTAGE', Validators.required],
      rewardValue: [0, [Validators.required, Validators.min(0)]],
      maxUsesPerCustomer: [null],
      startDate: [new Date(), Validators.required],
      endDate: [null],
      status: ['ACTIVE'],
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
          detail: 'No se pudieron cargar los programas de recompensas',
        });
        this.loading.set(false);
      },
    });
  }

  openCreateDialog(): void {
    this.isEditing = false;
    this.editingProgram = null;
    this.programForm.reset();
    this.programForm.patchValue({
      businessTypeId: 1,
      conditionType: 'VISIT_COUNT',
      conditionValue: 1,
      rewardType: 'DISCOUNT_PERCENTAGE',
      rewardValue: 0,
      maxUsesPerCustomer: null,
      startDate: new Date(),
      status: 'ACTIVE',
    });
    this.showProgramDialog = true;
  }

  editProgram(program: RewardProgramResponseDto): void {
    this.isEditing = true;
    this.editingProgram = program;
    this.programForm.patchValue({
      name: program.name,
      description: program.description,
      conditionType: program.conditionType,
      conditionValue: program.conditionValue,
      rewardType: program.rewardType,
      rewardValue: program.rewardValue,
      maxUsesPerCustomer: program.maxUsesPerCustomer,
      startDate: program.validFrom ? new Date(program.validFrom) : new Date(),
      endDate: program.validUntil ? new Date(program.validUntil) : null,
      status: program.status,
    });
    this.showProgramDialog = true;
  }

  saveProgram(): void {
    if (this.programForm.invalid) return;

    this.saving.set(true);
    const formValues = this.programForm.value;

    // Format data for backend
    const programData = {
      name: formValues.name,
      description: formValues.description || '',
      conditionType: formValues.conditionType,
      conditionValue: formValues.conditionValue,
      rewardType: formValues.rewardType,
      rewardValue: formValues.rewardValue,
      maxUsesPerCustomer: formValues.maxUsesPerCustomer || 1,
      validFrom: formValues.startDate.toISOString(),
      validUntil: formValues.endDate ? formValues.endDate.toISOString() : null,
      status: formValues.status || 'ACTIVE',
      additionalConditions: {},
    };

    if (this.isEditing) {
      this.rewardsService.updateRewardProgram(this.editingProgram!.id, programData).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Programa actualizado exitosamente',
          });
          this.closeProgramDialog();
          this.loadRewardPrograms();
          this.saving.set(false);
        },
        error: (error: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo actualizar el programa',
          });
          this.saving.set(false);
        },
      });
    } else {
      this.rewardsService.createRewardProgram(programData as any).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Programa creado exitosamente',
          });
          this.closeProgramDialog();
          this.loadRewardPrograms();
          this.saving.set(false);
        },
        error: (error: any) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo crear el programa',
          });
          this.saving.set(false);
        },
      });
    }
  }

  closeProgramDialog(): void {
    this.showProgramDialog = false;
    this.isEditing = false;
    this.editingProgram = null;
    this.programForm.reset();
  }

  toggleProgramStatus(program: RewardProgramResponseDto): void {
    const isActive = program.status === 'ACTIVE';
    const action = isActive ? 'desactivar' : 'activar';
    const newStatus = isActive ? 'INACTIVE' : 'ACTIVE';

    this.confirmationService.confirm({
      message: `¿Está seguro de que desea ${action} este programa?`,
      header: `${action.charAt(0).toUpperCase() + action.slice(1)} Programa`,
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.rewardsService
          .updateRewardProgram(program.id, {
            status: newStatus,
          } as any)
          .subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Éxito',
                detail: `Programa ${action}do exitosamente`,
              });
              this.loadRewardPrograms();
            },
            error: () => {
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: `No se pudo ${action} el programa`,
              });
            },
          });
      },
    });
  }

  deleteProgram(program: RewardProgramResponseDto): void {
    this.confirmationService.confirm({
      message:
        '¿Está seguro de que desea eliminar este programa? Esta acción no se puede deshacer.',
      header: 'Eliminar Programa',
      icon: 'pi pi-trash',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.rewardsService.deleteRewardProgram(program.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Programa eliminado exitosamente',
            });
            this.loadRewardPrograms();
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo eliminar el programa',
            });
          },
        });
      },
    });
  }

  refreshData(): void {
    this.loadRewardPrograms();
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.programForm.get(fieldName);
    return !!(field?.invalid && (field?.dirty || field?.touched));
  }

  getConditionTypeLabel(type: string): string {
    const translations: Record<string, string> = {
      'VISIT_COUNT': 'Número de Visitas',
      'PURCHASE_AMOUNT': 'Monto de Compra',
      'SERVICE_COUNT': 'Número de Servicios',
      'CONSULTATION_COUNT': 'Número de Consultas'
    };
    return translations[type] || type;
  }

  getRewardTypeLabel(type: string): string {
    const translations: Record<string, string> = {
      'DISCOUNT_PERCENTAGE': 'Descuento Porcentual',
      'DISCOUNT_AMOUNT': 'Descuento Fijo',
      'FREE_SERVICE': 'Servicio Gratuito',
      'POINTS': 'Puntos'
    };
    return translations[type] || type;
  }

  getRewardTypeSeverity(type: string): 'success' | 'info' | 'secondary' | 'danger' | 'warning' {
    switch (type) {
      case 'DISCOUNT_PERCENTAGE':
      case 'DISCOUNT_AMOUNT':
        return 'success';
      case 'FREE_SERVICE':
        return 'info';
      case 'POINTS':
        return 'warning';
      default:
        return 'secondary';
    }
  }

  formatConditionValue(program: RewardProgramResponseDto): string {
    const value = parseFloat(program.conditionValue as any) || 0;
    switch (program.conditionType) {
      case 'VISIT_COUNT':
        return `${value} ${value === 1 ? 'visita' : 'visitas'}`;
      case 'PURCHASE_AMOUNT':
        return `${value.toFixed(2)} €`;
      case 'SERVICE_COUNT':
        return `${value} ${value === 1 ? 'servicio' : 'servicios'}`;
      case 'CONSULTATION_COUNT':
        return `${value} ${value === 1 ? 'consulta' : 'consultas'}`;
      default:
        return value.toString();
    }
  }

  formatRewardValue(program: RewardProgramResponseDto): string {
    const value = parseFloat(program.rewardValue as any) || 0;
    switch (program.rewardType) {
      case 'DISCOUNT_PERCENTAGE':
        return `${value}%`;
      case 'DISCOUNT_AMOUNT':
        return `${value.toFixed(2)} €`;
      case 'FREE_SERVICE':
        return 'Servicio gratuito';
      case 'POINTS':
        return `${value} pts`;
      default:
        return value.toString() || '-';
    }
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'ACTIVE': 'Activo',
      'INACTIVE': 'Inactivo',
      'DRAFT': 'Borrador'
    };
    return labels[status] || status;
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'secondary' | 'danger' | 'warning' {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'INACTIVE':
        return 'secondary';
      case 'DRAFT':
        return 'warning';
      default:
        return 'secondary';
    }
  }

  getRewardValueSuffix(): string {
    const type = this.programForm.get('rewardType')?.value;
    switch (type) {
      case 'DISCOUNT_PERCENTAGE':
        return '%';
      case 'DISCOUNT_AMOUNT':
        return ' €';
      case 'POINTS':
        return ' pts';
      default:
        return '';
    }
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return '-';
    }
  }
}
