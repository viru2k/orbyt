import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';

// src/app/features/crm/client/client-list/client-list.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';


// Store y DTOs

import { ClientStore } from '@orb-stores';
import { ClientResponseDto } from '@orb-api/index';

// Componentes Orb y PrimeNG
import {  OrbCardComponent, OrbTableComponent, OrbDialogComponent, OrbToolbarComponent, OrbButtonComponent } from '@orb-components';

import { ConfirmationService, SortEvent } from 'primeng/api'; // SortEvent de PrimeNG
import { ConfirmDialogModule } from 'primeng/confirmdialog';



// Servicios
import { NotificationService } from '@orb-services';
import { NotificationSeverity, OrbActionItem, OrbTableFeatures, TableColumn } from '@orb-models';
import { FullCalendarModule } from '@fullcalendar/angular';
import { BrowserModule } from '@angular/platform-browser';


@Component({
  selector: 'app-client-new', // Cambiado de 'orb-clients' para seguir un patrón de feature
  standalone: true,
  imports: [
    CommonModule,
    OrbCardComponent,
    OrbTableComponent,
    OrbDialogComponent,
    
    ConfirmDialogModule,
    OrbToolbarComponent,
    OrbButtonComponent,
    FullCalendarModule 
  ],
  templateUrl: './agenda-new.component.html',
  styleUrls: ['./agenda-new.component.scss'],
  providers: [ConfirmationService],
})
export class AgendaNewComponent implements OnInit {

 calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin],
    initialView: 'dayGridMonth',
    weekends: false,
    events: [
      { title: 'Meeting', start: new Date() }
    ]
  };

  public clientStore = inject(ClientStore);
  private confirmationService = inject(ConfirmationService);
  private notificationService = inject(NotificationService);

  // Señales para el estado del modal y el cliente en edición/creación
  displayClientModal = signal(false);
  // selectedClient se usará para pasar el cliente al formulario, o undefined para nuevo
 clientToEdit = signal<ClientResponseDto | undefined>(undefined);
  isEditMode = signal(false);


  // Señales del store
  clients = this.clientStore.allClients;
  isLoading = this.clientStore.isLoading;

  // Configuración de la Tabla
  tableColumns: TableColumn[] = [
    { field: 'fullname', header: 'Nombre Completo', sortable: true },
    { field: 'email', header: 'Email', sortable: true },
    { field: 'phone', header: 'Teléfono', sortable: false },
    { field: 'status', header: 'Estado', sortable: true, width: '120px' },
    { field: 'createdAt', header: 'Fecha Creación', sortable: true, width: '180px' },
    { field: 'actions', header: 'Acciones', width: '100px', sortable: false }
  ];

  tableFeaturesConfig: OrbTableFeatures = {
    showGlobalSearch: true,
    globalSearchPlaceholder: 'Buscar clientes...'
  };

  clientGlobalFilterFields: string[] = ['fullname', 'name', 'lastName', 'email', 'phone', 'status'];

  clientRowActions: OrbActionItem<ClientResponseDto>[] = [
    {
      label: 'Editar',
      icon: 'pi pi-pencil',
      action: (client) => this.openClientModal(client) // Llama a un método unificado para abrir el modal
    },
    {
      label: 'Eliminar',
      icon: 'pi pi-trash',
      action: (client) => this.confirmDeleteClient(client ?? {} as ClientResponseDto),
      styleClass: 'p-button-danger'
    }
  ];

  clientTableHeaderActions: OrbActionItem[] = [
    {
      label: 'Nuevo Cliente',
      icon: 'pi pi-plus',
      action: () => this.openClientModal() // Llama al mismo método sin cliente para "nuevo"
    }
  ];

  // Propiedades para paginación y carga inicial de la tabla (si se implementa en el store)
  // Por ahora, loadClients() del store no toma parámetros.
  tableRows = signal(10);  // Estos son para la configuración de p-table
  tableFirst = signal(0); // y su evento onPageChange

  ngOnInit() {
    this.clientStore.loadClients();
  }

  // Método unificado para abrir el modal, sea para nuevo o edición
  openClientModal(client?: ClientResponseDto): void {
    if (client) {
     this.isEditMode.set(true);
      this.clientToEdit.set({ ...client }); // Pasa una copia para evitar mutaciones directas si el form edita el objeto
    } else {
      this.isEditMode.set(false);
      this.clientToEdit.set(undefined); // Para un cliente nuevo
    }
    this.displayClientModal.set(true);
  }

  // Método para el botón "Nuevo Cliente" del toolbar, si se mantiene separado
  handleAddNewClientButton(): void {
    this.openClientModal();
  }

  confirmDeleteClient(client: ClientResponseDto): void {
    if (!client || client.id === undefined) {
      this.notificationService.showError(NotificationSeverity.Error,'No se puede eliminar el cliente: ID no válido.');
      return;
    }
    this.confirmationService.confirm({
      message: `¿Estás seguro de que quieres eliminar al cliente "${client.fullname}"? Esta acción no se puede deshacer.`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'No',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.clientStore.deleteClient(client.id!); // El store ahora llama a loadClients() internamente
      }
    });
  }

  // Cuando el formulario emite 'saved'
  onClientFormSaved(): void {
     this.displayClientModal.set(false);
    this.clientToEdit.set(undefined);
  }

  // Cuando el formulario emite 'cancel' o se cierra el diálogo
  onClientFormCancel(): void {
    this.displayClientModal.set(false);
    this.clientToEdit.set(undefined); // Limpia el cliente seleccionado
  }

  
  showClientForm() {
    this.displayClientModal.set(true);
  }

  hideClientForm() {
    this.displayClientModal.set(false);

  }

}