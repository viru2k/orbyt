import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// PrimeNG Components
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';

// Orb Components
import { OrbMainHeaderComponent, OrbCardComponent, OrbTableComponent, OrbDialogComponent, OrbActionsPopoverComponent } from '@orb-components';

// Services and Models
import { ServiceFormComponent } from '../modal/service-form.component';
import { ItemSelectorResponseDto } from '../../../api/models/item-selector-response-dto';
import { ServiceResponseDto } from '../../../api/models/service-response-dto';
import { OrbActionItem, OrbTableFeatures, TableColumn } from '@orb-models';
import { ServicesStore } from '@orb-stores';

@Component({
  selector: 'app-services-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ToastModule,
    ConfirmDialogModule,
    OrbMainHeaderComponent,
    OrbCardComponent,
    OrbTableComponent,
    OrbDialogComponent,
    OrbActionsPopoverComponent,
    ServiceFormComponent
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './services-list.component.html',
  styleUrls: ['./services-list.component.scss']
})
export class ServicesListComponent implements OnInit {
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  readonly servicesStore = inject(ServicesStore);

  // Store computed properties
  services = this.servicesStore.selectServicesWithMappedData;
  isLoading = this.servicesStore.loading;

  // Modal state
  displayServiceModal = signal(false);
  isEditMode = signal(false);
  serviceToEdit = signal<ServiceResponseDto | undefined>(undefined);

  // Table pagination signals
  tableRows = signal(10);
  tableFirst = signal(0);


  // Table configuration
  tableColumns: TableColumn[] = [
    { field: 'service', header: 'Servicio', sortable: false, width: '300px' },
    { field: 'basePrice', header: 'Precio Base', sortable: true, width: '150px' },
    { field: 'duration', header: 'Duración', sortable: true, width: '120px' },
    { field: 'category', header: 'Categoría', sortable: true, width: '150px' },
    { field: 'status', header: 'Estado', sortable: true, width: '120px' },
    { field: 'actions', header: '', width: '10px', sortable: false }
  ];

  tableFeaturesConfig: OrbTableFeatures = {
    showGlobalSearch: true,
    globalSearchPlaceholder: 'Buscar servicios...'
  };

  serviceGlobalFilterFields: string[] = ['name', 'description', 'categoryText', 'statusText'];

  // Acciones para cada fila de la tabla (Editar, Eliminar)
  serviceRowActions: OrbActionItem<ServiceResponseDto>[] = [
    {
      label: 'Editar',
      icon: 'pi pi-pencil',
      action: (service) => {
        if (service) this.editService(service);
      }
    },
    {
      label: 'Eliminar',
      icon: 'pi pi-trash',
      action: (service) => this.confirmDeleteService(service),
      styleClass: 'p-button-danger'
    }
  ];

  // Acción para la cabecera de la tabla (Nuevo Servicio)
  serviceTableHeaderActions: OrbActionItem[] = [
    {
      label: 'Nuevo Servicio',
      icon: 'pi pi-plus',
      action: () => this.showServiceForm(),
      severity: 'success',
      styleType: 'outlined'
    }
  ];

  ngOnInit(): void {
    this.servicesStore.load();
  }


  showServiceForm(): void {
    this.isEditMode.set(false);
    this.serviceToEdit.set(undefined);
    this.displayServiceModal.set(true);
  }


  editService(service: ServiceResponseDto): void {
    this.isEditMode.set(true);
    this.serviceToEdit.set(service);
    this.displayServiceModal.set(true);
  }


  onServiceSaved(): void {
    this.displayServiceModal.set(false);
    this.isEditMode.set(false);
    this.serviceToEdit.set(undefined);
    this.servicesStore.load(); // Recargar la lista usando el store
  }

  onCancelForm(): void {
    this.displayServiceModal.set(false);
    this.isEditMode.set(false);
    this.serviceToEdit.set(undefined);
  }

  confirmDeleteService(service: ServiceResponseDto | undefined): void {
    if (!service) return;
    this.confirmationService.confirm({
      message: `¿Está seguro de que desea eliminar el servicio "${service.name}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.deleteService(service);
      }
    });
  }

  private deleteService(service: ServiceResponseDto): void {
    if (!service.id) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se puede eliminar el servicio: ID no válido'
      });
      return;
    }

    // Assuming servicesStore.delete returns void or Observable
    // For now, let's just call the store method and reload
    try {
      this.servicesStore.delete(service.id);
      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: `Servicio "${service.name}" eliminado correctamente`
      });
      this.servicesStore.load(); // Reload the list
    } catch (error) {
      console.error('Error deleting service:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al eliminar el servicio'
      });
    }
  }
}