import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';

// PrimeNG Components
import { TabViewModule } from 'primeng/tabview';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AccordionModule } from 'primeng/accordion';
import { DividerModule } from 'primeng/divider';
import { PanelModule } from 'primeng/panel';

// Orb Components
import {
  OrbTableComponent,
  OrbButtonComponent,
  OrbBreadcrumbComponent,
  OrbToolbarComponent,
  OrbCardComponent,
} from '@orb-components';

// Models and Services
import {
  ModuleDefinition,
  UserModuleAccess,
  RoleModuleAccess,
  ModuleCategory,
  ModuleAction,
  AccessSource,
  ModuleAccessSummary,
  ModulePermission,
} from '../models/module-access.models';
import { ModuleAccessService } from '../services/module-access.service';
import { UserResponseDto, RoleResponseDto } from '../../../api/models';
import { UsersService } from '../../../api/services/users.service';
import { RolesService } from '../../../api/services/roles.service';

interface PermissionControl {
  action: ModuleAction;
  label: string;
  description: string;
}

@Component({
  selector: 'app-module-access-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TabViewModule,
    TableModule,
    ButtonModule,
    CheckboxModule,
    DropdownModule,
    InputTextModule,
    CardModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    ProgressSpinnerModule,
    AccordionModule,
    DividerModule,
    PanelModule,
    OrbButtonComponent,
    OrbBreadcrumbComponent,
    OrbToolbarComponent,
    OrbCardComponent,
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="module-access-management">
      <!-- Header -->
      <orb-breadcrumb
        [items]="breadcrumbItems"
        [home]="{ icon: 'fa fa-home', routerLink: '/dashboard' }"
      >
      </orb-breadcrumb>

      <orb-toolbar>
        <h1>
          <i class="fa fa-shield-alt"></i>
          Gestión de Accesos a Módulos
        </h1>
        <p>Administra el acceso de usuarios y roles a los diferentes módulos del sistema</p>
      </orb-toolbar>

      <!-- Main Content -->
      <div class="content-wrapper">
        <p-tabView [(activeIndex)]="activeTabIndex">
          <!-- Users Access Tab -->
          <p-tabPanel header="Accesos por Usuario" leftIcon="fa fa-users">
            <div class="tab-content">
              <!-- User Selection -->
              <orb-card>
                <div class="user-selection">
                  <h3><i class="fa fa-user"></i> Seleccionar Usuario</h3>
                  <p-dropdown
                    [options]="users()"
                    [(ngModel)]="selectedUser"
                    optionLabel="fullName"
                    optionValue="id"
                    placeholder="Selecciona un usuario"
                    [filter]="true"
                    filterBy="fullName,email"
                    [showClear]="true"
                    (onChange)="onUserSelected($event.value)"
                    styleClass="w-full"
                  >
                    <ng-template pTemplate="selectedItem" let-user>
                      <div class="user-item" *ngIf="user">
                        <i class="fa fa-user"></i>
                        {{ getSelectedUserName() }}
                        <small class="user-email">{{ getSelectedUserEmail() }}</small>
                      </div>
                    </ng-template>
                    <ng-template pTemplate="item" let-user>
                      <div class="user-item">
                        <i class="fa fa-user"></i>
                        {{ user.fullName }}
                        <small class="user-email">{{ user.email }}</small>
                        <p-tag
                          *ngIf="user.isAdmin"
                          value="Admin"
                          severity="danger"
                          class="ml-2"
                        ></p-tag>
                      </div>
                    </ng-template>
                  </p-dropdown>
                </div>
              </orb-card>

              <!-- User Module Access -->
              <orb-card *ngIf="selectedUserAccess()">
                <div class="module-access-content">
                  <div class="access-header">
                    <h3>
                      <i class="fa fa-key"></i>
                      Accesos de {{ selectedUserAccess()?.userName }}
                    </h3>
                    <orb-button
                      label="Guardar Cambios"
                      icon="fa fa-save"
                      (clicked)="saveUserAccess()"
                      [disabled]="saving()"
                      severity="info"
                      variant="outlined"
                    >
                    </orb-button>
                  </div>

                  <div class="modules-grid">
                    <p-accordion [multiple]="true" [activeIndex]="[0, 1, 2, 3, 4, 5]">
                      <p-accordionTab
                        *ngFor="let category of moduleCategories"
                        [header]="getCategoryLabel(category)"
                      >
                        <div class="category-modules">
                          <div
                            *ngFor="let module of getModulesByCategory(category)"
                            class="module-card"
                            [class.system-module]="module.isSystem"
                            [class.admin-required]="module.requiresAdmin"
                          >
                            <div class="module-header">
                              <div class="module-info">
                                <i [class]="module.icon"></i>
                                <div class="module-details">
                                  <h4>{{ module.name }}</h4>
                                  <p>{{ module.description }}</p>
                                  <div class="module-meta">
                                    <p-tag
                                      [value]="getCategoryLabel(module.category)"
                                      [severity]="getCategorySeverity(module.category)"
                                    >
                                    </p-tag>
                                    <p-tag
                                      *ngIf="module.isSystem"
                                      value="Sistema"
                                      severity="info"
                                    ></p-tag>
                                    <p-tag
                                      *ngIf="module.requiresAdmin"
                                      value="Solo Admin"
                                      severity="danger"
                                    ></p-tag>
                                  </div>
                                </div>
                              </div>

                              <div class="module-access-toggle">
                                <p-checkbox
                                  [(ngModel)]="getModuleAccess(module.id).hasAccess"
                                  [disabled]="
                                    module.isSystem ||
                                    (module.requiresAdmin && !isSelectedUserAdmin())
                                  "
                                  binary="true"
                                  (onChange)="onModuleAccessChanged(module.id, $event.checked)"
                                >
                                </p-checkbox>
                                <label>Acceso</label>
                              </div>
                            </div>

                            <!-- Permissions -->
                            <div
                              class="module-permissions"
                              *ngIf="getModuleAccess(module.id).hasAccess"
                            >
                              <p-divider></p-divider>
                              <h5><i class="fa fa-cog"></i> Permisos</h5>
                              <div class="permissions-grid">
                                <div
                                  *ngFor="
                                    let permission of getAvailablePermissions(module.category)
                                  "
                                  class="permission-item"
                                >
                                  <p-checkbox
                                    [ngModel]="getPermissionState(module.id, permission.action)"
                                    [disabled]="!getModuleAccess(module.id).hasAccess"
                                    binary="true"
                                    (onChange)="
                                      onPermissionChanged(
                                        module.id,
                                        permission.action,
                                        $event.checked
                                      )
                                    "
                                  >
                                  </p-checkbox>
                                  <div class="permission-info">
                                    <label>{{ permission.label }}</label>
                                    <small>{{ permission.description }}</small>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <!-- Access Source Info -->
                            <div class="access-source" *ngIf="getModuleAccess(module.id).hasAccess">
                              <small>
                                <i class="fa fa-info-circle"></i>
                                Fuente:
                                {{ getAccessSourceLabel(getModuleAccess(module.id).source) }}
                              </small>
                            </div>
                          </div>
                        </div>
                      </p-accordionTab>
                    </p-accordion>
                  </div>
                </div>
              </orb-card>
            </div>
          </p-tabPanel>

          <!-- Roles Access Tab -->
          <p-tabPanel header="Accesos por Rol" leftIcon="fa fa-user-tag">
            <div class="tab-content">
              <!-- Role Selection -->
              <orb-card>
                <div class="role-selection">
                  <h3><i class="fa fa-user-tag"></i> Seleccionar Rol</h3>
                  <p-dropdown
                    [options]="roles()"
                    [(ngModel)]="selectedRole"
                    optionLabel="name"
                    optionValue="id"
                    placeholder="Selecciona un rol"
                    [filter]="true"
                    filterBy="name,description"
                    [showClear]="true"
                    (onChange)="onRoleSelected($event.value)"
                    styleClass="w-full"
                  >
                    <ng-template pTemplate="selectedItem" let-role>
                      <div class="role-item" *ngIf="role">
                        <i class="fa fa-user-tag"></i>
                        {{ getSelectedRoleName() }}
                      </div>
                    </ng-template>
                    <ng-template pTemplate="item" let-role>
                      <div class="role-item">
                        <i class="fa fa-user-tag"></i>
                        <div class="role-details">
                          <span class="role-name">{{ role.name }}</span>
                          <small class="role-description">{{ role.description }}</small>
                        </div>
                      </div>
                    </ng-template>
                  </p-dropdown>
                </div>
              </orb-card>

              <!-- Role Module Access -->
              <orb-card *ngIf="selectedRoleAccess()">
                <div class="module-access-content">
                  <div class="access-header">
                    <h3>
                      <i class="fa fa-key"></i>
                      Accesos del Rol {{ selectedRoleAccess()?.roleName }}
                    </h3>
                    <orb-button
                      label="Guardar Cambios"
                      icon="fa fa-save"
                      (clicked)="saveRoleAccess()"
                      [disabled]="saving()"
                      severity="info"
                      variant="outlined"
                    >
                    </orb-button>
                  </div>

                  <!-- Same module grid as users but for roles -->
                  <div class="modules-grid">
                    <p-accordion [multiple]="true" [activeIndex]="[0, 1, 2, 3, 4, 5]">
                      <p-accordionTab
                        *ngFor="let category of moduleCategories"
                        [header]="getCategoryLabel(category)"
                      >
                        <div class="category-modules">
                          <div
                            *ngFor="let module of getModulesByCategory(category)"
                            class="module-card"
                            [class.system-module]="module.isSystem"
                            [class.admin-required]="module.requiresAdmin"
                          >
                            <div class="module-header">
                              <div class="module-info">
                                <i [class]="module.icon"></i>
                                <div class="module-details">
                                  <h4>{{ module.name }}</h4>
                                  <p>{{ module.description }}</p>
                                  <div class="module-meta">
                                    <p-tag
                                      [value]="getCategoryLabel(module.category)"
                                      [severity]="getCategorySeverity(module.category)"
                                    >
                                    </p-tag>
                                    <p-tag
                                      *ngIf="module.isSystem"
                                      value="Sistema"
                                      severity="info"
                                    ></p-tag>
                                    <p-tag
                                      *ngIf="module.requiresAdmin"
                                      value="Solo Admin"
                                      severity="danger"
                                    ></p-tag>
                                  </div>
                                </div>
                              </div>

                              <div class="module-access-toggle">
                                <p-checkbox
                                  [(ngModel)]="getRoleModuleAccess(module.id).hasAccess"
                                  [disabled]="module.isSystem"
                                  binary="true"
                                  (onChange)="onRoleModuleAccessChanged(module.id, $event.checked)"
                                >
                                </p-checkbox>
                                <label>Acceso</label>
                              </div>
                            </div>

                            <!-- Permissions for roles -->
                            <div
                              class="module-permissions"
                              *ngIf="getRoleModuleAccess(module.id).hasAccess"
                            >
                              <p-divider></p-divider>
                              <h5><i class="fa fa-cog"></i> Permisos</h5>
                              <div class="permissions-grid">
                                <div
                                  *ngFor="
                                    let permission of getAvailablePermissions(module.category)
                                  "
                                  class="permission-item"
                                >
                                  <p-checkbox
                                    [ngModel]="getRolePermissionState(module.id, permission.action)"
                                    [disabled]="!getRoleModuleAccess(module.id).hasAccess"
                                    binary="true"
                                    (onChange)="
                                      onRolePermissionChanged(
                                        module.id,
                                        permission.action,
                                        $event.checked
                                      )
                                    "
                                  >
                                  </p-checkbox>
                                  <div class="permission-info">
                                    <label>{{ permission.label }}</label>
                                    <small>{{ permission.description }}</small>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </p-accordionTab>
                    </p-accordion>
                  </div>
                </div>
              </orb-card>
            </div>
          </p-tabPanel>

          <!-- Modules Overview Tab -->
          <p-tabPanel header="Vista de Módulos" leftIcon="fa fa-th-large">
            <div class="tab-content">
              <orb-card>
                <h3><i class="fa fa-th-large"></i> Módulos del Sistema</h3>
                <p>Vista general de todos los módulos disponibles en el sistema</p>

                <div class="modules-overview">
                  <p-accordion [multiple]="true" [activeIndex]="[0, 1, 2, 3, 4, 5]">
                    <p-accordionTab
                      *ngFor="let category of moduleCategories"
                      [header]="getCategoryLabel(category)"
                    >
                      <div class="category-overview">
                        <div class="category-stats">
                          <div class="stat-item">
                            <i class="fa fa-cube"></i>
                            <span>{{ getModulesByCategory(category).length }} módulos</span>
                          </div>
                          <div class="stat-item">
                            <i class="fa fa-shield-alt"></i>
                            <span>{{ getAdminModulesByCategory(category).length }} solo admin</span>
                          </div>
                          <div class="stat-item">
                            <i class="fa fa-lock"></i>
                            <span>{{ getSystemModulesByCategory(category).length }} sistema</span>
                          </div>
                        </div>

                        <div class="modules-list">
                          <div
                            *ngFor="let module of getModulesByCategory(category)"
                            class="module-overview-item"
                          >
                            <i [class]="module.icon"></i>
                            <div class="module-info">
                              <h5>{{ module.name }}</h5>
                              <p>{{ module.description }}</p>
                              <div class="module-badges">
                                <p-tag
                                  *ngIf="module.isSystem"
                                  value="Sistema"
                                  severity="info"
                                ></p-tag>
                                <p-tag
                                  *ngIf="module.requiresAdmin"
                                  value="Solo Admin"
                                  severity="danger"
                                ></p-tag>
                                <p-tag [value]="module.route" severity="secondary"></p-tag>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </p-accordionTab>
                  </p-accordion>
                </div>
              </orb-card>
            </div>
          </p-tabPanel>
        </p-tabView>
      </div>

      <!-- Loading Spinner -->
      <div *ngIf="loading()" class="loading-overlay">
        <p-progressSpinner></p-progressSpinner>
      </div>
    </div>

    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>
  `,
  styleUrls: ['./module-access-management.component.scss'],
})
export class ModuleAccessManagementComponent implements OnInit {
  private readonly moduleAccessService = inject(ModuleAccessService);
  private readonly usersService = inject(UsersService);
  private readonly rolesService = inject(RolesService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  // Signals for reactive state management
  loading = signal(false);
  saving = signal(false);
  users = signal<UserResponseDto[]>([]);
  roles = signal<RoleResponseDto[]>([]);
  modules = signal<ModuleDefinition[]>([]);
  selectedUser = signal<number | null>(null);
  selectedRole = signal<number | null>(null);
  selectedUserAccess = signal<UserModuleAccess | null>(null);
  selectedRoleAccess = signal<RoleModuleAccess | null>(null);
  activeTabIndex = signal(0);

  // UI Configuration
  breadcrumbItems = [
    { label: 'Gestión', routerLink: '/management' },
    { label: 'Accesos a Módulos' },
  ];

  moduleCategories = Object.values(ModuleCategory);

  // Permission controls
  permissionControls: Record<ModuleCategory, PermissionControl[]> = {
    [ModuleCategory.CORE]: [
      { action: ModuleAction.READ, label: 'Ver', description: 'Acceso de solo lectura' },
    ],
    [ModuleCategory.MANAGEMENT]: [
      { action: ModuleAction.READ, label: 'Ver', description: 'Ver registros' },
      { action: ModuleAction.CREATE, label: 'Crear', description: 'Crear nuevos registros' },
      {
        action: ModuleAction.UPDATE,
        label: 'Editar',
        description: 'Modificar registros existentes',
      },
      { action: ModuleAction.DELETE, label: 'Eliminar', description: 'Eliminar registros' },
      { action: ModuleAction.EXPORT, label: 'Exportar', description: 'Exportar datos' },
    ],
    [ModuleCategory.OPERATIONS]: [
      { action: ModuleAction.READ, label: 'Ver', description: 'Ver información' },
      { action: ModuleAction.CREATE, label: 'Crear', description: 'Crear nuevos elementos' },
      { action: ModuleAction.UPDATE, label: 'Editar', description: 'Modificar elementos' },
      { action: ModuleAction.EXPORT, label: 'Exportar', description: 'Exportar reportes' },
    ],
    [ModuleCategory.REPORTS]: [
      { action: ModuleAction.READ, label: 'Ver', description: 'Ver reportes' },
      { action: ModuleAction.EXPORT, label: 'Exportar', description: 'Exportar reportes' },
    ],
    [ModuleCategory.SETTINGS]: [
      { action: ModuleAction.READ, label: 'Ver', description: 'Ver configuraciones' },
      { action: ModuleAction.UPDATE, label: 'Editar', description: 'Modificar configuraciones' },
      { action: ModuleAction.ADMIN, label: 'Admin', description: 'Acceso administrativo completo' },
    ],
    [ModuleCategory.INTEGRATIONS]: [
      { action: ModuleAction.READ, label: 'Ver', description: 'Ver integraciones' },
      { action: ModuleAction.CREATE, label: 'Crear', description: 'Crear configuraciones' },
      { action: ModuleAction.UPDATE, label: 'Editar', description: 'Modificar configuraciones' },
    ],
  };

  // Computed properties
  selectedUserName = computed(() => {
    const userId = this.selectedUser();
    if (!userId) return '';
    const user = this.users().find((u) => u.id === userId);
    return user?.fullName || '';
  });

  ngOnInit(): void {
    this.loadInitialData();
  }

  private async loadInitialData(): Promise<void> {
    this.loading.set(true);

    try {
      // Load all initial data in parallel
      const [users, roles, modules] = await Promise.all([
        this.moduleAccessService.getAllUsersModuleAccess().toPromise(),
        this.moduleAccessService.getAllRolesModuleAccess().toPromise(),
        this.moduleAccessService.getModules().toPromise(),
      ]);

      // Convert UserModuleAccess[] to simple user objects for the dropdown
      const userOptions = (users || []).map((ua) => ({
        id: ua.userId,
        fullName: ua.userName,
        email: ua.userEmail,
        isAdmin: ua.isAdmin,
      }));

      // Convert RoleModuleAccess[] to simple role objects for the dropdown
      const roleOptions = (roles || []).map((ra) => ({
        id: ra.roleId,
        name: ra.roleName,
        description: ra.roleDescription,
      }));

      this.users.set(userOptions as any);
      this.roles.set(roleOptions as any);
      this.modules.set(modules || []);
    } catch (error) {
      console.error('Error loading initial data:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar los datos iniciales',
      });
    } finally {
      this.loading.set(false);
    }
  }

  // User Management Methods
  async onUserSelected(userId: number): Promise<void> {
    if (!userId) {
      this.selectedUser.set(null);
      this.selectedUserAccess.set(null);
      return;
    }

    this.selectedUser.set(userId);
    this.loading.set(true);

    try {
      const userAccess = await this.moduleAccessService.getUserModuleAccess(userId).toPromise();
      this.selectedUserAccess.set(userAccess || null);
    } catch (error) {
      console.error('Error loading user access:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar los accesos del usuario',
      });
    } finally {
      this.loading.set(false);
    }
  }

  async saveUserAccess(): Promise<void> {
    const userAccess = this.selectedUserAccess();
    if (!userAccess) return;

    this.saving.set(true);

    try {
      await this.moduleAccessService
        .updateUserModuleAccess(userAccess.userId, userAccess.modules)
        .toPromise();

      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Accesos del usuario actualizados correctamente',
      });
    } catch (error) {
      console.error('Error saving user access:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al guardar los accesos del usuario',
      });
    } finally {
      this.saving.set(false);
    }
  }

  // Role Management Methods
  async onRoleSelected(roleId: number): Promise<void> {
    if (!roleId) {
      this.selectedRole.set(null);
      this.selectedRoleAccess.set(null);
      return;
    }

    this.selectedRole.set(roleId);
    this.loading.set(true);

    try {
      const roleAccess = await this.moduleAccessService.getRoleModuleAccess(roleId).toPromise();
      this.selectedRoleAccess.set(roleAccess || null);
    } catch (error) {
      console.error('Error loading role access:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al cargar los accesos del rol',
      });
    } finally {
      this.loading.set(false);
    }
  }

  async saveRoleAccess(): Promise<void> {
    const roleAccess = this.selectedRoleAccess();
    if (!roleAccess) return;

    this.saving.set(true);

    try {
      await this.moduleAccessService
        .updateRoleModuleAccess(roleAccess.roleId, roleAccess.modules)
        .toPromise();

      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Accesos del rol actualizados correctamente',
      });
    } catch (error) {
      console.error('Error saving role access:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al guardar los accesos del rol',
      });
    } finally {
      this.saving.set(false);
    }
  }

  // Access Management Methods
  getModuleAccess(moduleId: string): ModuleAccessSummary {
    const userAccess = this.selectedUserAccess();
    if (!userAccess) {
      return {
        moduleId,
        moduleName: '',
        hasAccess: false,
        permissions: [],
        source: AccessSource.SYSTEM,
      };
    }

    return (
      userAccess.modules.find((m) => m.moduleId === moduleId) || {
        moduleId,
        moduleName: '',
        hasAccess: false,
        permissions: [],
        source: AccessSource.SYSTEM,
      }
    );
  }

  getRoleModuleAccess(moduleId: string): ModuleAccessSummary {
    const roleAccess = this.selectedRoleAccess();
    if (!roleAccess) {
      return {
        moduleId,
        moduleName: '',
        hasAccess: false,
        permissions: [],
        source: AccessSource.SYSTEM,
      };
    }

    return (
      roleAccess.modules.find((m) => m.moduleId === moduleId) || {
        moduleId,
        moduleName: '',
        hasAccess: false,
        permissions: [],
        source: AccessSource.SYSTEM,
      }
    );
  }

  onModuleAccessChanged(moduleId: string, hasAccess: boolean): void {
    const userAccess = this.selectedUserAccess();
    if (!userAccess) return;

    const moduleAccess = userAccess.modules.find((m) => m.moduleId === moduleId);
    if (moduleAccess) {
      moduleAccess.hasAccess = hasAccess;
      if (!hasAccess) {
        // Reset all permissions when access is disabled
        moduleAccess.permissions.forEach((p) => (p.granted = false));
      }
    }

    this.selectedUserAccess.set({ ...userAccess });
  }

  onRoleModuleAccessChanged(moduleId: string, hasAccess: boolean): void {
    const roleAccess = this.selectedRoleAccess();
    if (!roleAccess) return;

    const moduleAccess = roleAccess.modules.find((m) => m.moduleId === moduleId);
    if (moduleAccess) {
      moduleAccess.hasAccess = hasAccess;
      if (!hasAccess) {
        moduleAccess.permissions.forEach((p) => (p.granted = false));
      }
    }

    this.selectedRoleAccess.set({ ...roleAccess });
  }

  // Permission Management
  getPermissionState(moduleId: string, action: ModuleAction): boolean {
    const moduleAccess = this.getModuleAccess(moduleId);
    const permission = moduleAccess.permissions.find((p) => p.action === action);
    return permission?.granted || false;
  }

  getRolePermissionState(moduleId: string, action: ModuleAction): boolean {
    const moduleAccess = this.getRoleModuleAccess(moduleId);
    const permission = moduleAccess.permissions.find((p) => p.action === action);
    return permission?.granted || false;
  }

  onPermissionChanged(moduleId: string, action: ModuleAction, granted: boolean): void {
    const userAccess = this.selectedUserAccess();
    if (!userAccess) return;

    const moduleAccess = userAccess.modules.find((m) => m.moduleId === moduleId);
    if (!moduleAccess) return;

    let permission = moduleAccess.permissions.find((p) => p.action === action);
    if (!permission) {
      permission = { action, granted: false };
      moduleAccess.permissions.push(permission);
    }
    permission.granted = granted;

    this.selectedUserAccess.set({ ...userAccess });
  }

  onRolePermissionChanged(moduleId: string, action: ModuleAction, granted: boolean): void {
    const roleAccess = this.selectedRoleAccess();
    if (!roleAccess) return;

    const moduleAccess = roleAccess.modules.find((m) => m.moduleId === moduleId);
    if (!moduleAccess) return;

    let permission = moduleAccess.permissions.find((p) => p.action === action);
    if (!permission) {
      permission = { action, granted: false };
      moduleAccess.permissions.push(permission);
    }
    permission.granted = granted;

    this.selectedRoleAccess.set({ ...roleAccess });
  }

  // UI Helper Methods
  getModulesByCategory(category: ModuleCategory): ModuleDefinition[] {
    return this.modules().filter((m) => m.category === category && !m.parentModule);
  }

  getAdminModulesByCategory(category: ModuleCategory): ModuleDefinition[] {
    return this.getModulesByCategory(category).filter((m) => m.requiresAdmin);
  }

  getSystemModulesByCategory(category: ModuleCategory): ModuleDefinition[] {
    return this.getModulesByCategory(category).filter((m) => m.isSystem);
  }

  getCategoryLabel(category: ModuleCategory): string {
    const labels: Record<ModuleCategory, string> = {
      [ModuleCategory.CORE]: 'Núcleo',
      [ModuleCategory.MANAGEMENT]: 'Gestión',
      [ModuleCategory.OPERATIONS]: 'Operaciones',
      [ModuleCategory.REPORTS]: 'Reportes',
      [ModuleCategory.SETTINGS]: 'Configuración',
      [ModuleCategory.INTEGRATIONS]: 'Integraciones',
    };
    return labels[category] || category;
  }

  getCategorySeverity(category: ModuleCategory): string {
    const severities: Record<ModuleCategory, string> = {
      [ModuleCategory.CORE]: 'info',
      [ModuleCategory.MANAGEMENT]: 'success',
      [ModuleCategory.OPERATIONS]: 'warning',
      [ModuleCategory.REPORTS]: 'secondary',
      [ModuleCategory.SETTINGS]: 'danger',
      [ModuleCategory.INTEGRATIONS]: 'contrast',
    };
    return severities[category] || 'secondary';
  }

  getAvailablePermissions(category: ModuleCategory): PermissionControl[] {
    return this.permissionControls[category] || [];
  }

  getAccessSourceLabel(source: AccessSource): string {
    const labels: Record<AccessSource, string> = {
      [AccessSource.DIRECT]: 'Directo',
      [AccessSource.ROLE]: 'Por Rol',
      [AccessSource.ADMIN]: 'Admin',
      [AccessSource.SYSTEM]: 'Sistema',
    };
    return labels[source] || source;
  }

  getSelectedUserName(): string {
    const userId = this.selectedUser();
    if (!userId) return '';
    const user = this.users().find((u) => u.id === userId);
    return user?.fullName || '';
  }

  getSelectedUserEmail(): string {
    const userId = this.selectedUser();
    if (!userId) return '';
    const user = this.users().find((u) => u.id === userId);
    return user?.email || '';
  }

  getSelectedRoleName(): string {
    const roleId = this.selectedRole();
    if (!roleId) return '';
    const role = this.roles().find((r) => r.id === roleId);
    return role?.name || '';
  }

  isSelectedUserAdmin(): boolean {
    const userId = this.selectedUser();
    if (!userId) return false;
    const user = this.users().find((u) => u.id === userId);
    return user?.isAdmin || false;
  }
}
