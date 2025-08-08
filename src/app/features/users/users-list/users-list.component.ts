import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { OrbTableComponent, OrbDialogComponent, OrbCardComponent } from '@orb-components';
import { UsersStore } from '@orb-stores/users/users.store';
import { UserResponseDto, RoleResponseDto, PermissionResponseDto } from '../../../api/model/models';
import { TableColumn, OrbActionItem } from '@orb-models';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { ChipModule } from 'primeng/chip';
import { UserEditFormComponent } from '../modal/user-edit-form.component';

@Component({
  selector: 'orb-users-list',
  standalone: true,
  imports: [
    CommonModule,
    AsyncPipe,
    OrbTableComponent,
    OrbDialogComponent,
    MessageModule,
    TagModule,
    ChipModule,
    OrbCardComponent,
    UserEditFormComponent
  ],
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss'],
  providers: [UsersStore], // Provee el store a este componente y sus hijos
})
export class UsersListComponent implements OnInit {
  public readonly usersStore = inject(UsersStore);

  public users$ = this.usersStore.users$;
  public loading$ = this.usersStore.loading$;
  public error$ = this.usersStore.error$;

  displayUserEditModal = signal(false);
  userToEdit = signal<UserResponseDto | undefined>(undefined);

  public columns: TableColumn[] = [
    { field: 'fullName', header: 'Nombre Completo' },
    { field: 'email', header: 'Correo Electrónico' },
    { field: 'isAdmin', header: 'Admin' },
    { field: 'active', header: 'Activo' },
    { field: 'createdAt', header: 'Fecha Creación' },
  ];

  public actions: OrbActionItem<UserResponseDto>[] = [
    {
      label: 'Editar',
      icon: 'pi pi-pencil',
      action: (item?: UserResponseDto) => item && this.openUserEditModal(item),
    }
  ];

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
  }

  onUserFormCancel(): void {
    this.displayUserEditModal.set(false);
    this.userToEdit.set(undefined);
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
