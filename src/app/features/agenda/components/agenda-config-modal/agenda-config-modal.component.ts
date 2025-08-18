import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { OrbDialogComponent } from '@orb-shared-components/orb-dialog/orb-dialog.component';
import { OrbButtonComponent } from '@orb-shared-components/orb-button/orb-button.component';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';
import { TableModule } from 'primeng/table';

import { AgendaStore } from '../../../../store/agenda/agenda.store';
import { AgendaConfigResponseDto, UpdateAgendaConfigDto, HolidayResponseDto, CreateHolidayDto } from '../../../../api/model/models';
import { ConfirmationService } from 'primeng/api';
import { OrbSwitchComponent } from "@orb-components";

@Component({
  selector: 'app-agenda-config-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    OrbDialogComponent,
    OrbButtonComponent,
    ConfirmDialogModule,
    TooltipModule,
    FloatLabelModule,
    InputTextModule,
    InputNumberModule,
    CalendarModule,
    TableModule,
    OrbSwitchComponent
],
  templateUrl: './agenda-config-modal.component.html',
  styleUrls: ['./agenda-config-modal.component.scss'],
  providers: [ConfirmationService]
})
export class AgendaConfigModalComponent implements OnInit, OnDestroy {
  @Input() visible = false;
  @Input() config: AgendaConfigResponseDto | null = null;
  @Input() professionalId: number | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() close = new EventEmitter<void>();

  configForm!: FormGroup;
  holidayForm!: FormGroup;
  showAddHolidayForm = false;
  private destroy$ = new Subject<void>();

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
    // Load current config if not provided
    if (!this.config) {
      this.agendaStore.loadAgendaConfig(this.professionalId || undefined);
    }

    // Load holidays for the professional
    this.agendaStore.loadAgendaHolidays(this.professionalId || undefined);

    // Subscribe to config changes
    this.agendaStore.agendaConfig$
      .pipe(takeUntil(this.destroy$))
      .subscribe(config => {
        if (config) {
          this.populateForm(config);
        }
      });
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

  private populateForm(config: AgendaConfigResponseDto): void {
    this.configForm.patchValue({
      startTime: config.workStart,
      endTime: config.workEnd,
      slotDuration: config.slotDurationMinutes,
      overbookingAllowed: config.allowOverbooking,
      allowBookingOnBlockedDays: config.allowBookingOnBlockedDays
    });

    // Set working days
    const workingDaysArray = this.configForm.get('workingDays') as FormArray;
    this.weekDays.forEach((day, index) => {
      const isWorkingDay = config.workingDays.includes(day.number);
      workingDaysArray.at(index).setValue(isWorkingDay);
    });
  }

  get workingDaysControls() {
    return (this.configForm.get('workingDays') as FormArray).controls as FormControl[];
  }

  onHide(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.close.emit();
  }

  onSave(): void {
    if (this.configForm.valid) {
      const formValue = this.configForm.value;
      
      // Build working days array
      const selectedWorkingDays = this.weekDays
        .filter((day, index) => formValue.workingDays[index])
        .map(day => day.value);

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
      
      // Subscribe to success to close modal
      this.agendaStore.configLoading$
        .pipe(takeUntil(this.destroy$))
        .subscribe(loading => {
          if (!loading) {
            this.onHide();
          }
        });
    }
  }

  onCancel(): void {
    this.onHide();
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
}