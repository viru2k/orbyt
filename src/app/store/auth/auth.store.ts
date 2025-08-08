import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ComponentStore } from '@ngrx/component-store';
import { tapResponse } from '@ngrx/operators';
import { LoginDto, UserResponseDto, AdminUpdateUserDto, ProfileResponseDto } from '../../api/model/models';
import { AuthService, UsersService } from '../../api/api/api';
import { LocalStorageService, NotificationService } from '@orb-services';
import { exhaustMap, Observable, of, tap, withLatestFrom } from 'rxjs';
import { linkToGlobalState } from '../component-state.reducer';
import { Store } from '@ngrx/store';
import { NotificationSeverity } from '@orb-models';

export interface AuthState {
  user: ProfileResponseDto | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
};

@Injectable({ providedIn: 'root' })
export class AuthStore extends ComponentStore<AuthState> {
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);

  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly storage: LocalStorageService,
    private readonly globalStore: Store
  ) {
    super(initialState);
    linkToGlobalState(this.state$, 'AuthStore', this.globalStore);
    this.checkAuth();
  }

  // Selectores
  readonly user$ = this.select((state) => state.user);
  readonly token$ = this.select((state) => state.token);
  readonly loading$ = this.select((state) => state.loading);
  readonly error$ = this.select((state) => state.error);
  readonly isAuthenticated$ = this.select(this.token$, (token) => !!token);

  readonly userFullName$ = this.select(this.user$, (user) =>
    user ? `${user.name} ${user.lastName}` : ''
  );
  readonly userInitials$ = this.select(this.user$, (user) => {
    if (user?.name && user.lastName) {
      return `${user.name[0]}${user.lastName[0]}`.toUpperCase();
    }
    return '';
  });

  // Permission selectors
  readonly canManageUsers$ = this.select(this.user$, (user) => user?.canManageUsers ?? false);
  readonly canManageClients$ = this.select(this.user$, (user) => user?.canManageClients ?? false);
  readonly canManageProducts$ = this.select(this.user$, (user) => user?.canManageProducts ?? false);
  readonly canManageAgenda$ = this.select(this.user$, (user) => user?.canManageAgenda ?? false);

  // Updaters
  readonly setLoading = this.updater((state, loading: boolean) => ({ ...state, loading }));
  readonly setAuthSuccess = this.updater((state, { user, token }: { user: ProfileResponseDto, token: string }) => ({
    ...state, user, token, loading: false, error: null,
  }));
  readonly patchUser = this.updater((state, updatedUser: ProfileResponseDto) => ({
    ...state, user: { ...state.user, ...updatedUser }, loading: false,
  }));
  readonly setError = this.updater((state, error: string | null) => ({ ...state, error, loading: false }));
  readonly clearState = this.updater(() => initialState);

  // Effects
  readonly login = this.effect<LoginDto>((credentials$) =>
    credentials$.pipe(
      tap(() => this.setLoading(true)),
      exhaustMap((credentials) =>
        this.authService.authControllerLogin(credentials).pipe(
          tapResponse(
            (response: any) => {
              console.log(response);
              // Extract the access_token from the response object
              const access_token = response?.access_token;
              if (access_token) {
                this.storage.setToken(access_token);
                this.loadUserProfile(access_token);
                this.notificationService.show(NotificationSeverity.Success, 'Inicio de sesión exitoso');
              } else {
                this.setError('No se pudo obtener el token de acceso.');
              }
            },
            (error: any) => {
              const errorMessage = error?.error?.message || 'El email o la contraseña son incorrectos.';
              this.setError(errorMessage);
              this.notificationService.show(NotificationSeverity.Error, errorMessage);
            }
          )
        )
      )
    )
  );

  readonly loadUserProfile = this.effect<string>((token$) =>
    token$.pipe(
      exhaustMap((token) =>
        this.authService.authControllerGetProfile().pipe(
          tapResponse(
            (user) => {
              this.setAuthSuccess({ user, token });
              this.router.navigate(['/']);
            },
            (error: any) => {
              const errorMessage = error?.error?.message || 'No se pudo cargar el perfil';
              this.setError(errorMessage);
              this.notificationService.show(NotificationSeverity.Error, errorMessage);
              this.logout();
            }
          )
        )
      )
    )
  );


  readonly logout = this.effect<void>((trigger$) =>
    trigger$.pipe(
      tap(() => {
        this.storage.clearToken();
        this.clearState();
        this.router.navigate(['/login']);
      })
    )
  );

  // Métodos públicos
  public checkAuth(): void {
    const token = this.storage.getToken();
    if (token) {
      this.setLoading(true);
      this.loadUserProfile(token);
    }
  }
  
  public isAuthenticated = () => !!this.get().token;

// TODO: MOVE TO USER STORE
/* 
  
  readonly patchUserProfile = this.effect<AdminUpdateUserDto>((updateDto$) =>
    updateDto$.pipe(
      tap(() => this.setLoading(true)),
      withLatestFrom(this.user$),
      exhaustMap(([updateDto, user]) => {
        if (!user?.id) {
          this.setError('ID de usuario no encontrado.');
          return of(null);
        }
        return this.usersService.userControllerUpdateSubUser(user.id, updateDto).pipe(
          tapResponse(
            (updatedUser) => {
              this.patchUser(updatedUser);
              //this.notificationService.show(NotificationSeverity.Success, 'Perfil actualizado con éxito');
            },
            (error: any) => {
              this.setError(error?.message || 'Error al actualizar el perfil');
              //this.notificationService.show(NotificationSeverity.Error, 'No se pudo actualizar el perfil.');
            }
          )
        );
      })
    )
  ); */
}