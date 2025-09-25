import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { MessageService, ConfirmationService } from 'primeng/api';
import { OrbTableComponent, OrbDialogComponent, OrbCardComponent, OrbActionsPopoverComponent, OrbMainHeaderComponent, OrbButtonComponent, OrbEntityAvatarComponent } from '@orb-components';
import { UsersStore } from '@orb-stores/users/users.store';
import { AuthStore } from '@orb-stores';
import { UserResponseDto, RoleResponseDto, PermissionResponseDto } from '../../../api/model/models';
import { TableColumn, OrbActionItem, OrbTableFeatures } from '@orb-models';
import { EmailManagementService } from '../../email-management/services/email-management.service';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { ChipModule } from 'primeng/chip';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { UserEditFormComponent } from '../modal/user-edit-form.component';
import { AgendaConfigModalComponent } from '../../agenda/components/agenda-config-modal/agenda-config-modal.component';

@Component({
  selector: 'orb-users-list',
  standalone: true,
  imports: [
    CommonModule,
    AsyncPipe,
    TranslateModule,
    OrbTableComponent,
    OrbDialogComponent,
    OrbActionsPopoverComponent,
    OrbMainHeaderComponent,
    OrbButtonComponent,
    OrbEntityAvatarComponent,
    MessageModule,
    TagModule,
    ChipModule,
    ToastModule,
    ConfirmDialogModule,
    OrbCardComponent,
    UserEditFormComponent,
    AgendaConfigModalComponent
  ],
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss'],
  providers: [UsersStore, MessageService, ConfirmationService], // Provee el store a este componente y sus hijos
})
export class UsersListComponent implements OnInit, OnDestroy {
  public readonly usersStore = inject(UsersStore);
  private readonly authStore = inject(AuthStore);
  private readonly translate = inject(TranslateService);
  private readonly emailService = inject(EmailManagementService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly destroy$ = new Subject<void>();

  public users$ = this.usersStore.users$;
  public loading$ = this.usersStore.loading$;
  public error$ = this.usersStore.error$;
  
  private canManageAgendaValue = false;


  public columns: TableColumn[] = [
    { field: 'profile', header: 'Usuario', sortable: false, width: '300px' },
    { field: 'roles', header: 'Roles', sortable: false, width: '200px' },
    { field: 'isAdmin', header: 'Admin', sortable: true, width: '68px' },
    { field: 'active', header: 'Estado', sortable: true, width: '120px' },
    { field: 'actions', header: '', sortable: false, width: '10px' }
  ];

  tableFeaturesConfig: OrbTableFeatures = {
    showGlobalSearch: true,
    globalSearchPlaceholder: 'Buscar usuarios...'
  };

  displayUserEditModal = signal(false);
  userToEdit = signal<UserResponseDto | undefined>(undefined);
  isEditMode = signal(false);
  
  displayAgendaConfigModal = signal(false);
  selectedProfessionalId = signal<number | null>(null);

  public actions: OrbActionItem<UserResponseDto>[] = [];

  tableRows = signal(15);
  tableFirst = signal(0);

  private canManageAgenda(): boolean {
    return this.canManageAgendaValue;
  }

  private openAgendaConfig(user: UserResponseDto): void {    
    this.selectedProfessionalId.set(user.id);
    this.displayAgendaConfigModal.set(true);    
  }

  ngOnInit(): void {
    this.initializeActions();
    this.usersStore.loadSubUsers();
    
    // Subscribe to canManageAgenda and store the value
    this.authStore.canManageAgenda$
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.canManageAgendaValue = value);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openUserEditModal(user?: UserResponseDto): void {
    if (user) {
      this.isEditMode.set(true);
      this.userToEdit.set({ ...user });
    } else {
      this.isEditMode.set(false);
      this.userToEdit.set(undefined);
    }
    this.displayUserEditModal.set(true);
  }

  onUserFormSaved(): void {
    this.displayUserEditModal.set(false);
    this.userToEdit.set(undefined);
    // Recargar la lista de usuarios para reflejar los cambios
    this.usersStore.loadSubUsers();
  }

  onUserFormCancel(): void {
    this.displayUserEditModal.set(false);
    this.userToEdit.set(undefined);
  }

  onAgendaConfigModalClose(): void {    
    this.displayAgendaConfigModal.set(false);
    this.selectedProfessionalId.set(null);    
  }

  // onDeleteUser(user: UserResponseDto): void {
//   
  //   // TODO: Implementar lógica de eliminación
  // }

  getRoleNames(roles: RoleResponseDto[]): string {
    return roles.map(role => role.name).join(', ');
  }

  getPermissionNames(permissions: PermissionResponseDto[]): string {
    return permissions.map(permission => permission.name).join(', ');
  }

  // Email actions
  sendWelcomeEmail(user: UserResponseDto): void {
    this.confirmationService.confirm({
      message: `¿Enviar email de bienvenida a ${user.fullName}?`,
      header: 'Confirmar Envío',
      icon: 'pi pi-envelope',
      acceptLabel: 'Enviar',
      rejectLabel: 'Cancelar',
      accept: async () => {
        try {
          const response = await this.emailService.sendWelcomeEmail(user.id.toString()).toPromise();
          
          if (response?.success) {
            this.messageService.add({
              severity: 'success',
              summary: 'Email Enviado',
              detail: `Email de bienvenida enviado a ${user.email}`
            });
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error al Enviar',
              detail: response?.error || 'No se pudo enviar el email de bienvenida'
            });
          }
        } catch (error: any) {
          console.error('Welcome email error:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al enviar el email de bienvenida'
          });
        }
      }
    });
  }

  sendPasswordResetEmail(user: UserResponseDto): void {
    this.confirmationService.confirm({
      message: `¿Enviar email para restablecer la contraseña de ${user.fullName}?`,
      header: 'Confirmar Envío',
      icon: 'pi pi-key',
      acceptLabel: 'Enviar',
      rejectLabel: 'Cancelar',
      accept: async () => {
        try {
          const response = await this.emailService.sendPasswordResetEmail(user.email).toPromise();
          
          if (response?.success) {
            this.messageService.add({
              severity: 'success',
              summary: 'Email Enviado',
              detail: `Email de restablecimiento enviado a ${user.email}`
            });
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error al Enviar',
              detail: response?.error || 'No se pudo enviar el email de restablecimiento'
            });
          }
        } catch (error: any) {
          console.error('Password reset email error:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al enviar el email de restablecimiento'
          });
        }
      }
    });
  }

  private hasEmailSettings(): boolean {
    return !!this.emailService.getCurrentSettings()?.id;
  }

  // Método para el botón del toolbar, que llama a la lógica unificada
  showUserForm(): void {
    this.openUserEditModal();
  }

  private initializeActions(): void {
    this.actions = [
      {
        label: 'Editar',
        icon: 'pi pi-pencil',
        action: (item?: UserResponseDto) => item && this.openUserEditModal(item),
      },
      {
        label: 'Configurar Agenda',
        icon: 'pi pi-calendar',
        action: (item?: UserResponseDto) => item && this.openAgendaConfig(item),
        visible: (item?: UserResponseDto) => this.canManageAgenda()
      },
      {
        label: 'Enviar Bienvenida',
        icon: 'pi pi-envelope',
        action: (item?: UserResponseDto) => item && this.sendWelcomeEmail(item),
        visible: (item?: UserResponseDto) => this.hasEmailSettings()
      },
      {
        label: 'Resetear Contraseña',
        icon: 'fas fa-key',
        action: (item?: UserResponseDto) => item && this.sendPasswordResetEmail(item),
        visible: (item?: UserResponseDto) => this.hasEmailSettings()
      }
    ];
  }

}
