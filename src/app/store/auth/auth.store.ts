import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ComponentStore } from '@ngrx/component-store';
import { tapResponse } from '@ngrx/operators';
import { AdminUpdateUserDto, AuthService, LoginDto, UserResponseDto, UsersService } from '@orb-api/index';
import { LocalStorageService } from '@orb-services';
import { exhaustMap, Observable, tap } from 'rxjs';
import { linkToGlobalState } from '../component-state.reducer';
import { Store } from '@ngrx/store';



export interface AuthState {
  user: UserResponseDto | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

const DEFAULT_AUTH_STATE: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
};

@Injectable({ providedIn: 'root' })
export class AuthStore extends ComponentStore<AuthState> {
  private readonly router = inject(Router);


  constructor(
    private readonly authService: AuthService,
     private readonly userService: UsersService,
    private readonly storage: LocalStorageService, 
    private readonly globalStore: Store
  ) {
    super(DEFAULT_AUTH_STATE);
    linkToGlobalState(this.state$, 'AuthStore', this.globalStore);
    this.checkAuth();
  }

  // 3. Selectores para exponer el estado.
  readonly user$ = this.select((state) => state.user);
  readonly token$ = this.select((state) => state.token);
  readonly loading$ = this.select((state) => state.loading);
  readonly error$ = this.select((state) => state.error);
  readonly isAuthenticated$ = this.select(this.token$, (token) => !!token);

  // Selectores computados para la UI (muy útiles)
  readonly userFullName$ = this.select(this.user$, (user) =>
    user ? `${user.fullName}` : ''
  );
  readonly userInitials$ = this.select(this.user$, (user) => {
    if (user?.fullName) {
      return `${user.fullName}`.toUpperCase();
    }
    return '';
  });

  readonly setLoading = this.updater((state, loading: boolean) => ({ ...state, loading }));
  readonly setAuthSuccess = this.updater((state, { user, token }: { user: UserResponseDto, token: string }) => ({
    ...state,
    user,
    token,
    loading: false,
    error: null,
  }));
  readonly setError = this.updater((state, error: string | null) => ({ ...state, error, loading: false }));
   readonly setUser  = this.updater((state, user: UserResponseDto) => ({ ...state, user }));
  readonly clearState = this.updater(() => DEFAULT_AUTH_STATE);



  readonly login = this.effect<LoginDto>((credentials$) =>
    credentials$.pipe(
      tap(() => this.setLoading(true)),
      exhaustMap((credentials) =>
        this.authService.authControllerLogin(credentials).pipe(
          tapResponse(
            (response) => {
              const token = response.accessToken;
              this.storage.setToken( token);
              this.loadUserProfile(token);
            },
            (error: any) => this.setError(error?.message || 'El login ha fallado')
          )
        )
      )
    )
  );

  readonly loadUserProfile = this.effect((token$: Observable<string>) =>
    token$.pipe(
      exhaustMap((token) =>
        this.authService.authControllerGetProfile().pipe(
          tapResponse(
            (user) => {
              this.setUser(user);              
              this.router.navigate(['/']); 
            },
            (error: any) => {
              this.setError(error?.message || 'No se pudo cargar el perfil');
              this.logout(); 
            }
          )
        )
      )
    )
  );

    readonly patchUserProfile = this.effect((user$: Observable<{id: number , request: AdminUpdateUserDto}>) =>
    user$.pipe(
      exhaustMap((user) =>
        this.userService.userControllerUpdateSubUser(user.id, user.request).pipe(
          tapResponse(
            (user) => {
           //   this.setAuthSuccess({ user, token });
           this.setUser(user);
              this.router.navigate(['/']); 
            },
            (error: any) => {
              this.setError(error?.message || 'No se pudo cargar el perfil');
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


  public checkAuth(): void {
    const token = this.storage.getToken();
    if (token) {
      this.setLoading(true);
      this.loadUserProfile(token);
    }
  }
}