import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, map } from 'rxjs';
import { ConfirmationService } from 'primeng/api';

import { OrbDialogComponent } from '@orb-shared-components/orb-dialog/orb-dialog.component';
import { OrbButtonComponent } from '@orb-shared-components/orb-button/orb-button.component';
import { OrbDatepickerComponent } from '@orb-shared-components/orb-datepicker/orb-datepicker.component';
import { OrbTextAreaComponent } from '@orb-shared-components/orb-text-area/orb-text-area.component';
import { OrbLabelComponent } from '@orb-shared-components/orb-label/orb-label.component';
import { AgendaStore } from '../../../../store/agenda/agenda.store';
import { HolidayResponseDto, CreateHolidayDto } from '../../../../api/models';

@Component({
  selector: 'app-holidays-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    OrbDialogComponent,
    OrbButtonComponent,
    OrbDatepickerComponent,
    OrbTextAreaComponent,
    OrbLabelComponent
  ],
  templateUrl: './holidays-modal.component.html',
  styleUrls: ['./holidays-modal.component.scss']
})
export class HolidaysModalComponent implements OnInit, OnDestroy {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() close = new EventEmitter<void>();

  holidayForm!: FormGroup;
  showAddHolidayDialog = false;
  private destroy$ = new Subject<void>();


  disabledDays$ = this.agendaStore.agendaConfig$.pipe(
    map(config => {
      if (!config?.workingDays) {
        return []; // Si no hay configuración, no deshabilitar nada.
      }
      const allDays = [0, 1, 2, 3, 4, 5, 6];
      const workingDays = config.workingDays;
      return allDays.filter(day => !workingDays.includes(day));
    })
  );
  disabledDays: number[] = [];

  constructor(
    private fb: FormBuilder,
    public agendaStore: AgendaStore,
    private confirmationService: ConfirmationService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    if (this.visible) {
      this.loadHolidays();
    }
    this.disabledDays$.pipe(takeUntil(this.destroy$)).subscribe(days => {
      this.disabledDays = days;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.holidayForm = this.fb.group({
      date: [null, Validators.required],
      reason: ['', [Validators.maxLength(255)]]
    });
  }

  private loadHolidays(): void {
    this.agendaStore.loadAgendaHolidays(undefined);
  }

  onHide(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.showAddHolidayDialog = false;
    this.holidayForm.reset();
    this.close.emit();
  }

  onShowAddForm(): void {
    this.showAddHolidayDialog = true;
    this.holidayForm.reset();
  }

  onCancelAdd(): void {
    this.showAddHolidayDialog = false;
    this.holidayForm.reset();
  }

  onAddHoliday(): void {
    if (this.holidayForm.valid) {
      const formValue = this.holidayForm.value;
      
      const newHoliday: CreateHolidayDto = {
        date: this.formatDate(formValue.date),
        description: formValue.reason || undefined
      };

      this.agendaStore.addHolidayEffect({ holiday: newHoliday });
      
      this.agendaStore.holidaysLoading$
        .pipe(takeUntil(this.destroy$))
        .subscribe(loading => {
          if (!loading) {
            this.onCancelAdd();
          }
        });
    }
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

  private formatDate(date: Date): string {
    if (!date) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
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

  trackByHolidayId(index: number, holiday: HolidayResponseDto): number {
    return holiday.id;
  }
}

