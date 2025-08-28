import { inject } from '@angular/core';
import { computed } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, catchError, of } from 'rxjs';
import { ConsultationsService } from '../../api/services/consultations.service';
import { PublicConsultationService } from '../../api/services/public-consultation.service';
import { CreateConsultationTokenDto } from '../../api/models/create-consultation-token-dto';
import { ConsultationTokenResponseDto } from '../../api/models/consultation-token-response-dto';
import { DateFormatService } from 'src/app/services/core/utils/date-format.service';

export interface ConsultationTokenState {
  tokens: ConsultationTokenResponseDto[];
  selectedToken: ConsultationTokenResponseDto | null;
  publicConsultationData: any | null;
  loading: boolean;
  error: any | null;
  validationResult: any | null;
}

const initialState: ConsultationTokenState = {
  tokens: [],
  selectedToken: null,
  publicConsultationData: null,
  loading: false,
  error: null,
  validationResult: null,
};

export const ConsultationTokenStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, 
    consultationsService = inject(ConsultationsService),
    publicConsultationService = inject(PublicConsultationService)
  ) => ({
    // Load tokens for a specific consultation
    loadTokensForConsultation: rxMethod<number>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((consultationId) =>
          consultationsService.consultationControllerGetTokensForConsultation({ id: consultationId }).pipe(
            tap((tokens: any) => {
              patchState(store, { tokens: tokens || [], loading: false });
            }),
            catchError((error) => {
              patchState(store, { error, loading: false });
              return of([]);
            })
          )
        )
      )
    ),

    // Create token by scenario
    createTokenByScenario: rxMethod<{ consultationId: number; scenario: string }>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(({ consultationId, scenario }) =>
          consultationsService.consultationControllerCreateTokenByScenario({ 
            id: consultationId, 
            scenario 
          }).pipe(
            tap((newToken: any) => {
              patchState(store, (state) => ({
                tokens: newToken ? [...state.tokens, newToken] : state.tokens,
                loading: false,
              }));
            }),
            catchError((error) => {
              patchState(store, { error, loading: false });
              return of(null);
            })
          )
        )
      )
    ),

    // Create auto tokens
    createAutoTokens: rxMethod<number>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((consultationId) =>
          consultationsService.consultationControllerCreateAutoTokens({ id: consultationId }).pipe(
            tap((tokens: any) => {
              patchState(store, (state) => ({
                tokens: tokens ? [...state.tokens, ...tokens] : state.tokens,
                loading: false,
              }));
            }),
            catchError((error) => {
              patchState(store, { error, loading: false });
              return of([]);
            })
          )
        )
      )
    ),

    // Revoke token
    revokeToken: rxMethod<number>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((tokenId) =>
          consultationsService.consultationControllerRevokeToken({ tokenId }).pipe(
            tap(() => {
              patchState(store, (state) => ({
                tokens: state.tokens.filter((token: any) => token.id !== tokenId),
                loading: false,
              }));
            }),
            catchError((error) => {
              patchState(store, { error, loading: false });
              return of(null);
            })
          )
        )
      )
    ),

    // Public methods (no authentication required)
    validateToken: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((token) =>
          publicConsultationService.publicConsultationControllerValidateToken({ token }).pipe(
            tap((validationResult: any) => {
              patchState(store, { validationResult: validationResult || null, loading: false });
            }),
            catchError((error) => {
              patchState(store, { 
                error, 
                loading: false,
                validationResult: { valid: false, error: error.message }
              });
              return of({ valid: false, error: error.message });
            })
          )
        )
      )
    ),

    accessConsultationByToken: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((token) =>
          publicConsultationService.publicConsultationControllerAccessConsultationByToken({ token }).pipe(
            tap((consultationData: any) => {
              patchState(store, { publicConsultationData: consultationData || null, loading: false });
            }),
            catchError((error) => {
              patchState(store, { error, loading: false });
              return of(null);
            })
          )
        )
      )
    ),

    useTokenAndAccessConsultation: rxMethod<{ token: string; action?: string; data?: any }>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(({ token, action, data }) =>
          publicConsultationService.publicConsultationControllerUseTokenAndAccessConsultation({ 
            token
          }).pipe(
            tap((result: any) => {
              patchState(store, { loading: false });
            }),
            catchError((error) => {
              patchState(store, { error, loading: false });
              return of(null);
            })
          )
        )
      )
    ),

    // Utility methods
    setSelectedToken(token: ConsultationTokenResponseDto | null) {
      patchState(store, { selectedToken: token });
    },

    clearError() {
      patchState(store, { error: null });
    },

    clearValidationResult() {
      patchState(store, { validationResult: null });
    },

    clearPublicConsultationData() {
      patchState(store, { publicConsultationData: null });
    },
  })),
  withComputed(({ tokens }, dateFormatService = inject(DateFormatService)) => ({
    selectTokensWithFormatting: computed(() => {
      const tokenList = tokens();
      return tokenList.map((token: any) => {
        const displayCreatedAt = {
          value: token.createdAt,
          displayValue: dateFormatService.format(token.createdAt, 'dd/MM/yyyy HH:mm')
        };
        
        const displayExpiresAt = {
          value: token.expiresAt,
          displayValue: dateFormatService.format(token.expiresAt, 'dd/MM/yyyy HH:mm')
        };

        const displayUsedAt = token.usedAt ? {
          value: token.usedAt,
          displayValue: dateFormatService.format(token.usedAt, 'dd/MM/yyyy HH:mm')
        } : null;

        // Status calculation
        const now = new Date();
        const expiresAt = new Date(token.expiresAt);
        let status = 'active';
        let statusText = 'Activo';
        let statusClass = 'status-active';

        if (token.isUsed) {
          status = 'used';
          statusText = 'Usado';
          statusClass = 'status-used';
        } else if (expiresAt < now) {
          status = 'expired';
          statusText = 'Expirado';
          statusClass = 'status-expired';
        }

        // Scenario formatting
        const scenarioMap: Record<string, string> = {
          'pre-consultation': 'Pre-consulta',
          'post-consultation': 'Post-consulta',
          'follow-up': 'Seguimiento',
          'emergency': 'Emergencia'
        };

        const scenarioText = scenarioMap[token.scenario] || token.scenario;

        return {
          ...token,
          displayCreatedAt,
          displayExpiresAt,
          displayUsedAt,
          status,
          statusText,
          statusClass,
          scenarioText
        };
      });
    }),

    selectActiveTokens: computed(() => {
      const tokenList = tokens();
      return tokenList.filter((token: any) => {
        const now = new Date();
        const expiresAt = new Date(token.expiresAt);
        return !token.isUsed && expiresAt >= now;
      });
    }),

    selectExpiredTokens: computed(() => {
      const tokenList = tokens();
      return tokenList.filter((token: any) => {
        const now = new Date();
        const expiresAt = new Date(token.expiresAt);
        return !token.isUsed && expiresAt < now;
      });
    }),

    selectUsedTokens: computed(() => {
      const tokenList = tokens();
      return tokenList.filter((token: any) => token.isUsed);
    }),

    selectTotalTokens: computed(() => tokens().length),
  }))
);