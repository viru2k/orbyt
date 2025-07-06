import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

// Store y DTOs
import { ClientStore } from '@orb-stores';
import { ClientResponseDto } from '@orb-api/index';

// Componentes Orb y PrimeNG
import { OrbCardComponent, OrbTableComponent, OrbDialogComponent, OrbToolbarComponent, OrbButtonComponent } from '@orb-components';
import { ClientFormComponent } from '../modal/client-form.component';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

// Servicios y Modelos
import { NotificationService } from '@orb-services';
import { NotificationSeverity, OrbActionItem, OrbTableFeatures, TableColumn } from '@orb-models';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [
    CommonModule,
    OrbCardComponent,
    OrbTableComponent,
    OrbDialogComponent,
    ClientFormComponent,
    ConfirmDialogModule,
    OrbToolbarComponent,
    OrbButtonComponent
  ],
  templateUrl: './client-list.component.html',
  styleUrls: ['./client-list.component.scss'],
  providers: [ConfirmationService],
})
export class ClientListComponent implements OnInit {
  readonly clientStore = inject(ClientStore);
  private confirmationService = inject(ConfirmationService);
  private notificationService = inject(NotificationService);

  displayClientModal = signal(false);
  clientToEdit = signal<ClientResponseDto | undefined>(undefined);
  isEditMode = signal(false);

  clients = this.clientStore.selectClientsWithMappedData;
  isLoading = this.clientStore.loading;

  // --- CAMBIO CLAVE AQUÍ ---
  // La columna apunta al campo 'createdAt' para la ordenación.
  // La visualización se manejará en el template HTML.
  tableColumns: TableColumn[] = [
    { field: 'fullname', header: 'Nombre Completo', sortable: true },
    { field: 'email', header: 'Email', sortable: true },
    { field: 'phone', header: 'Teléfono', sortable: false },
    { field: 'statusText', header: 'Estado', sortable: true, width: '120px' },
    { field: 'createdAt', header: 'Fecha Creación', sortable: true, width: '180px' },
    { field: 'actions', header: 'Acciones', width: '100px', sortable: false }
  ];

  tableFeaturesConfig: OrbTableFeatures = {
    showGlobalSearch: true,
    globalSearchPlaceholder: 'Buscar clientes...'
  };

  clientGlobalFilterFields: string[] = ['fullname', 'name', 'lastName', 'email', 'phone', 'statusText'];

  clientRowActions: OrbActionItem<any>[] = [
    {
      label: 'Editar',
      icon: 'pi pi-pencil',
      action: (client) => this.openClientModal(client)
    },
    {
      label: 'Eliminar',
      icon: 'pi pi-trash',
      action: (client) => this.confirmDeleteClient(client),
      styleClass: 'p-button-danger'
    }
  ];

  clientTableHeaderActions: OrbActionItem[] = [
    {
      label: 'Nuevo Cliente',
      icon: 'pi pi-plus',
      action: () => this.openClientModal()
    }
  ];

  tableRows = signal(10);
  tableFirst = signal(0);

  ngOnInit() {
    this.clientStore.load();
  }

  openClientModal(client?: ClientResponseDto): void {
    if (client) {
      this.isEditMode.set(true);
      this.clientToEdit.set({ ...client });
    } else {
      this.isEditMode.set(false);
      this.clientToEdit.set(undefined);
    }
    this.displayClientModal.set(true);
  }

  confirmDeleteClient(client: ClientResponseDto): void {
    if (!client || client.id === undefined) {
      this.notificationService.showWarn(NotificationSeverity.Error, 'No se puede eliminar el cliente: ID no válido.');
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
        this.clientStore.delete(client.id!);
      } 
    });
  }

  onClientFormSaved(): void {
    console.log('Cliente guardado');
    this.displayClientModal.set(false);
    this.clientToEdit.set(undefined);
  }

  onClientFormCancel(): void {
    this.displayClientModal.set(false);
    this.clientToEdit.set(undefined);
  }
  
  showClientForm(): void {
    this.openClientModal();
  }
}
