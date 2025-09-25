import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';

// PrimeNG Components
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { InputSwitchModule } from 'primeng/inputswitch';
import { CardModule } from 'primeng/card';
import { ToolbarModule } from 'primeng/toolbar';
import { InputNumberModule } from 'primeng/inputnumber';

// PrimeNG Services
import { ConfirmationService, MessageService, MenuItem } from 'primeng/api';

// Orb Components
import { OrbButtonComponent, OrbFormFieldComponent, OrbTextInputComponent, OrbTableComponent, OrbCardComponent, OrbMainHeaderComponent, OrbDialogComponent, OrbActionsPopoverComponent, OrbSelectComponent } from '@orb-components';
import { TableColumn, OrbTableFeatures, OrbActionItem } from '@orb-models';

// Store and DTOs
import { RoomsStore } from '@orb-stores';
import { RoomResponseDto, CreateRoomDto, UpdateRoomDto } from '../../../api/models';

@Component({
  selector: 'orb-rooms-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    CheckboxModule,
    TooltipModule,
    ConfirmDialogModule,
    ToastModule,
    TagModule,
    InputSwitchModule,
    CardModule,
    ToolbarModule,
    InputNumberModule,
    OrbButtonComponent,
    OrbFormFieldComponent,
    OrbTextInputComponent,
    OrbTableComponent,
    OrbCardComponent,
    OrbMainHeaderComponent,
    OrbDialogComponent,
    OrbActionsPopoverComponent,
    OrbSelectComponent
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './rooms-list.component.html',
  styleUrls: ['./rooms-list.component.scss']
})
export class RoomsListComponent implements OnInit {
  private fb = inject(FormBuilder);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  readonly roomsStore = inject(RoomsStore);

  // Modal state
  showRoomModal = signal(false);
  isEditMode = signal(false);
  currentRoom = signal<RoomResponseDto | null>(null);

  // Table pagination signals
  tableRows = signal(15);
  tableFirst = signal(0);

  // Form
  roomForm!: FormGroup;

  // Store computed properties
  rooms = this.roomsStore.selectRoomsWithMappedData;
  isLoading = this.roomsStore.loading;
  
  // Table configuration
  tableColumns: TableColumn[] = [
    { field: 'room', header: 'Sala', sortable: true },
    { field: 'location', header: 'Ubicación', sortable: true },
    { field: 'capacity', header: 'Capacidad', sortable: true },
    { field: 'statusText', header: 'Estado', sortable: true },
    { field: 'updatedAt', header: 'Última actualización', sortable: true },
    { field: 'actions', header: 'Acciones', sortable: false }
  ];

  tableFeaturesConfig: OrbTableFeatures = {
    showGlobalSearch: true,
    globalSearchPlaceholder: 'Buscar salas...'
  };

  statusOptions = [
    { label: 'Activo', value: true },
    { label: 'Inactivo', value: false }
  ];

  roomRowActions: OrbActionItem<RoomResponseDto>[] = [
    {
      label: 'Editar',
      icon: 'fas fa-edit',
      action: (room?: RoomResponseDto) => {
        if (room) {
          this.onEditRoom(room);
        }
      }
    }
  ];

  roomTableHeaderActions: OrbActionItem[] = [
    {
      label: 'Nueva Sala',
      icon: 'pi pi-plus',
      action: () => this.onCreateRoom()
    }
  ];


  ngOnInit(): void {
    this.initializeForm();
    this.roomsStore.load();
  }

  private initializeForm(): void {
    this.roomForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      capacity: [null, [Validators.min(1)]],
      location: [''],
      isActive: [true]
    });
  }

  // Event handlers
  onCreateRoom(): void {
    this.isEditMode.set(false);
    this.currentRoom.set(null);
    this.roomForm.reset({
      isActive: true,
      capacity: null
    });
    this.showRoomModal.set(true);
  }

  onEditRoom(room: RoomResponseDto): void {
    this.isEditMode.set(true);
    this.currentRoom.set(room);
    this.roomForm.patchValue({
      name: room.name,
      description: room.description || '',
      capacity: room.capacity || null,
      location: room.location || '',
      isActive: room.isActive
    });
    this.showRoomModal.set(true);
  }


  onSaveRoom(): void {
    if (this.roomForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    const formValue = this.roomForm.value;

    if (this.isEditMode()) {
      // Edit existing room
      const currentRoom = this.currentRoom();
      if (currentRoom) {
        const updateDto: UpdateRoomDto = {
          name: formValue.name,
          description: formValue.description,
          capacity: formValue.capacity,
          location: formValue.location,
          isActive: formValue.isActive
        };

        this.roomsStore.update({ id: currentRoom.id, roomDto: updateDto });

        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Sala actualizada correctamente'
        });
      }
    } else {
      // Create new room
      const createDto: CreateRoomDto = {
        name: formValue.name,
        description: formValue.description,
        capacity: formValue.capacity,
        location: formValue.location,
        isActive: formValue.isActive
      };

      this.roomsStore.create(createDto);

      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Sala creada correctamente'
      });
    }

    this.closeModal();
  }

  closeModal(): void {
    this.showRoomModal.set(false);
    this.roomForm.reset();
    this.currentRoom.set(null);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.roomForm.controls).forEach(key => {
      const control = this.roomForm.get(key);
      control?.markAsTouched();
    });
  }

  // Utility methods
  getStatusSeverity(isActive: boolean): 'success' | 'danger' {
    return isActive ? 'success' : 'danger';
  }

  getStatusText(isActive: boolean): string {
    return isActive ? 'Activa' : 'Inactiva';
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  }

  get modalTitle(): string {
    return this.isEditMode() ? 'Editar Sala' : 'Nueva Sala';
  }

  get saveButtonText(): string {
    return this.isEditMode() ? 'Actualizar' : 'Crear';
  }
}