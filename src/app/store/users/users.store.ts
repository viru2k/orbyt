import { inject, Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { tapResponse } from '@ngrx/operators';
import { UserResponseDto, AdminUpdateUserDto, RoleDto, CreateSubUserDto, RoleResponseDto } from '../../api/model/models';

// Interfaces extendidas para nuevos endpoints
interface ExtendedCreateSubUserDto {
  email: string;
  password: string;
  fullName?: string;
  isActive?: boolean;
  isAdmin?: boolean;
  roles?: RoleResponseDto[];
}

interface ExtendedAdminUpdateUserDto {
  email?: string;
  fullName?: string;
  isActive?: boolean;
  isAdmin?: boolean;
  roles?: RoleResponseDto[];
}
import { UsersService } from '../../api/services/users.service';
import { RolesService } from '../../api/services/roles.service';
import { NotificationService } from '@orb-services';
import { exhaustMap, tap, withLatestFrom } from 'rxjs';
import { linkToGlobalState } from '../component-state.reducer';
import { Store } from '@ngrx/store';
import { NotificationSeverity } from '@orb-models';

export interface UsersState {
  users: UserResponseDto[];
  roles: RoleResponseDto[];
  loading: boolean;
  error: string | null;
}

const initialState: UsersState = {
  users: [],
  roles: [],
  loading: false,
  error: null,
};

@Injectable({ providedIn: 'root' })
export class UsersStore extends ComponentStore<UsersState> {
  private readonly usersService = inject(UsersService);
  private readonly rolesService = inject(RolesService);
  private readonly notificationService = inject(NotificationService);

  constructor(private readonly globalStore: Store) {
    super(initialState);
    linkToGlobalState(this.state$, 'UsersStore', this.globalStore);
  }

  // Selectores
  readonly users$ = this.select((state) => state.users);
  readonly roles$ = this.select((state) => state.roles);
  readonly loading$ = this.select((state) => state.loading);
  readonly error$ = this.select((state) => state.error);

  // Updaters
  readonly setLoading = this.updater((state, loading: boolean) => ({ ...state, loading }));
  readonly setUsers = this.updater((state, users: UserResponseDto[]) => ({
    ...state,
    users,
    loading: false,
    error: null,
  }));
  readonly setRoles = this.updater((state, roles: RoleResponseDto[]) => ({
    ...state,
    roles,
    loading: false,
    error: null,
  }));
  readonly updateUserInList = this.updater((state, updatedUser: UserResponseDto) => ({
    ...state,
    users: state.users.map(user => user.id === updatedUser.id ? updatedUser : user),
    loading: false,
    error: null,
  }));
  readonly addUserToList = this.updater((state, newUser: UserResponseDto) => ({
    ...state,
    users: [...state.users, newUser],
    loading: false,
    error: null,
  }));
  readonly setError = this.updater((state, error: string | null) => ({ ...state, error, loading: false }));

  // Effects
  readonly loadUsers = this.effect<void>((trigger$) =>
    trigger$.pipe(
      tap(() => this.setLoading(true)),
      exhaustMap(() =>
        this.usersService.userControllerGetSubUsers().pipe(
          tapResponse(
            (users) => this.setUsers(users),
            (error: any) => {
              const errorMessage = error?.error?.message || 'Error al cargar los usuarios.';
              this.setError(errorMessage);
              this.notificationService.show(NotificationSeverity.Error, errorMessage);
            }
          )
        )
      )
    )
  );

  readonly loadRoles = this.effect<void>((trigger$) =>
    trigger$.pipe(
      tap(() => this.setLoading(true)),
      exhaustMap(() =>
        this.rolesService.rolesControllerFindAll().pipe(
          tapResponse(
            (roles: any) => this.setRoles(roles),
            (error: any) => {
              const errorMessage = error?.error?.message || 'Error al cargar los roles.';
              this.setError(errorMessage);
              this.notificationService.show(NotificationSeverity.Error, errorMessage);
            }
          )
        )
      )
    )
  );

  readonly updateUser = this.effect<{ userId: number; updateData: ExtendedAdminUpdateUserDto }>((update$) =>
    update$.pipe(
      tap(() => this.setLoading(true)),
      exhaustMap(({ userId, updateData }) =>
        this.usersService.userControllerUpdateSubUser({ id: userId, body: updateData as any }).pipe(
          tapResponse(
            (updatedUser) => {
              this.updateUserInList(updatedUser);
              this.notificationService.show(NotificationSeverity.Success, 'Usuario actualizado correctamente');
            },
            (error: any) => {
              const errorMessage = error?.error?.message || 'Error al actualizar el usuario.';
              this.setError(errorMessage);
              this.notificationService.show(NotificationSeverity.Error, errorMessage);
            }
          )
        )
      )
    )
  );

  readonly createUser = this.effect<ExtendedCreateSubUserDto>((create$) =>
    create$.pipe(
      tap(() => this.setLoading(true)),
      exhaustMap((createData) =>
        this.usersService.userControllerCreateSubUser({ body: createData as any }).pipe(
          tapResponse(
            (newUser) => {
              this.addUserToList(newUser);
              this.notificationService.show(NotificationSeverity.Success, 'Usuario creado correctamente');
            },
            (error: any) => {
              const errorMessage = error?.error?.message || 'Error al crear el usuario.';
              this.setError(errorMessage);
              this.notificationService.show(NotificationSeverity.Error, errorMessage);
            }
          )
        )
      )
    )
  );
}
