import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// PrimeNG Components
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';

// Orb Components
import { OrbMainHeaderComponent, OrbCardComponent, OrbButtonComponent, OrbTableComponent, OrbDialogComponent, OrbActionsPopoverComponent } from '@orb-components';

// Services and Models
import { ServiceFormComponent } from '../modal/service-form.component';
import { ItemSelectorResponseDto } from '../../../api/models/item-selector-response-dto';
import { ServiceResponseDto } from '../../../api/models/service-response-dto';
import { OrbActionItem } from '@orb-models';
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
    OrbButtonComponent,
    OrbTableComponent,
    OrbDialogComponent,
    OrbActionsPopoverComponent,
    ServiceFormComponent
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <!-- Header unificado como dashboard -->
    <orb-main-header
      title="Gestión de Servicios"
      icon="fa fa-cog"
      subtitle="Administra y configura los servicios disponibles">
    </orb-main-header>

    <orb-card>
      <div class="grid" orbBody>
        <!-- Services Table -->
        <orb-table
          [value]="services()"
          [columns]="tableColumns"
          [loading]="isLoading()"
          [totalRecords]="services().length"
          [rows]="tableRows()"
          [first]="tableFirst()"
          [tableFeatures]="tableFeaturesConfig"
          [globalFilterFields]="['name', 'description']"
          [rowActions]="serviceRowActions"
          [tableHeaderActions]="serviceTableHeaderActions"
          dataKey="id"
          paginatorPosition="bottom"
          [rowsPerPageOptions]="[15, 30, 50]"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} servicios">
          
          <ng-template pTemplate="body" let-service let-columns="columns">
            <tr>
              <td *ngFor="let col of columns">
                <ng-container [ngSwitch]="col.field">
                  
                  <!-- Service info column -->
                  <ng-container *ngSwitchCase="'service'">
                    <div class="service-info">
                      <div class="service-name font-medium text-900">{{ service.name }}</div>
                      <div class="service-description text-600 text-sm">
                        {{ service.description || 'Sin descripción' }}
                      </div>
                    </div>
                  </ng-container>

                  <!-- Base price column -->
                  <ng-container *ngSwitchCase="'basePrice'">
                    {{ service.formattedPrice }}
                  </ng-container>

                  <!-- Category column -->
                  <ng-container *ngSwitchCase="'category'">
                    <span class="category-tag">{{ service.categoryText }}</span>
                  </ng-container>

                  <!-- Duration column -->
                  <ng-container *ngSwitchCase="'duration'">
                    {{ service.durationText }}
                  </ng-container>

                  <!-- Status column -->
                  <ng-container *ngSwitchCase="'status'">
                    <span [ngClass]="service.status === 'ACTIVE' ? 'status-active' : 'status-inactive'">
                      {{ service.statusText }}
                    </span>
                  </ng-container>

                  <!-- Actions column -->
                  <ng-container *ngSwitchCase="'actions'">
                    <div class="flex gap-2">
                      <orb-actions-popover
                        [actions]="serviceRowActions"
                        [itemData]="service">
                      </orb-actions-popover>
                    </div>
                  </ng-container>

                  <!-- Default column -->
                  <ng-container *ngSwitchDefault>
                    {{ service[col.field] }}
                  </ng-container>
                  
                </ng-container>
              </td>
            </tr>
          </ng-template>
        </orb-table>
      </div>
    </orb-card>

    <!-- Service Form Dialog -->
    <orb-dialog
      [visible]="displayServiceModal()"
      [header]="isEditMode() ? 'Editar Servicio' : 'Nuevo Servicio'"
      size="lg"
      (onHide)="onCancelForm()">
      
      <orb-service-form
        [service]="serviceToEdit()"
        (saved)="onServiceSaved()"
        (cancel)="onCancelForm()">
      </orb-service-form>
      
    </orb-dialog>

    <p-toast></p-toast>
    <p-confirmDialog [style]="{width: '450px'}"></p-confirmDialog>
  `,
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
  tableRows = signal(15);
  tableFirst = signal(0);


  // Table configuration
  tableColumns = [
    { field: 'service', header: 'Servicio', sortable: true },
    { field: 'basePrice', header: 'Precio Base', sortable: true },
    { field: 'duration', header: 'Duración', sortable: true },
    { field: 'category', header: 'Categoría', sortable: true },
    { field: 'status', header: 'Estado', sortable: true },
    { field: 'actions', header: '', width: '10px', sortable: false }
  ];

  tableFeaturesConfig = {
    showGlobalSearch: true,
    globalSearchPlaceholder: 'Buscar servicios...'
  };

  // Acciones para cada fila de la tabla (Solo Editar)
  serviceRowActions: OrbActionItem<ServiceResponseDto>[] = [
    {
      label: 'Editar',
      icon: 'pi pi-pencil',
      action: (service) => {
        if (service) this.editService(service);
      }
    }
  ];

  // Acción para la cabecera de la tabla (Nuevo Servicio)
  serviceTableHeaderActions: OrbActionItem[] = [
    {
      label: 'Nuevo Servicio',
      icon: 'pi pi-plus',
      action: () => this.showServiceForm()
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

  // Removed conversion method - now passing ServiceResponseDto directly
}