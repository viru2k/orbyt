import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// PrimeNG Components
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';

// Orb Components
import { OrbToolbarComponent, OrbBreadcrumbComponent, OrbCardComponent, OrbButtonComponent, OrbTableComponent, OrbDialogComponent, OrbActionsPopoverComponent, OrbEntityAvatarComponent } from '@orb-components';

// Services and Models
import { BusinessTypesService } from '../../../api/services/business-types.service';
import { ConsultationTypeResponseDto } from '../../../api/models/consultation-type-response-dto';
import { ServiceFormComponent } from '../modal/service-form.component';
import { ServiceResponseDto } from '../../../api/models/service-response-dto';
import { ServicesService } from '../../../api/services/services.service';
import { OrbActionItem } from '@orb-models';

@Component({
  selector: 'app-services-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ToastModule,
    ConfirmDialogModule,
    OrbToolbarComponent,
    OrbBreadcrumbComponent,
    OrbCardComponent,
    OrbButtonComponent,
    OrbTableComponent,
    OrbDialogComponent,
    OrbActionsPopoverComponent,
    OrbEntityAvatarComponent,
    ServiceFormComponent
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <!-- Breadcrumb superior -->
    <orb-breadcrumb [items]="breadcrumbItems"></orb-breadcrumb>

    <orb-toolbar>
      <div body></div>
      <div footer>
        <orb-button label="Nuevo Servicio" (click)="showServiceForm()" />
      </div>
    </orb-toolbar>

    <orb-card>
      <div class="grid" orbBody>
        <!-- Services Table -->
        <orb-table
          [value]="services()"
          [columns]="tableColumns"
          [loading]="isLoading()"
          [totalRecords]="services().length"
          [rows]="15"
          [first]="0"
          [tableFeatures]="tableFeaturesConfig"
          [globalFilterFields]="['name', 'description']"
          [rowActions]="serviceRowActions"
          [tableHeaderActions]="serviceTableHeaderActions"
          dataKey="id"
          paginatorPosition="both"
          [rowsPerPageOptions]="[15, 30, 50]"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} servicios">
          
          <ng-template pTemplate="body" let-service let-columns="columns">
            <tr>
              <td *ngFor="let col of columns">
                <ng-container [ngSwitch]="col.field">
                  
                  <!-- Service info column -->
                  <ng-container *ngSwitchCase="'service'">
                    <div class="flex align-items-center gap-3">
                      <orb-entity-avatar
                        [entity]="service"
                        entityType="product"
                        size="normal"
                        shape="circle"
                        [showTooltip]="true"
                        context="table"
                        [autoLoad]="true">
                      </orb-entity-avatar>
                      <div class="service-info">
                        <div class="service-name font-medium text-900">{{ service.name }}</div>
                        <div class="service-description text-600 text-sm">
                          {{ service.description || 'Sin descripción' }}
                        </div>
                      </div>
                    </div>
                  </ng-container>

                  <!-- Base price column -->
                  <ng-container *ngSwitchCase="'basePrice'">
                    {{ service.basePrice | currency:'EUR':'symbol':'1.2-2' }}
                  </ng-container>

                  <!-- Duration column -->
                  <ng-container *ngSwitchCase="'duration'">
                    <span *ngIf="service.duration">{{ service.duration }} min</span>
                    <span *ngIf="!service.duration" class="text-muted">-</span>
                  </ng-container>

                  <!-- Status column -->
                  <ng-container *ngSwitchCase="'status'">
                    <span [ngClass]="service.status === 'ACTIVE' ? 'status-active' : 'status-inactive'">
                      {{ service.status === 'ACTIVE' ? 'Activo' : 'Inactivo' }}
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
  private businessTypesService = inject(BusinessTypesService);
  private servicesService = inject(ServicesService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  // Flag para determinar si usar endpoints reales o temporales
  private useRealEndpoints = true; // ¡Ahora usar endpoints reales!

  // State signals
  services = signal<ServiceResponseDto[]>([]);
  isLoading = signal(false);
  displayServiceModal = signal(false);
  isEditMode = signal(false);
  serviceToEdit = signal<ServiceResponseDto | undefined>(undefined);

  // Breadcrumb configuration
  breadcrumbItems = [
    { label: 'Inicio', routerLink: '/dashboard' },
    { label: 'Gestión', routerLink: '/management' },
    { label: 'Servicios', routerLink: '/management/services' }
  ];

  // Table configuration
  tableColumns = [
    { field: 'service', header: 'Servicio', sortable: true },
    { field: 'basePrice', header: 'Precio Base', sortable: true },
    { field: 'duration', header: 'Duración', sortable: true },
    { field: 'status', header: 'Estado', sortable: true },
    { field: 'actions', header: '', width: '10px', sortable: false }
  ];

  tableFeaturesConfig = {
    showGlobalSearch: true,
    globalSearchPlaceholder: 'Buscar servicios...'
  };

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
      action: (service) => {
        if (service) this.deleteService(service);
      },
      styleClass: 'p-button-danger'
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
    this.loadServices();
  }

  private loadServices(): void {
    this.isLoading.set(true);
    
    if (this.useRealEndpoints) {
      // Usar endpoints reales de servicios
      this.servicesService.serviceControllerFindAll({ status: 'ACTIVE' })
        .subscribe({
          next: (response) => {
            this.services.set(response.services);
            this.isLoading.set(false);
          },
          error: (error) => {
            console.error('Error loading services:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Error al cargar la lista de servicios'
            });
            this.isLoading.set(false);
          }
        });
    } else {
      // Usar consultation types como fallback temporal
      this.businessTypesService.businessTypeControllerFindAllBusinessTypes()
        .subscribe({
          next: (businessTypes) => {
            if (businessTypes.length > 0) {
              // Cargar tipos de consulta del primer tipo de negocio
              const firstBusinessType = businessTypes[0];
              this.businessTypesService
                .businessTypeControllerFindConsultationTypesByBusinessType({ businessTypeId: firstBusinessType.id })
                .subscribe({
                  next: (consultationTypes) => {
                    // Convertir ConsultationTypeResponseDto a ServiceResponseDto
                    const convertedServices: ServiceResponseDto[] = consultationTypes.map(ct => ({
                      id: ct.id,
                      name: ct.name,
                      description: ct.description || '',
                      category: 'Consulta',
                      basePrice: ct.defaultPrice || 0,
                      duration: ct.defaultDuration,
                      status: ct.isActive ? 'ACTIVE' : 'INACTIVE' as 'ACTIVE' | 'INACTIVE',
                      thumbnailUrl: undefined,
                      notes: '',
                      createdAt: ct.createdAt,
                      updatedAt: ct.updatedAt,
                      owner: {
                        id: 1,
                        email: 'system@orbyt.com',
                        fullName: 'Sistema'
                      }
                    }));
                    this.services.set(convertedServices);
                    this.isLoading.set(false);
                  },
                  error: (error) => {
                    console.error('Error loading consultation types:', error);
                    this.messageService.add({
                      severity: 'error',
                      summary: 'Error',
                      detail: 'Error al cargar la lista de servicios'
                    });
                    this.isLoading.set(false);
                  }
                });
            } else {
              this.services.set([]);
              this.isLoading.set(false);
            }
          },
          error: (error) => {
            console.error('Error loading business types:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Error al cargar la lista de servicios'
            });
            this.isLoading.set(false);
          }
        });
    }
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

  deleteService(service: ServiceResponseDto): void {
    this.confirmationService.confirm({
      message: `¿Estás seguro de que deseas eliminar el servicio "${service.name}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.performDelete(service.id);
      }
    });
  }

  private performDelete(serviceId: number): void {
    this.servicesService.serviceControllerRemove({ id: serviceId })
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Servicio eliminado exitosamente'
          });
          this.loadServices();
        },
        error: (error) => {
          console.error('Error deleting service:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al eliminar el servicio'
          });
        }
      });
  }

  onServiceSaved(): void {
    this.displayServiceModal.set(false);
    this.isEditMode.set(false);
    this.serviceToEdit.set(undefined);
    this.loadServices(); // Recargar la lista
  }

  onCancelForm(): void {
    this.displayServiceModal.set(false);
    this.isEditMode.set(false);
    this.serviceToEdit.set(undefined);
  }
}