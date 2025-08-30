import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Subject, takeUntil, finalize } from 'rxjs';

import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ChipModule } from 'primeng/chip';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

import { ConfirmationService, MessageService } from 'primeng/api';

import { OrbCardComponent } from '@orb-shared-components/application/orb-card/orb-card.component';
import { OrbButtonComponent } from '@orb-shared-components/orb-button/orb-button.component';
import { OrbSelectComponent } from '@orb-shared-components/orb-select/orb-select.component';
import { OrbTextInputComponent } from '@orb-shared-components/orb-text-input/orb-text-input.component';

import { DateRangeSelectorComponent, DateSelection } from '../date-range-selector/date-range-selector.component';
import { AgendaBlockingStore } from '../../store/agenda-blocking.store';
import { 
  BlockedDateItem, 
  BlockingType, 
  BulkBlockingConfig, 
  BlockingOperationResult,
  DateBlockingUtils 
} from '../../models/agenda-blocking.models';

@Component({
  selector: 'app-blocking-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ConfirmDialogModule,
    ToastModule,
    ChipModule,
    TableModule,
    TagModule,
    OrbCardComponent,
    OrbButtonComponent,
    OrbSelectComponent,
    OrbTextInputComponent,
    DateRangeSelectorComponent
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './blocking-management.component.html',
  styleUrls: ['./blocking-management.component.scss']
})
export class BlockingManagementComponent implements OnInit, OnDestroy {
  @Input() professionalId: number | undefined;
  @Output() operationCompleted = new EventEmitter<BlockingOperationResult>();

  form: FormGroup;
  blockedDates: BlockedDateItem[] = [];
  selectedDates: BlockedDateItem[] = [];
  loading = false;
  
  blockingTypes = [
    { label: 'Día Bloqueado', value: BlockingType.BLOCKED, severity: 'danger' },
    { label: 'Horario Personalizado', value: BlockingType.CUSTOM_SCHEDULE, severity: 'info' },
    { label: 'Día Festivo', value: BlockingType.HOLIDAY, severity: 'success' }
  ];

  currentDateSelection: DateSelection | null = null;
  
  // Propiedad para usar en el template
  minDateForPicker = new Date();

  // Para la tabla
  cols = [
    { field: 'date', header: 'Fecha', sortable: true },
    { field: 'type', header: 'Tipo', sortable: true },
    { field: 'reason', header: 'Motivo', sortable: true },
    { field: 'note', header: 'Nota', sortable: false },
    { field: 'actions', header: 'Acciones', sortable: false }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private agendaBlockingStore: AgendaBlockingStore,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {
    this.form = this.createForm();
  }

  ngOnInit(): void {
    this.setupStoreSubscriptions();
    this.loadBlockedDates();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      blockingType: [BlockingType.BLOCKED, Validators.required],
      reason: [''],
      note: ['']
    });
  }

  // Getter methods for form controls
  get blockingTypeControl(): FormControl {
    return this.form.get('blockingType') as FormControl;
  }

  get reasonControl(): FormControl {
    return this.form.get('reason') as FormControl;
  }

  get noteControl(): FormControl {
    return this.form.get('note') as FormControl;
  }

  private setupStoreSubscriptions(): void {
    // Suscribirse a las fechas bloqueadas
    this.agendaBlockingStore.blockedDates$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(dates => {
      this.blockedDates = dates;
    });

    // Suscribirse a los estados de carga
    this.agendaBlockingStore.loadingStates$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(states => {
      this.loading = states.blocking || states.unblocking || states.loadingBlockedDates;
    });

    // Suscribirse a errores
    this.agendaBlockingStore.error$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(error => {
      if (error) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error
        });
      }
    });
  }

  private loadBlockedDates(): void {
    // Cargar fechas para los próximos 12 meses
    const fromDate = DateBlockingUtils.formatDateToString(new Date());
    const toDate = new Date();
    toDate.setFullYear(toDate.getFullYear() + 1);
    const toDateString = DateBlockingUtils.formatDateToString(toDate);
    
    this.agendaBlockingStore.loadBlockedDates(fromDate, toDateString, this.professionalId);
  }

  /**
   * Manejar selección de fechas del componente selector
   */
  onDateSelectionChange(selection: DateSelection): void {
    this.currentDateSelection = selection;
  }

  /**
   * Limpiar selección de fechas
   */
  onClearDateSelection(): void {
    this.currentDateSelection = null;
  }

  /**
   * Bloquear las fechas seleccionadas
   */
  blockSelectedDates(): void {
    if (!this.currentDateSelection || this.currentDateSelection.dates.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Por favor selecciona al menos una fecha para bloquear'
      });
      return;
    }

    const formValue = this.form.value;
    const config: BulkBlockingConfig = {
      dates: this.currentDateSelection.dates,
      reason: formValue.reason || this.currentDateSelection.reason,
      type: formValue.blockingType
    };

    this.confirmationService.confirm({
      message: `¿Estás seguro de bloquear ${config.dates.length} fecha(s)?`,
      header: 'Confirmar Bloqueo',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.agendaBlockingStore.blockDates(config, this.professionalId).pipe(
          finalize(() => {
            // Limpiar selección después de la operación
            this.currentDateSelection = null;
            this.form.patchValue({ reason: '', note: '' });
          })
        ).subscribe(result => {
          if (result.success) {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: result.message
            });
            this.operationCompleted.emit(result);
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: result.message
            });
          }
        });
      }
    });
  }

  /**
   * Desbloquear fechas seleccionadas de la tabla
   */
  unblockSelectedDates(): void {
    if (this.selectedDates.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Por favor selecciona fechas para desbloquear'
      });
      return;
    }

    const datesToUnblock = this.selectedDates.map(item => item.date);
    
    this.confirmationService.confirm({
      message: `¿Estás seguro de desbloquear ${datesToUnblock.length} fecha(s)?`,
      header: 'Confirmar Desbloqueo',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.agendaBlockingStore.unblockDates(datesToUnblock, this.professionalId).subscribe(result => {
          if (result.success) {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: result.message
            });
            this.selectedDates = [];
            this.operationCompleted.emit(result);
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: result.message
            });
          }
        });
      }
    });
  }

  /**
   * Desbloquear una fecha individual
   */
  unblockDate(dateItem: BlockedDateItem): void {
    this.confirmationService.confirm({
      message: `¿Desbloquear la fecha ${this.formatDateForDisplay(dateItem.date)}?`,
      header: 'Confirmar Desbloqueo',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.agendaBlockingStore.unblockDates([dateItem.date], this.professionalId).subscribe(result => {
          if (result.success) {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Fecha desbloqueada correctamente'
            });
            this.operationCompleted.emit(result);
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: result.message
            });
          }
        });
      }
    });
  }

  /**
   * Obtener la severidad del tag según el tipo de bloqueo
   */
  getTypeSeverity(type: BlockingType): string {
    const typeConfig = this.blockingTypes.find(bt => bt.value === type);
    return typeConfig?.severity || 'info';
  }

  /**
   * Obtener el label del tipo de bloqueo
   */
  getTypeLabel(type: BlockingType): string {
    const typeConfig = this.blockingTypes.find(bt => bt.value === type);
    return typeConfig?.label || type;
  }

  /**
   * Formatear fecha para display
   */
  formatDateForDisplay(date: string): string {
    return DateBlockingUtils.formatDateForDisplay(date);
  }

  /**
   * Verificar si una fecha está en el pasado
   */
  isPastDate(date: string): boolean {
    return DateBlockingUtils.isPastDate(date);
  }

  /**
   * Verificar si hay fechas seleccionadas para bloquear
   */
  hasSelectedDatesToBlock(): boolean {
    return (this.currentDateSelection?.dates.length ?? 0) > 0;
  }

  /**
   * Verificar si hay fechas seleccionadas para desbloquear
   */
  hasSelectedDatesToUnblock(): boolean {
    return this.selectedDates.length > 0;
  }

  /**
   * Refrescar la lista de fechas bloqueadas
   */
  refreshBlockedDates(): void {
    this.loadBlockedDates();
  }
}