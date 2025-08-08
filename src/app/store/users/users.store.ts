import { inject, Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { tapResponse } from '@ngrx/operators';
import { UserResponseDto, AdminUpdateUserDto, RoleDto } from '../../api/model/models';
import { UsersService, RolesService } from '../../api/api/api';
import { NotificationService } from '@orb-services';
import { exhaustMap, tap, withLatestFrom } from 'rxjs';
import { linkToGlobalState } from '../component-state.reducer';
import { Store } from '@ngrx/store';
import { NotificationSeverity } from '@orb-models';

export interface UsersState {
  users: UserResponseDto[];
  roles: RoleDto[];
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
  readonly setRoles = this.updater((state, roles: RoleDto[]) => ({
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
  readonly setError = this.updater((state, error: string | null) => ({ ...state, error, loading: false }));

  // Effects
  readonly loadUsers = this.effect<void>((trigger$) =>
    trigger$.pipe(
      tap(() => this.setLoading(true)),
      exhaustMap(() =>
        this.usersService.userControllerGetGroupUsers().pipe(
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

  readonly updateUser = this.effect<{ userId: number; updateData: AdminUpdateUserDto }>((update$) =>
    update$.pipe(
      tap(() => this.setLoading(true)),
      exhaustMap(({ userId, updateData }) =>
        this.usersService.userControllerUpdateSubUser(userId, updateData).pipe(
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
}
