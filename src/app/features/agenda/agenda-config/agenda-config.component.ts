import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, map, combineLatest } from 'rxjs';

import { OrbCardComponent } from '@orb-shared-components/application/orb-card/orb-card.component';
import { OrbButtonComponent } from '@orb-shared-components/orb-button/orb-button.component';
import { OrbMainHeaderComponent } from '@orb-shared-components/orb-main-header/orb-main-header.component';
import { OrbLabelComponent } from '@orb-shared-components/orb-label/orb-label.component';
import { OrbSelectComponent } from '@orb-shared-components/orb-select/orb-select.component';
import { OrbInputNumberComponent } from '@orb-shared-components/orb-input-number/orb-input-number.component';
import { OrbCheckboxComponent } from '@orb-shared-components/orb-checkbox/orb-checkbox.component';
import { HolidaysModalComponent } from '../components/holidays-modal/holidays-modal.component';

import { AgendaStore } from '../../../store/agenda/agenda.store';
import { UsersStore } from '../../../store/users/users.store';
import { AuthStore } from '../../../store/auth/auth.store';
import { AgendaConfigResponseDto, UpdateAgendaConfigDto, UserResponseDto } from '../../../api/models';

@Component({
  selector: 'app-agenda-config',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    OrbCardComponent,
    OrbButtonComponent,
    OrbMainHeaderComponent,
    OrbLabelComponent,
    OrbSelectComponent,
    OrbInputNumberComponent,
    OrbCheckboxComponent,
    HolidaysModalComponent
  ],
  templateUrl: './agenda-config.component.html',
  styleUrls: ['./agenda-config.component.scss']
})
export class AgendaConfigComponent implements OnInit, OnDestroy {

  configForm!: FormGroup;
  selectedProfessionalId: number | null = null;
  displayHolidaysModal = false;
  private destroy$ = new Subject<void>();

  dayOptions = [
    { label: 'Lunes', value: 1 },
    { label: 'Martes', value: 2 },
    { label: 'Miércoles', value: 3 },
    { label: 'Jueves', value: 4 },
    { label: 'Viernes', value: 5 },
    { label: 'Sábado', value: 6 },
    { label: 'Domingo', value: 0 }
  ];

  currentUser$ = this.authStore.user$;
  canManageAgenda$ = this.authStore.canManageAgenda$;
  currentConfig$ = this.agendaStore.agendaConfig$;

  professionals$ = combineLatest([
    this.usersStore.groupUsers$,
    this.canManageAgenda$
  ]).pipe(
    map(([users, canManage]) => {
      if (!canManage) return [];
      return users.map(user => ({
        label: user.fullName,
        value: user.id
      }));
    })
  );

  constructor(
    private fb: FormBuilder,
    public agendaStore: AgendaStore,
    public usersStore: UsersStore,
    public authStore: AuthStore
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.usersStore.loadSubUsers();
    
    // Listen to professional selection changes
    this.configForm.get('selectedProfessional')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(professionalId => {
        if (professionalId) {
          this.onProfessionalChange(professionalId);
        }
      });
    
    this.canManageAgenda$
      .pipe(takeUntil(this.destroy$))
      .subscribe(canManage => {
        if (!canManage) {
          this.currentUser$
            .pipe(takeUntil(this.destroy$))
            .subscribe(user => {
              if (user?.id) {
                this.selectedProfessionalId = user.id;
                this.configForm.patchValue({ selectedProfessional: user.id });
                this.loadConfig(user.id);
              }
            });
        }
      });

    this.currentConfig$
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
      selectedProfessional: [null],
      workingDays: [[], Validators.required],
      workStart: ['09:00', Validators.required],
      workEnd: ['18:00', Validators.required],
      slotDurationMinutes: [30, [Validators.required, Validators.min(15), Validators.max(240)]],
      allowOverbooking: [false],
      allowBookingOnBlockedDays: [false]
    });
  }

  private populateForm(config: AgendaConfigResponseDto): void {
    this.configForm.patchValue({
      workingDays: config.workingDays || [],
      workStart: config.workStart || '09:00',
      workEnd: config.workEnd || '18:00',
      slotDurationMinutes: config.slotDurationMinutes || 30,
      allowOverbooking: config.allowOverbooking || false,
      allowBookingOnBlockedDays: config.allowBookingOnBlockedDays || false
    });
  }

  onProfessionalChange(professionalId: number): void {
    this.selectedProfessionalId = professionalId;
    this.loadConfig(professionalId);
  }

  private loadConfig(professionalId: number): void {
    this.agendaStore.loadAgendaConfig(professionalId);
  }

  onSave(): void {
    if (this.configForm.valid && this.selectedProfessionalId) {
      const formValue = this.configForm.value;
      
      const updateDto: UpdateAgendaConfigDto = {
        workingDays: formValue.workingDays.map((day: number) => day.toString()),
        startTime: formValue.workStart,
        endTime: formValue.workEnd,
        slotDuration: formValue.slotDurationMinutes,
        overbookingAllowed: formValue.allowOverbooking,
        allowBookingOnBlockedDays: formValue.allowBookingOnBlockedDays
      };

      this.agendaStore.updateAgendaConfig({ 
        professionalId: this.selectedProfessionalId, 
        config: updateDto 
      });
    }
  }

  onManageHolidays(): void {
    this.displayHolidaysModal = true;
  }

  closeHolidaysModal(): void {
    this.displayHolidaysModal = false;
  }

  getDayName(dayValue: number): string {
    const day = this.dayOptions.find(d => d.value === dayValue);
    return day ? day.label : '';
  }

  onDayToggle(dayValue: number, event: Event): void {
    const target = event.target as HTMLInputElement;
    const isSelected = target.checked;
    const currentDays = this.configForm.get('workingDays')?.value || [];
    let updatedDays: number[];
    
    if (isSelected) {
      updatedDays = [...currentDays, dayValue];
    } else {
      updatedDays = currentDays.filter((day: number) => day !== dayValue);
    }
    
    this.configForm.patchValue({ workingDays: updatedDays });
  }
}