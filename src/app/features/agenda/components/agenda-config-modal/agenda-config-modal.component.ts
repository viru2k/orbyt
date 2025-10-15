import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { OrbDialogComponent } from '@orb-shared-components/orb-dialog/orb-dialog.component';
import { OrbButtonComponent } from '@orb-shared-components/orb-button/orb-button.component';
import { OrbFormFooterComponent } from '@orb-shared-components/application/orb-form-footer/orb-form-footer.component';
import { OrbCardComponent } from '@orb-shared-components/application/orb-card/orb-card.component';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { TabViewModule } from 'primeng/tabview';

import { AgendaStore } from '../../../../store/agenda/agenda.store';
import { AgendaConfigResponseDto, UpdateAgendaConfigDto, HolidayResponseDto, CreateHolidayDto } from '../../../../api/model/models';
import { ConfirmationService } from 'primeng/api';
import { OrbSwitchComponent } from "@orb-components";
import { OrbCheckboxComponent } from '@orb-shared-components/orb-checkbox/orb-checkbox.component';
import { FormButtonAction } from '@orb-models';

// Importar los nuevos componentes de gestión de fechas
import { BlockingManagementComponent } from '../blocking-management/blocking-management.component';
import { SpecialScheduleComponent } from '../special-schedule/special-schedule.component';

@Component({
  selector: 'app-agenda-config-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    OrbDialogComponent,
    OrbButtonComponent,
    OrbFormFooterComponent,
    OrbCardComponent,
    ConfirmDialogModule,
    TooltipModule,    
    InputTextModule,
    InputNumberModule,
    DatePickerModule,
    TableModule,
    DropdownModule,
    CheckboxModule,
    TabViewModule,
    OrbSwitchComponent,
    BlockingManagementComponent,
    SpecialScheduleComponent,
    OrbCheckboxComponent
],
  templateUrl: './agenda-config-modal.component.html',
  styleUrls: ['./agenda-config-modal.component.scss'],
  providers: [ConfirmationService]
})
export class AgendaConfigModalComponent implements OnInit, OnDestroy, OnChanges {
  @Input() visible = false;
  @Input() config: AgendaConfigResponseDto | null = null;
  @Input() professionalId: number | undefined;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() close = new EventEmitter<void>();

  configForm!: FormGroup;
  holidayForm!: FormGroup;
  showAddHolidayForm = false;
  private destroy$ = new Subject<void>();

  footerButtons: FormButtonAction[] = [
    {
      label: 'Cancelar',
      action: 'cancel',
      severity: 'secondary',
      styleType: 'text'
    },
    {
      label: 'Guardar Configuración',
      action: 'save',
      severity: 'success',
      icon: 'pi pi-save',
      outlined: true
    }
  ];

  weekDays = [
    { value: 'MONDAY', label: 'Lunes', number: 1 },
    { value: 'TUESDAY', label: 'Martes', number: 2 },
    { value: 'WEDNESDAY', label: 'Miércoles', number: 3 },
    { value: 'THURSDAY', label: 'Jueves', number: 4 },
    { value: 'FRIDAY', label: 'Viernes', number: 5 },
    { value: 'SATURDAY', label: 'Sábado', number: 6 },
    { value: 'SUNDAY', label: 'Domingo', number: 0 }
  ];

  constructor(
    private fb: FormBuilder,
    public agendaStore: AgendaStore,
    private confirmationService: ConfirmationService
  ) {
    this.initForm();
    this.initHolidayForm();
  }

  ngOnInit(): void {    
    
    // Subscribe to config changes
    this.agendaStore.agendaConfig$
      .pipe(takeUntil(this.destroy$))
      .subscribe(config => {
        if (config) {
          this.populateForm(config);
        }
      });

    // Subscribe to holidays to debug
    this.agendaStore.agendaHolydays$
      .pipe(takeUntil(this.destroy$))
      .subscribe(holidays => {        
      });
  }

  ngOnChanges(changes: SimpleChanges): void {    
    
    // When visible changes to true, load data
    if (changes['visible']) {      
      
      if (changes['visible'].currentValue === true) {        
        // Add a small delay to ensure the modal is fully rendered before loading data
        setTimeout(() => {
          this.loadModalData();
        }, 100);
      } else if (changes['visible'].currentValue === false) {        
        // Clear the store data to avoid stale data issues
        // But don't reset the form immediately as it might cause issues
        this.showAddHolidayForm = false;
        this.holidayForm.reset();
      }
    }
    
    // When professionalId changes, reload data if modal is visible
    if (changes['professionalId'] && this.visible) {      
      this.loadModalData();
    }
  }

  private loadModalData(): void {    
    
    // Load current config if not provided
    if (!this.config) {
      this.agendaStore.loadAgendaConfig(this.professionalId || undefined);
    }

    // Load holidays for the professional - only if professionalId exists
    if (this.professionalId) {      
      this.agendaStore.loadAgendaHolidays(this.professionalId);
    } else {
      console.warn('AgendaConfigModal - No professionalId provided, skipping holidays load');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.configForm = this.fb.group({
      startTime: ['09:00', [Validators.required, Validators.pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)]],
      endTime: ['18:00', [Validators.required, Validators.pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)]],
      slotDuration: [30, [Validators.required, Validators.min(15), Validators.max(120)]],
      overbookingAllowed: [false],
      allowBookingOnBlockedDays: [false],
      workingDays: this.fb.array([])
    });

    // Initialize working days checkboxes
    this.initWorkingDays();
  }

  private initWorkingDays(): void {
    const workingDaysArray = this.configForm.get('workingDays') as FormArray;
    
    this.weekDays.forEach(day => {
      workingDaysArray.push(this.fb.control(false));
    });
  }

  private populateForm(config: any): void {    
    
    // Adapt the backend response to the form structure
    this.configForm.patchValue({
      startTime: config.startTime?.substring(0, 5) || config.workStart, // "09:00:00" -> "09:00"
      endTime: config.endTime?.substring(0, 5) || config.workEnd,       // "18:00:00" -> "18:00"
      slotDuration: config.slotDuration || config.slotDurationMinutes,
      overbookingAllowed: config.overbookingAllowed ?? config.allowOverbooking,
      allowBookingOnBlockedDays: config.allowBookingOnBlockedDays
    });

    // Set working days - backend returns ["TUESDAY", "WEDNESDAY"] (UPPERCASE)
    const workingDaysArray = this.configForm.get('workingDays') as FormArray;
    this.weekDays.forEach((day, index) => {
      // Backend might return days in different formats, so we check both
      const backendDayCapitalized = day.value.charAt(0).toUpperCase() + day.value.slice(1).toLowerCase(); // "TUESDAY" -> "Tuesday"
      const isWorkingDay = config.workingDays?.includes(day.value) || // Check UPPERCASE ("TUESDAY")
                          config.workingDays?.includes(backendDayCapitalized) || // Check Capitalized ("Tuesday") 
                          config.workingDays?.includes(day.number); // Check by number
            
      workingDaysArray.at(index).setValue(isWorkingDay);
    });
        
  }

  get workingDaysControls() {
    return (this.configForm.get('workingDays') as FormArray).controls as FormControl[];
  }

  onHide(): void {    
    // Reset form state when manually closing
    this.configForm.reset();
    this.initForm();
    this.showAddHolidayForm = false;
    this.holidayForm.reset();
    // Let the parent handle the visibility change
    this.close.emit();
  }

  onSave(): void {
    if (this.configForm.valid) {
      const formValue = this.configForm.value;
      
      // Build working days array - backend expects UPPERCASE format
      const selectedWorkingDays = this.weekDays
        .filter((day, index) => formValue.workingDays[index])
        .map(day => day.value); // day.value is already "TUESDAY", "WEDNESDAY", etc.

      const updateDto: UpdateAgendaConfigDto = {
        startTime: formValue.startTime,
        endTime: formValue.endTime,
        slotDuration: formValue.slotDuration,
        overbookingAllowed: formValue.overbookingAllowed,
        allowBookingOnBlockedDays: formValue.allowBookingOnBlockedDays,
        workingDays: selectedWorkingDays
      };
            

      this.agendaStore.updateAgendaConfig({ 
        professionalId: this.professionalId || undefined,
        config: updateDto 
      });
      
      // Don't auto-close the modal after saving
      // Let the user manually close it if they want to make more changes
    }
  }

  onCancel(): void {
    this.onHide();
  }

  handleFooterAction(action: string): void {    
    if (action === 'save') {
      this.onSave();
    } else if (action === 'cancel') {
      this.onCancel();
    }
  }

  private initHolidayForm(): void {
    this.holidayForm = this.fb.group({
      date: ['', Validators.required],
      reason: ['', [Validators.maxLength(255)]]
    });
  }

  trackByHolidayId(index: number, holiday: HolidayResponseDto): number {
    return holiday.id;
  }

  formatDisplayDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  onDeleteHoliday(holiday: HolidayResponseDto): void {
    this.confirmationService.confirm({
      message: `¿Estás seguro de que quieres eliminar el feriado del ${this.formatDisplayDate(holiday.date)}?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.agendaStore.deleteHolidayEffect({ holidayId: holiday.id });
      },
    });
  }

  onAddHoliday(): void {
    if (this.holidayForm.valid) {
      const formValue = this.holidayForm.value;
      
      const newHoliday: CreateHolidayDto = {
        date: formValue.date,
        reason: formValue.reason || undefined
      };

      this.agendaStore.addHolidayEffect({ 
        professionalId: this.professionalId || undefined,
        holiday: newHoliday 
      });
      
      this.agendaStore.holidaysLoading$
        .pipe(takeUntil(this.destroy$))
        .subscribe(loading => {
          if (!loading) {
            this.onCancelAddHoliday();
          }
        });
    }
  }

  onCancelAddHoliday(): void {
    this.showAddHolidayForm = false;
    this.holidayForm.reset();
  }

  /**
   * Manejar operaciones completadas de bloqueo/desbloqueo de fechas
   */
  onBlockingOperationCompleted(result: any): void {    
    // Aquí podrías agregar lógica adicional si es necesario
    // Por ejemplo, refrescar datos o mostrar notificaciones
  }

  /**
   * Manejar operaciones completadas de horarios especiales
   */
  onScheduleOperationCompleted(result: any): void {    
    // Aquí podrías agregar lógica adicional si es necesario
    // Por ejemplo, refrescar datos o mostrar notificaciones
  }
}