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
import { OrbButtonComponent, OrbFormFieldComponent, OrbTextInputComponent, OrbTableComponent, OrbCardComponent, OrbToolbarComponent, OrbBreadcrumbComponent, OrbDialogComponent, OrbActionsPopoverComponent, OrbEntityAvatarComponent } from '@orb-components';
import { TableColumn, OrbTableFeatures, OrbActionItem } from '@orb-models';

export interface Room {
  id?: number;
  name: string;
  description?: string;
  isActive: boolean;
  capacity?: number;
  location?: string;
  createdAt?: Date;
  updatedAt?: Date;
  statusText?: string;
  statusClass?: string;
}

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
    OrbToolbarComponent,
    OrbBreadcrumbComponent,
    OrbDialogComponent,
    OrbActionsPopoverComponent,
    OrbEntityAvatarComponent
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './rooms-list.component.html',
  styleUrls: ['./rooms-list.component.scss']
})
export class RoomsListComponent implements OnInit {
  private fb = inject(FormBuilder);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  // Signals para estado reactivo
  rooms = signal<Room[]>([]);
  isLoading = signal(false);
  showOnlyActive = signal(true);
  
  // Modal state
  showRoomModal = signal(false);
  isEditMode = signal(false);
  currentRoom = signal<Room | null>(null);
  
  // Form
  roomForm!: FormGroup;
  
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

  roomRowActions: OrbActionItem<Room>[] = [
    {
      label: 'Editar',
      icon: 'fas fa-edit',
      action: (room?: Room) => {
        if (room) {
          this.onEditRoom(room);
        }
      }
    },
    {
      label: 'Cambiar estado',
      icon: 'fas fa-toggle-on',
      action: (room?: Room) => {
        if (room) {
          this.onToggleRoomStatus(room);
        }
      }
    }
  ];

  breadcrumbItems: MenuItem[] = [
    { label: 'Inicio', icon: 'fas fa-home', routerLink: '/dashboard' },
    { label: 'Gestión', icon: 'fas fa-cogs' },
    { label: 'Salas', icon: 'fas fa-door-open' }
  ];

  // Computed properties
  filteredRooms = computed(() => {
    const allRooms = this.rooms();
    const showActive = this.showOnlyActive();
    
    if (showActive) {
      return allRooms.filter(room => room.isActive);
    }
    return allRooms;
  });

  ngOnInit(): void {
    this.initializeForm();
    this.loadRooms();
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

  private loadRooms(): void {
    this.isLoading.set(true);
    
    // Mock data - replace with actual API call when backend is ready
    const mockRooms: Room[] = [
      {
        id: 1,
        name: 'Sala de Consulta 1',
        description: 'Sala principal para consultas generales',
        capacity: 2,
        location: 'Planta Baja',
        isActive: true,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
      },
      {
        id: 2,
        name: 'Sala de Procedimientos',
        description: 'Sala equipada para procedimientos médicos',
        capacity: 4,
        location: 'Primer Piso',
        isActive: true,
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-20')
      },
      {
        id: 3,
        name: 'Sala de Reuniones',
        description: 'Sala para reuniones y capacitaciones',
        capacity: 10,
        location: 'Segundo Piso',
        isActive: false,
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-02-15')
      }
    ];

    // Simulate API call delay
    setTimeout(() => {
      // Transform rooms to add statusText and statusClass
      const transformedRooms = mockRooms.map(room => ({
        ...room,
        statusText: this.getStatusText(room.isActive),
        statusClass: room.isActive ? 'status-active' : 'status-inactive'
      }));
      this.rooms.set(transformedRooms);
      this.isLoading.set(false);
    }, 500);
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

  onEditRoom(room: Room): void {
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

  onToggleRoomStatus(room: Room): void {
    const action = room.isActive ? 'deshabilitar' : 'habilitar';
    const newStatus = !room.isActive;
    
    this.confirmationService.confirm({
      message: `¿Está seguro de ${action} la sala "${room.name}"?`,
      header: `Confirmar ${action}`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      accept: () => {
        // TODO: Replace with actual API call
        const updatedRooms = this.rooms().map(r => 
          r.id === room.id ? { ...r, isActive: newStatus, updatedAt: new Date() } : r
        );
        this.rooms.set(updatedRooms);
        
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: `Sala ${action}ada correctamente`
        });
      }
    });
  }

  onSaveRoom(): void {
    if (this.roomForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    const formValue = this.roomForm.value;
    const roomData: Room = {
      name: formValue.name,
      description: formValue.description,
      capacity: formValue.capacity,
      location: formValue.location,
      isActive: formValue.isActive
    };

    if (this.isEditMode()) {
      // Edit existing room
      const currentRoom = this.currentRoom();
      if (currentRoom) {
        const updatedRoom: Room = {
          ...currentRoom,
          ...roomData,
          updatedAt: new Date()
        };

        // TODO: Replace with actual API call
        const updatedRooms = this.rooms().map(r => 
          r.id === currentRoom.id ? updatedRoom : r
        );
        this.rooms.set(updatedRooms);

        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Sala actualizada correctamente'
        });
      }
    } else {
      // Create new room
      const newRoom: Room = {
        ...roomData,
        id: Date.now(), // Temporary ID - backend will assign real ID
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // TODO: Replace with actual API call
      this.rooms.set([...this.rooms(), newRoom]);

      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Sala creada correctamente'
      });
    }

    this.closeModal();
  }

  onToggleShowOnlyActive(): void {
    this.showOnlyActive.update(value => !value);
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

  formatDate(date?: Date): string {
    if (!date) return '-';
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