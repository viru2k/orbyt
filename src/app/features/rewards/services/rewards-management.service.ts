import { Injectable, inject, signal } from '@angular/core';
import { BehaviorSubject, Observable, of, map, catchError } from 'rxjs';
import { RewardsService } from '../../../api/services/rewards.service';
import { RewardProgramResponseDto } from '../../../api/models/reward-program-response-dto';
import {
  ClientReward,
  RewardMetrics,
  CreateRewardProgramDto,
  UpdateRewardProgramDto,
  RewardActivity,
  TopRewardProgram
} from '../models/reward.models';

@Injectable({
  providedIn: 'root'
})
export class RewardsManagementService {
  private rewardsService = inject(RewardsService);

  // State management
  private _rewardPrograms$ = new BehaviorSubject<RewardProgramResponseDto[]>([]);
  private _metrics$ = new BehaviorSubject<RewardMetrics | null>(null);
  private _loading$ = new BehaviorSubject<boolean>(false);

  // Public observables
  public rewardPrograms$ = this._rewardPrograms$.asObservable();
  public metrics$ = this._metrics$.asObservable();
  public loading$ = this._loading$.asObservable();

  // State signals
  loading = signal(false);
  error = signal<string | null>(null);

  constructor() {
    this.loadRewardPrograms();
    this.loadMetrics();
  }

  // Reward Programs Management
  loadRewardPrograms(): Observable<RewardProgramResponseDto[]> {
    this.loading.set(true);
    this._loading$.next(true);

    return this.rewardsService.rewardsControllerGetAllRewardPrograms().pipe(
      map((response: RewardProgramResponseDto[]) => {
        this._rewardPrograms$.next(response);
        this.loading.set(false);
        this._loading$.next(false);
        return response;
      }),
      catchError(error => {
        console.error('Error loading reward programs:', error);
        this.error.set('Error loading reward programs');
        this.loading.set(false);
        this._loading$.next(false);

        this._rewardPrograms$.next([]);
        return of([]);
      })
    );
  }

  createRewardProgram(program: CreateRewardProgramDto): Observable<RewardProgramResponseDto> {
    this.loading.set(true);

    return this.rewardsService.rewardsControllerCreateRewardProgram({ body: program as any }).pipe(
      map(created => {
        const currentPrograms = this._rewardPrograms$.value;
        this._rewardPrograms$.next([...currentPrograms, created]);
        this.loading.set(false);
        return created;
      }),
      catchError(error => {
        this.error.set('Error creating reward program');
        this.loading.set(false);
        throw error;
      })
    );
  }

  updateRewardProgram(id: number, updates: UpdateRewardProgramDto): Observable<void> {
    this.loading.set(true);

    return this.rewardsService.rewardsControllerUpdateRewardProgram({ id, body: updates as any }).pipe(
      map(() => {
        this.loadRewardPrograms().subscribe();
        this.loading.set(false);
      }),
      catchError(error => {
        this.error.set('Error updating reward program');
        this.loading.set(false);
        throw error;
      })
    );
  }

  deleteRewardProgram(id: number): Observable<RewardProgramResponseDto> {
    this.loading.set(true);

    return this.rewardsService.rewardsControllerDeleteRewardProgram({ id }).pipe(
      map((deletedProgram) => {
        // Update local state after successful soft delete
        // Replace the program with its updated version (now INACTIVE)
        const currentPrograms = this._rewardPrograms$.value;
        const updatedPrograms = currentPrograms.map(program =>
          program.id === id ? deletedProgram : program
        );
        this._rewardPrograms$.next(updatedPrograms);
        this.loading.set(false);
        return deletedProgram;
      }),
      catchError(error => {
        console.error('Error deleting reward program:', error);
        this.error.set('Error deleting reward program');
        this.loading.set(false);
        throw error;
      })
    );
  }

  // Client Rewards Management
  getClientRewards(clientId: number): Observable<ClientReward[]> {
    // Mock implementation - replace with actual API call
    return of([]);
  }

  redeemReward(clientId: number, rewardId: number): Observable<void> {
    // Mock implementation - replace with actual API call
    return of(void 0);
  }

  // Metrics and Analytics
  loadMetrics(): Observable<RewardMetrics> {
    this.loading.set(true);

    return this.rewardsService.rewardsControllerGetRewardsMetrics().pipe(
      map((response: any) => {
        // Try to parse the response - backend should now return actual data
        if (response && typeof response === 'object') {
          const metrics: RewardMetrics = {
            totalPrograms: response.totalPrograms || 0,
            activePrograms: response.activePrograms || 0,
            totalRewards: response.totalRewards || 0,
            redeemedRewards: response.redeemedRewards || 0,
            totalPoints: response.totalPoints || 0,
            averagePointsPerClient: response.averagePointsPerClient || 0,
            topPrograms: (response.topPrograms || []).map((program: any) => ({
              id: program.id || 0,
              name: program.name || '',
              totalRedemptions: program.totalRedemptions || 0,
              totalPoints: program.totalPoints || 0
            })),
            recentActivity: (response.recentActivity || []).map((activity: any) => ({
              id: activity.id || 0,
              type: activity.type as 'earned' | 'redeemed' || 'earned',
              clientName: activity.clientName || '',
              programName: activity.programName || '',
              points: activity.points || 0,
              date: activity.date || new Date().toISOString()
            }))
          };
          
          this._metrics$.next(metrics);
          this.loading.set(false);
          return metrics;
        } else {
          // If no data or void response, fall back to mock
          throw new Error('No metrics data returned from API');
        }
      }),
      catchError(error => {
        console.error('Error loading rewards metrics:', error);
        console.log('Falling back to mock metrics data');
        this.error.set('Using mock data (API not ready)');
        this.loading.set(false);
        
        // Fallback to mock data
        const mockMetrics: RewardMetrics = {
          totalPrograms: 5,
          activePrograms: 3,
          totalRewards: 250,
          redeemedRewards: 180,
          totalPoints: 15000,
          averagePointsPerClient: 75,
          topPrograms: [
            { id: 1, name: 'Loyalty Points', totalRedemptions: 120, totalPoints: 8500 },
            { id: 2, name: 'VIP Benefits', totalRedemptions: 45, totalPoints: 4200 },
            { id: 3, name: 'Seasonal Bonus', totalRedemptions: 15, totalPoints: 2300 }
          ],
          recentActivity: [
            {
              id: 1,
              type: 'earned',
              clientName: 'Juan Pérez',
              programName: 'Loyalty Points',
              points: 50,
              date: new Date().toISOString()
            },
            {
              id: 2,
              type: 'redeemed',
              clientName: 'María González',
              programName: 'VIP Benefits',
              points: 100,
              date: new Date(Date.now() - 3600000).toISOString()
            }
          ]
        };
        
        this._metrics$.next(mockMetrics);
        return of(mockMetrics);
      })
    );
  }

  // Triggers
  triggerRewardForAction(clientId: string, action: string): Observable<void> {
    // Placeholder method for reward triggering
    console.log(`Triggering reward for client ${clientId} with action ${action}`);
    return of(void 0);
  }

  // Utility methods
  refreshData(): void {
    this.loadRewardPrograms().subscribe();
    this.loadMetrics().subscribe();
  }

  clearError(): void {
    this.error.set(null);
  }
}