

import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppointmentResponseDto, CreateAppointmentDto, UpdateAppointmentDto } from '../../../../api/model/models';


import { AgendaStore } from '../../../../store/agenda/agenda.store';
import { ClientResponseDto, UserResponseDto } from '../../../../api/model/models';
import { ClientsService } from '../../../../api/api/api';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { OrbButtonComponent, OrbDatepickerComponent, OrbFormFieldComponent, OrbSelectComponent, OrbTextAreaComponent, OrbTextInputComponent } from '@orb-components';
import { UsersService } from '../../../../api/api/api';

@Component({
  selector: 'app-agenda-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    OrbFormFieldComponent,
    OrbTextInputComponent,
    OrbDatepickerComponent,
    OrbSelectComponent,
    OrbTextAreaComponent,
    OrbButtonComponent,
  ],
  templateUrl: './agenda-form.component.html',
  styleUrls: ['./agenda-form.component.scss'],
})
export class AgendaFormComponent implements OnChanges {
  @Input() appointment: AppointmentResponseDto | null = null;
  @Output() save = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  agendaForm: FormGroup;
  clients$: Observable<ClientResponseDto[]> = of([]);
  professionals$: Observable<UserResponseDto[]> = of([]);
  services$: Observable<any[]> = of([]);
  rooms$: Observable<any[]> = of([]);

  constructor(
    private fb: FormBuilder,
    public agendaStore: AgendaStore,
    private clientsService: ClientsService,
    private userService: UsersService
  ) {
    this.agendaForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      date: [null, Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      clientId: [null, Validators.required],
      professionalId: [null, Validators.required],
      serviceId: [null, Validators.required],
      roomId: [null, Validators.required],
    });

    this.clients$ = this.clientsService.clientControllerFindAll();
    this.professionals$ = this.userService.userControllerGetGroupUsers();
    this.services$ = of([]);  // TODO: Implement services API
    this.rooms$ = of([]);    // TODO: Implement rooms API
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['appointment'] && this.appointment) {
      this.agendaForm.patchValue({
        title: this.appointment.title,
        description: this.appointment.notes || '',
        date: new Date(this.appointment.start), // Use start date
        startTime: new Date(this.appointment.start).toISOString().substr(11, 5),
        endTime: this.appointment.end ? new Date(this.appointment.end).toISOString().substr(11, 5) : '',
        clientId: this.appointment.client?.id,
        professionalId: this.appointment.professional?.id,
        serviceId: this.appointment.serviceId,
        roomId: this.appointment.roomId,
      });
    } else {
      this.agendaForm.reset();
    }
  }

  onSubmit(): void {
    if (this.agendaForm.valid) {
      const formValue = this.agendaForm.value;
      
      const startDateTime = `${formValue.date.toISOString().split('T')[0]}T${formValue.startTime}:00Z`;
      const endDateTime = `${formValue.date.toISOString().split('T')[0]}T${formValue.endTime}:00Z`;

      const appointmentPayload = {
        title: formValue.title,
        startDateTime: startDateTime,
        endDateTime: endDateTime,
        notes: formValue.description,
        allDay: false,
        clientId: formValue.clientId,
        professionalId: formValue.professionalId,
        status: 'confirmed',
        serviceId: formValue.serviceId,
        roomId: formValue.roomId,
      };

      if (this.appointment) {
        this.agendaStore.updateAppointment({
          id: this.appointment.id,
          dto: appointmentPayload as UpdateAppointmentDto,
        });
      } else {
        this.agendaStore.createAppointment(appointmentPayload as CreateAppointmentDto);
      }
      this.save.emit();
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }
}

