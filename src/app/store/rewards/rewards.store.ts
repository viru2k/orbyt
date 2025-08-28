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
import { RewardsService } from '../../api/services/rewards.service';
import { CreateRewardProgramDto } from '../../api/models/create-reward-program-dto';
import { UpdateRewardProgramDto } from '../../api/models/update-reward-program-dto';
import { DateFormatService } from 'src/app/services/core/utils/date-format.service';

export interface RewardsState {
  rewardPrograms: any[];
  activePrograms: any[];
  selectedProgram: any | null;
  clientRewards: any[];
  clientActiveRewards: any[];
  clientEarnedRewards: any[];
  clientRewardHistory: any[];
  selectedClientId: number | null;
  metrics: any | null;
  loading: boolean;
  error: any | null;
}

const initialState: RewardsState = {
  rewardPrograms: [],
  activePrograms: [],
  selectedProgram: null,
  clientRewards: [],
  clientActiveRewards: [],
  clientEarnedRewards: [],
  clientRewardHistory: [],
  selectedClientId: null,
  metrics: null,
  loading: false,
  error: null,
};

export const RewardsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, rewardsService = inject(RewardsService)) => ({
    // Reward Programs Management
    loadAllRewardPrograms: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(() =>
          rewardsService.rewardsControllerGetAllRewardPrograms().pipe(
            tap((programs: any) => {
              patchState(store, { rewardPrograms: programs || [], loading: false });
            }),
            catchError((error) => {
              patchState(store, { error, loading: false });
              return of([]);
            })
          )
        )
      )
    ),

    loadActiveRewardPrograms: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(() =>
          rewardsService.rewardsControllerGetActiveRewardPrograms().pipe(
            tap((programs: any) => {
              patchState(store, { activePrograms: programs || [], loading: false });
            }),
            catchError((error) => {
              patchState(store, { error, loading: false });
              return of([]);
            })
          )
        )
      )
    ),

    loadRewardProgramById: rxMethod<number>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((id) =>
          rewardsService.rewardsControllerGetRewardProgramById({ id }).pipe(
            tap((program: any) => {
              patchState(store, { selectedProgram: program, loading: false });
            }),
            catchError((error) => {
              patchState(store, { error, loading: false });
              return of(null);
            })
          )
        )
      )
    ),

    createRewardProgram: rxMethod<CreateRewardProgramDto>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((programDto) =>
          rewardsService.rewardsControllerCreateRewardProgram({ body: programDto }).pipe(
            tap((newProgram: any) => {
              patchState(store, (state) => ({
                rewardPrograms: [...state.rewardPrograms, newProgram || {}],
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

    updateRewardProgram: rxMethod<{ id: number; programDto: UpdateRewardProgramDto }>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(({ id, programDto }) =>
          rewardsService.rewardsControllerUpdateRewardProgram({ id, body: programDto }).pipe(
            tap((updatedProgram: any) => {
              patchState(store, (state) => ({
                rewardPrograms: state.rewardPrograms.map((p: any) =>
                  p.id === id ? updatedProgram || p : p
                ),
                selectedProgram: state.selectedProgram?.id === id ? updatedProgram || state.selectedProgram : state.selectedProgram,
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

    deleteRewardProgram: rxMethod<number>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((id) =>
          rewardsService.rewardsControllerDeleteRewardProgram({ id }).pipe(
            tap(() => {
              patchState(store, (state) => ({
                rewardPrograms: state.rewardPrograms.filter((p: any) => p.id !== id),
                selectedProgram: state.selectedProgram?.id === id ? null : state.selectedProgram,
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

    loadRewardProgramsByBusinessType: rxMethod<number>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((businessTypeId) =>
          rewardsService.rewardsControllerGetRewardProgramsByBusinessType({ businessTypeId }).pipe(
            tap((programs: any) => {
              patchState(store, { rewardPrograms: programs || [], loading: false });
            }),
            catchError((error) => {
              patchState(store, { error, loading: false });
              return of([]);
            })
          )
        )
      )
    ),

    // Client Rewards Management
    loadClientRewards: rxMethod<number>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((clientId) =>
          rewardsService.rewardsControllerGetClientRewards({ clientId }).pipe(
            tap((rewards: any) => {
              patchState(store, { 
                clientRewards: rewards || [], 
                selectedClientId: clientId,
                loading: false 
              });
            }),
            catchError((error) => {
              patchState(store, { error, loading: false });
              return of([]);
            })
          )
        )
      )
    ),

    loadClientActiveRewards: rxMethod<number>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((clientId) =>
          rewardsService.rewardsControllerGetClientActiveRewards({ clientId }).pipe(
            tap((rewards: any) => {
              patchState(store, { 
                clientActiveRewards: rewards || [], 
                selectedClientId: clientId,
                loading: false 
              });
            }),
            catchError((error) => {
              patchState(store, { error, loading: false });
              return of([]);
            })
          )
        )
      )
    ),

    loadClientEarnedRewards: rxMethod<number>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((clientId) =>
          rewardsService.rewardsControllerGetClientEarnedRewards({ clientId }).pipe(
            tap((rewards: any) => {
              patchState(store, { 
                clientEarnedRewards: rewards || [], 
                selectedClientId: clientId,
                loading: false 
              });
            }),
            catchError((error) => {
              patchState(store, { error, loading: false });
              return of([]);
            })
          )
        )
      )
    ),

    loadClientRewardHistory: rxMethod<number>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((clientId) =>
          rewardsService.rewardsControllerGetClientRewardHistory({ clientId }).pipe(
            tap((history: any) => {
              patchState(store, { 
                clientRewardHistory: history || [], 
                selectedClientId: clientId,
                loading: false 
              });
            }),
            catchError((error) => {
              patchState(store, { error, loading: false });
              return of([]);
            })
          )
        )
      )
    ),

    redeemReward: rxMethod<{ clientId: number; rewardId: number }>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(({ clientId, rewardId }) =>
          rewardsService.rewardsControllerRedeemReward({ clientId, rewardId }).pipe(
            tap(() => {
              // Refresh client rewards after redemption
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

    // Metrics
    loadRewardsMetrics: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(() =>
          rewardsService.rewardsControllerGetRewardsMetrics().pipe(
            tap((metrics: any) => {
              patchState(store, { metrics: metrics || {}, loading: false });
            }),
            catchError((error) => {
              patchState(store, { error, loading: false });
              return of({});
            })
          )
        )
      )
    ),

    // Trigger methods
    triggerAppointmentCompleted: rxMethod<number>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((clientId) =>
          rewardsService.rewardsControllerTriggerAppointmentCompleted({ clientId }).pipe(
            tap(() => {
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

    triggerConsultationCompleted: rxMethod<number>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap((clientId) =>
          rewardsService.rewardsControllerTriggerConsultationCompleted({ clientId }).pipe(
            tap(() => {
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
    setSelectedProgram(program: any | null) {
      patchState(store, { selectedProgram: program });
    },

    setSelectedClientId(clientId: number | null) {
      patchState(store, { selectedClientId: clientId });
    },

    clearError() {
      patchState(store, { error: null });
    },

    clearClientData() {
      patchState(store, {
        clientRewards: [],
        clientActiveRewards: [],
        clientEarnedRewards: [],
        clientRewardHistory: [],
        selectedClientId: null
      });
    },
  })),
  withComputed(({ rewardPrograms, clientRewards, metrics }, dateFormatService = inject(DateFormatService)) => ({
    selectProgramsWithFormatting: computed(() => {
      const programs = rewardPrograms();
      return programs.map((program: any) => {
        const displayCreatedAt = {
          value: program.createdAt,
          displayValue: dateFormatService.format(program.createdAt, 'dd/MM/yyyy HH:mm')
        };
        
        const displayUpdatedAt = {
          value: program.updatedAt,
          displayValue: dateFormatService.format(program.updatedAt, 'dd/MM/yyyy HH:mm')
        };

        // Status formatting
        let statusText = 'Inactivo';
        let statusClass = 'status-inactive';
        
        if (program.isActive) {
          statusText = 'Activo';
          statusClass = 'status-active';
        }

        return {
          ...program,
          displayCreatedAt,
          displayUpdatedAt,
          statusText,
          statusClass
        };
      });
    }),

    selectActivePrograms: computed(() => {
      const programs = rewardPrograms();
      return programs.filter((program: any) => program.isActive);
    }),

    selectClientRewardsWithFormatting: computed(() => {
      const rewards = clientRewards();
      return rewards.map((reward: any) => {
        const displayEarnedAt = {
          value: reward.earnedAt,
          displayValue: dateFormatService.format(reward.earnedAt, 'dd/MM/yyyy HH:mm')
        };

        const displayExpiresAt = reward.expiresAt ? {
          value: reward.expiresAt,
          displayValue: dateFormatService.format(reward.expiresAt, 'dd/MM/yyyy HH:mm')
        } : null;

        const displayRedeemedAt = reward.redeemedAt ? {
          value: reward.redeemedAt,
          displayValue: dateFormatService.format(reward.redeemedAt, 'dd/MM/yyyy HH:mm')
        } : null;

        // Status calculation
        let status = 'available';
        let statusText = 'Disponible';
        let statusClass = 'status-available';

        if (reward.isRedeemed) {
          status = 'redeemed';
          statusText = 'Canjeado';
          statusClass = 'status-redeemed';
        } else if (reward.expiresAt && new Date(reward.expiresAt) < new Date()) {
          status = 'expired';
          statusText = 'Expirado';
          statusClass = 'status-expired';
        }

        return {
          ...reward,
          displayEarnedAt,
          displayExpiresAt,
          displayRedeemedAt,
          status,
          statusText,
          statusClass
        };
      });
    }),

    selectTotalPrograms: computed(() => rewardPrograms().length),
    selectTotalActivePrograms: computed(() => {
      const programs = rewardPrograms();
      return programs.filter((program: any) => program.isActive).length;
    }),
    selectTotalClientRewards: computed(() => clientRewards().length),
  }))
);