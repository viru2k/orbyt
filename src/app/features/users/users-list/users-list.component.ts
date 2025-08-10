import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { OrbTableComponent, OrbDialogComponent, OrbCardComponent, OrbActionsPopoverComponent } from '@orb-components';
import { UsersStore } from '@orb-stores/users/users.store';
import { AuthStore } from '@orb-stores';
import { UserResponseDto, RoleResponseDto, PermissionResponseDto } from '../../../api/model/models';
import { TableColumn, OrbActionItem } from '@orb-models';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { ChipModule } from 'primeng/chip';
import { UserEditFormComponent } from '../modal/user-edit-form.component';
import { AgendaConfigModalComponent } from '../../agenda/components/agenda-config-modal/agenda-config-modal.component';

@Component({
  selector: 'orb-users-list',
  standalone: true,
  imports: [
    CommonModule,
    AsyncPipe,
    OrbTableComponent,
    OrbDialogComponent,
    OrbActionsPopoverComponent,
    MessageModule,
    TagModule,
    ChipModule,
    OrbCardComponent,
    UserEditFormComponent,
    AgendaConfigModalComponent
  ],
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss'],
  providers: [UsersStore], // Provee el store a este componente y sus hijos
})
export class UsersListComponent implements OnInit {
  public readonly usersStore = inject(UsersStore);
  private readonly authStore = inject(AuthStore);

  public users$ = this.usersStore.users$;
  public loading$ = this.usersStore.loading$;
  public error$ = this.usersStore.error$;

  displayUserEditModal = signal(false);
  userToEdit = signal<UserResponseDto | undefined>(undefined);
  
  displayAgendaConfigModal = signal(false);
  selectedProfessionalId = signal<number | null>(null);

  public columns: TableColumn[] = [
    { field: 'fullName', header: 'Nombre Completo' },
    { field: 'email', header: 'Correo Electrónico' },
    { field: 'isAdmin', header: 'Admin' },
    { field: 'active', header: 'Activo' },
    { field: 'createdAt', header: 'Fecha Creación' },
    { field: 'actions', header: 'Acciones', sortable: false }
  ];

  public actions: OrbActionItem<UserResponseDto>[] = [
    {
      label: 'Editar',
      icon: 'pi pi-pencil',
      action: (item?: UserResponseDto) => item && this.openUserEditModal(item),
    },
    {
      label: 'Agenda',
      icon: 'pi pi-calendar-plus',
      action: (item?: UserResponseDto) => item && this.openAgendaConfig(item),
      visible: (item?: UserResponseDto) => this.canManageAgenda()
    }
  ];

  private canManageAgenda(): boolean {
    // Suscribirse al observable para obtener el valor actual
    let canManage = false;
    this.authStore.canManageAgenda$.subscribe(value => canManage = value).unsubscribe();
    return canManage;
  }

  private openAgendaConfig(user: UserResponseDto): void {
    this.selectedProfessionalId.set(user.id);
    this.displayAgendaConfigModal.set(true);
  }

  ngOnInit(): void {
    this.usersStore.loadUsers();
  }

  openUserEditModal(user: UserResponseDto): void {
    this.userToEdit.set({ ...user });
    this.displayUserEditModal.set(true);
  }

  onUserFormSaved(): void {
    this.displayUserEditModal.set(false);
    this.userToEdit.set(undefined);
    // Recargar la lista de usuarios para reflejar los cambios
    this.usersStore.loadUsers();
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
  //   console.log('Eliminar usuario:', user);
  //   // TODO: Implementar lógica de eliminación
  // }

  getRoleNames(roles: RoleResponseDto[]): string {
    return roles.map(role => role.name).join(', ');
  }

  getPermissionNames(permissions: PermissionResponseDto[]): string {
    return permissions.map(permission => permission.name).join(', ');
  }
}
