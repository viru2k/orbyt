import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { OrbDialogComponent } from '@orb-shared-components/orb-dialog/orb-dialog.component';
import { OrbButtonComponent } from '@orb-shared-components/orb-button/orb-button.component';
import { OrbTextInputComponent } from '@orb-shared-components/orb-text-input/orb-text-input.component';
import { OrbLabelComponent } from '@orb-shared-components/orb-label/orb-label.component';

import { AgendaStore } from '../../../../store/agenda/agenda.store';
import { AgendaConfigResponseDto, UpdateAgendaConfigDto } from '../../../../api/model/models';

@Component({
  selector: 'app-agenda-config-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    OrbDialogComponent,
    OrbButtonComponent,
    OrbTextInputComponent,
    OrbLabelComponent
  ],
  templateUrl: './agenda-config-modal.component.html',
  styleUrls: ['./agenda-config-modal.component.scss']
})
export class AgendaConfigModalComponent implements OnInit, OnDestroy {
  @Input() visible = false;
  @Input() config: AgendaConfigResponseDto | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() close = new EventEmitter<void>();

  configForm!: FormGroup;
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
    public agendaStore: AgendaStore
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    // Load current config if not provided
    if (!this.config) {
      this.agendaStore.loadAgendaConfig(undefined);
    }

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

      this.agendaStore.updateAgendaConfig({ config: updateDto });
      
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
}