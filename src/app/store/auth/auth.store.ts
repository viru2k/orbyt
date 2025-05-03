import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ComponentStore } from '@ngrx/component-store';
import { tapResponse } from '@ngrx/operators';

import { AuthService, LoginDto, UserResponseDto } from '@orb-api/index';
import { LocalStorageService } from '@orb-services';
import { exhaustMap, of } from 'rxjs';

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
  private readonly router = inject(Router)
  constructor(
    private readonly authService: AuthService,
    private readonly storage: LocalStorageService
  ) {
    super(DEFAULT_AUTH_STATE);
  }

  // ---------------------------
  // Selectors
  // ---------------------------
  readonly user$ = this.select((state) => state.user);
  readonly token$ = this.select((state) => state.token);
  readonly loading$ = this.select((state) => state.loading);
  readonly error$ = this.select((state) => state.error);

  // ---------------------------
  // Updaters
  // ---------------------------
  readonly setUser = this.updater((state, user: UserResponseDto | null) => ({
    ...state,
    user,
  }));

  readonly setToken = this.updater((state, token: string | null) => ({
    ...state,
    token,
  }));

  readonly setLoading = this.updater((state, loading: boolean) => ({
    ...state,
    loading,
  }));

  readonly setError = this.updater((state, error: string | null) => ({
    ...state,
    error,
  }));

  // ---------------------------
  // Effect: login
  // ---------------------------


  readonly login = this.effect<LoginDto>((credentials$) =>
    credentials$.pipe(
      exhaustMap((credentials) =>
        this.authService.authControllerLogin(credentials).pipe(
          tapResponse(
            (response) => {
              const token = response.access_token;
              this.storage.setToken( token);
              this.setToken(token);
              this.loadUserProfile(); // no necesita token explícito
            this.router.navigate(['/home'])
            },
            (error: any) => {
              this.setError(error?.message || 'Login failed');
              this.setLoading(false);
            }
          )
        )
      )
    )
  );
  

  // ---------------------------
  // Effect: get user profile
  // ---------------------------
  readonly loadUserProfile = this.effect((_: string | null | undefined) =>
    this.authService.authControllerGetProfile().pipe(
      tapResponse(
        (user: UserResponseDto) => {
          this.setUser(user);
          this.setLoading(false);
        },
        (error) => {
          this.setError('Error al cargar perfil de usuario');
          this.setLoading(false);
        }
      )
    )
  );

  // ---------------------------
  // Effect: logout
  // ---------------------------
  readonly logout = this.effect((trigger$) =>
    trigger$.pipe(
      exhaustMap(() => {
        this.storage.clearToken();
        this.setUser(null);
        this.setToken(null);
        return of(null);
      })
    )
  );
}
