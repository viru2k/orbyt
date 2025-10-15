import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

// Store y DTOs
import { ClientStore } from '@orb-stores';
import { ClientResponseDto } from '../../../api/models';

// Componentes Orb y PrimeNG
import { OrbCardComponent, OrbTableComponent, OrbDialogComponent, OrbActionsPopoverComponent, OrbEntityAvatarComponent, OrbMainHeaderComponent } from '@orb-components';
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
    OrbMainHeaderComponent,
    OrbDialogComponent,
    ClientFormComponent,
    ConfirmDialogModule,
    OrbActionsPopoverComponent,
    OrbEntityAvatarComponent
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

  tableColumns: TableColumn[] = [
    { field: 'profile', header: 'Cliente', sortable: false, width: '300px' },
    { field: 'phone', header: 'Teléfono', sortable: false, width: '150px' },
    { field: 'statusText', header: 'Estado', sortable: true, width: '120px' },
    { field: 'createdAt', header: 'Fecha Creación', sortable: true, width: '180px' },
    { field: 'actions', header: '', width: '10px', sortable: false }
  ];

  tableFeaturesConfig: OrbTableFeatures = {
    showGlobalSearch: true,
    globalSearchPlaceholder: 'Buscar clientes...'
  };

  clientGlobalFilterFields: string[] = ['fullname', 'name', 'lastName', 'email', 'phone', 'statusText'];

  // --- ACCIONES RESTAURADAS ---
  // Acciones para cada fila de la tabla (Editar, Eliminar)
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

  // Acción para la cabecera de la tabla (Nuevo Cliente)
  clientTableHeaderActions: OrbActionItem[] = [
    {
      label: 'Nuevo Cliente',
      icon: 'pi pi-plus',
      action: () => this.openClientModal(),
      severity: 'success',
      outlined: true
    }
  ];
  // -------------------------

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
    this.displayClientModal.set(false);
    this.clientToEdit.set(undefined);
  }

  onClientFormCancel(): void {
    this.displayClientModal.set(false);
    this.clientToEdit.set(undefined);
  }
  
  // Método para el botón del toolbar, que llama a la lógica unificada
  showClientForm(): void {
    this.openClientModal();
  }

}
