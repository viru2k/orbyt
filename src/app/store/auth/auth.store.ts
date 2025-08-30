import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ComponentStore } from '@ngrx/component-store';
import { tapResponse } from '@ngrx/operators';
import { LoginDto, UserResponseDto, AdminUpdateUserDto, ProfileResponseDto } from '../../api/model/models';
import { AuthService } from '../../api/services/auth.service';
import { UsersService } from '../../api/services/users.service';
import { LocalStorageService, NotificationService } from '@orb-services';
import { TokenService } from '../../services/token.service';
import { exhaustMap, Observable, of, tap, withLatestFrom, switchMap, timer, takeUntil, Subject } from 'rxjs';
import { linkToGlobalState } from '../component-state.reducer';
import { Store } from '@ngrx/store';
import { NotificationSeverity } from '@orb-models';

export interface AuthState {
  user: ProfileResponseDto | null;
  token: string | null;
  tokenExpiration: number | null;
  loading: boolean;
  error: string | null;
  returnUrl: string | null;
  lastActivity: number;
}

const initialState: AuthState = {
  user: null,
  token: null,
  tokenExpiration: null,
  loading: false,
  error: null,
  returnUrl: null,
  lastActivity: Date.now(),
};

@Injectable({ providedIn: 'root' })
export class AuthStore extends ComponentStore<AuthState> {
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);
  private sessionTimer$: Subject<void> = new Subject();
  private inactivityTimer$: Subject<void> = new Subject();
  
  // Configuración de timeouts (en milisegundos)
  private readonly INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutos
  private readonly SESSION_WARNING_PERCENT = 0.95; // 95% del tiempo de vida del token

  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly storage: LocalStorageService,
    private readonly globalStore: Store,
    private readonly tokenService: TokenService
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
  readonly canManageUsers$ = this.select(this.user$, (user) => {
    console.log('🔑 AuthStore - canManageUsers$ selector - user:', user, 'canManageUsers:', user?.canManageUsers);
    return user?.canManageUsers ?? false;
  });
  readonly canManageClients$ = this.select(this.user$, (user) => user?.canManageClients ?? false);
  readonly canManageProducts$ = this.select(this.user$, (user) => user?.canManageProducts ?? false);
  readonly canManageServices$ = this.select(this.user$, (user) => true); // Temporal: siempre true hasta que backend esté listo
  readonly canManageAgenda$ = this.select(this.user$, (user) => user?.canManageAgenda ?? false);

  // Updaters
  readonly setLoading = this.updater((state, loading: boolean) => ({ ...state, loading }));
  readonly setAuthSuccess = this.updater((state, { user, token, tokenExpiration }: { user: ProfileResponseDto, token: string, tokenExpiration: number }) => ({
    ...state, user, token, tokenExpiration, loading: false, error: null, lastActivity: Date.now()
  }));
  readonly patchUser = this.updater((state, updatedUser: ProfileResponseDto) => ({
    ...state, user: { ...state.user, ...updatedUser }, loading: false,
  }));
  readonly setError = this.updater((state, error: string | null) => ({ ...state, error, loading: false }));
  readonly setReturnUrl = this.updater((state, returnUrl: string) => ({ ...state, returnUrl }));
  readonly updateActivity = this.updater((state) => ({ ...state, lastActivity: Date.now() }));
  readonly clearState = this.updater(() => initialState);

  // Effects
  readonly login = this.effect<LoginDto>((credentials$) =>
    credentials$.pipe(
      tap(() => this.setLoading(true)),
      exhaustMap((credentials) =>
        this.authService.authControllerLogin$Response({ body: credentials }).pipe(
          tapResponse(
            (response: any) => {
              console.log('Full HTTP response:', response);
              console.log('Response body:', response.body);
              console.log('Response body type:', typeof response.body);
              
              // Extraer token usando TokenService
              const token = this.tokenService.extractTokenFromResponse(response);
              
              if (!token) {
                console.error('No se pudo extraer el token del response:', response.body);
                this.setError('No se pudo obtener el token de acceso.');
                return;
              }
              
              console.log('Token extraído:', token);
              
              // Decodificar JWT para obtener expiración
              const tokenExpiration = this.tokenService.getTokenExpiration(token);
                
              // Guardar token
              this.storage.setToken(token);
              console.log('Token guardado:', this.storage.getToken());
              
              this.notificationService.show(NotificationSeverity.Success, 'Inicio de sesión exitoso');
              this.setLoading(false);
              
              // Navegar al dashboard - el AuthGuard cargará el perfil
              const returnUrl = this.get().returnUrl || '/dashboard';
              this.router.navigate([returnUrl]);
              this.setReturnUrl('');
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
      exhaustMap((token) => {
        console.log('loadUserProfile - Iniciando carga del perfil con token:', !!token);
        return this.authService.authControllerGetProfile().pipe(
          tapResponse(
            (user) => {
              console.log('loadUserProfile - Perfil cargado exitosamente:', user);
              const tokenExpiration = this.tokenService.getTokenExpiration(token);
              this.setAuthSuccess({ user, token, tokenExpiration });
              this.startSessionTimers();
            },
            (error: any) => {
              console.log('loadUserProfile - Error cargando perfil:', error);
              const errorMessage = error?.error?.message || 'No se pudo cargar el perfil';
              this.setError(errorMessage);
              this.notificationService.show(NotificationSeverity.Error, errorMessage);
              this.performLogout();
            }
          )
        );
      })
    )
  );


  readonly logout = this.effect<void>((trigger$) =>
    trigger$.pipe(
      tap(() => {
        this.stopSessionTimers();
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
  
  public performLogout(): void {
    this.logout();
  }

  // Métodos para gestión de sesión y token

  private startSessionTimers(): void {
    this.stopSessionTimers(); // Detener timers previos
    
    const state = this.get();
    if (!state.tokenExpiration) return;

    const now = Date.now();
    const tokenLifetime = state.tokenExpiration - now;
    const warningTime = tokenLifetime * this.SESSION_WARNING_PERCENT;

    // Timer para advertencia de expiración (95% del tiempo)
    timer(warningTime).pipe(
      takeUntil(this.sessionTimer$)
    ).subscribe(() => {
      const currentState = this.get();
      const timeSinceLastActivity = now - currentState.lastActivity;
      
      if (timeSinceLastActivity > this.INACTIVITY_TIMEOUT) {
        this.notificationService.show(
          NotificationSeverity.Warn, 
          'Tu sesión expirará pronto debido a inactividad'
        );
        // Logout automático por inactividad
        setTimeout(() => this.performLogout(), 5000);
      }
    });

    // Timer para logout automático al expirar token
    timer(tokenLifetime).pipe(
      takeUntil(this.sessionTimer$)
    ).subscribe(() => {
      this.notificationService.show(
        NotificationSeverity.Error, 
        'Tu sesión ha expirado'
      );
      this.performLogout();
    });
  }

  private stopSessionTimers(): void {
    this.sessionTimer$.next();
    this.inactivityTimer$.next();
  }

  public recordActivity(): void {
    this.updateActivity();
  }

  // Sistema básico de renovación de token (si la API lo soporta)
  readonly refreshToken = this.effect<void>((trigger$) =>
    trigger$.pipe(
      exhaustMap(() => {
        const currentToken = this.storage.getToken();
        if (!currentToken) return of(null);

        // Si tu API tiene un endpoint de refresh token, úsalo aquí
        // return this.authService.authControllerRefreshToken().pipe(...)
        
        // Por ahora, hacer re-login silencioso no es viable sin refresh token endpoint
        // Simplemente renovamos la actividad
        this.updateActivity();
        return of(null);
      })
    )
  );

  // Método para verificar si el token está cerca de expirar
  public isTokenNearExpiration(): boolean {
    const state = this.get();
    if (!state.tokenExpiration) return false;
    
    const now = Date.now();
    const timeLeft = state.tokenExpiration - now;
    const tokenLifetime = state.tokenExpiration - (state.lastActivity || now);
    
    return timeLeft < (tokenLifetime * 0.1); // 10% del tiempo restante
  }

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