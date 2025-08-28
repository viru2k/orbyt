import { Injectable } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { RewardsService as ApiRewardsService } from '../../../api/services/rewards.service';
import { CreateRewardProgramDto } from '../../../api/models/create-reward-program-dto';
import { UpdateRewardProgramDto } from '../../../api/models/update-reward-program-dto';

@Injectable({
  providedIn: 'root'
})
export class RewardsService {

  constructor(private apiRewardsService: ApiRewardsService) {}

  // Reward Programs Management
  getAllRewardPrograms(): Observable<any> {
    return this.apiRewardsService.rewardsControllerGetAllRewardPrograms().pipe(
      catchError(error => {
        console.error('Error fetching reward programs:', error);
        return of([]);
      })
    );
  }

  getActiveRewardPrograms(): Observable<any> {
    return this.apiRewardsService.rewardsControllerGetActiveRewardPrograms().pipe(
      catchError(error => {
        console.error('Error fetching active reward programs:', error);
        return of([]);
      })
    );
  }

  getRewardProgramById(id: number): Observable<any> {
    return this.apiRewardsService.rewardsControllerGetRewardProgramById({ id }).pipe(
      catchError(error => {
        console.error('Error fetching reward program:', error);
        throw error;
      })
    );
  }

  createRewardProgram(program: CreateRewardProgramDto): Observable<any> {
    return this.apiRewardsService.rewardsControllerCreateRewardProgram({
      body: program
    }).pipe(
      catchError(error => {
        console.error('Error creating reward program:', error);
        throw error;
      })
    );
  }

  updateRewardProgram(id: number, program: UpdateRewardProgramDto): Observable<any> {
    return this.apiRewardsService.rewardsControllerUpdateRewardProgram({
      id,
      body: program
    }).pipe(
      catchError(error => {
        console.error('Error updating reward program:', error);
        throw error;
      })
    );
  }

  deleteRewardProgram(id: number): Observable<any> {
    return this.apiRewardsService.rewardsControllerDeleteRewardProgram({ id }).pipe(
      catchError(error => {
        console.error('Error deleting reward program:', error);
        throw error;
      })
    );
  }

  getRewardProgramsByBusinessType(businessTypeId: number): Observable<any> {
    return this.apiRewardsService.rewardsControllerGetRewardProgramsByBusinessType({
      businessTypeId
    }).pipe(
      catchError(error => {
        console.error('Error fetching programs by business type:', error);
        return of([]);
      })
    );
  }

  // Client Rewards Management
  getClientRewards(clientId: number): Observable<any> {
    return this.apiRewardsService.rewardsControllerGetClientRewards({ clientId }).pipe(
      catchError(error => {
        console.error('Error fetching client rewards:', error);
        return of([]);
      })
    );
  }

  getClientActiveRewards(clientId: number): Observable<any> {
    return this.apiRewardsService.rewardsControllerGetClientActiveRewards({ clientId }).pipe(
      catchError(error => {
        console.error('Error fetching client active rewards:', error);
        return of([]);
      })
    );
  }

  getClientEarnedRewards(clientId: number): Observable<any> {
    return this.apiRewardsService.rewardsControllerGetClientEarnedRewards({ clientId }).pipe(
      catchError(error => {
        console.error('Error fetching client earned rewards:', error);
        return of([]);
      })
    );
  }

  getClientRewardHistory(clientId: number): Observable<any> {
    return this.apiRewardsService.rewardsControllerGetClientRewardHistory({ clientId }).pipe(
      catchError(error => {
        console.error('Error fetching client reward history:', error);
        return of([]);
      })
    );
  }

  redeemReward(clientId: number, rewardId: number): Observable<any> {
    return this.apiRewardsService.rewardsControllerRedeemReward({ clientId, rewardId }).pipe(
      catchError(error => {
        console.error('Error redeeming reward:', error);
        throw error;
      })
    );
  }

  // Metrics and Analytics
  getRewardsMetrics(): Observable<any> {
    return this.apiRewardsService.rewardsControllerGetRewardsMetrics().pipe(
      catchError(error => {
        console.error('Error fetching rewards metrics:', error);
        return of({});
      })
    );
  }

  // Trigger Methods
  triggerAppointmentCompleted(clientId: number): Observable<any> {
    return this.apiRewardsService.rewardsControllerTriggerAppointmentCompleted({ clientId }).pipe(
      catchError(error => {
        console.error('Error triggering appointment completed:', error);
        throw error;
      })
    );
  }

  triggerConsultationCompleted(clientId: number): Observable<any> {
    return this.apiRewardsService.rewardsControllerTriggerConsultationCompleted({ clientId }).pipe(
      catchError(error => {
        console.error('Error triggering consultation completed:', error);
        throw error;
      })
    );
  }

  triggerServiceCompleted(clientId: number): Observable<any> {
    return this.apiRewardsService.rewardsControllerTriggerServiceCompleted({ clientId }).pipe(
      catchError(error => {
        console.error('Error triggering service completed:', error);
        throw error;
      })
    );
  }

  triggerPurchaseCompleted(clientId: number): Observable<any> {
    return this.apiRewardsService.rewardsControllerTriggerPurchaseCompleted({ clientId }).pipe(
      catchError(error => {
        console.error('Error triggering purchase completed:', error);
        throw error;
      })
    );
  }

  // Cleanup
  cleanupExpiredRewards(): Observable<any> {
    return this.apiRewardsService.rewardsControllerCleanupExpiredRewards().pipe(
      catchError(error => {
        console.error('Error cleaning up expired rewards:', error);
        throw error;
      })
    );
  }

  // Utility methods
  calculateProgress(current: number, target: number): number {
    if (target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  }

  getRewardTypeColor(type: string): string {
    const colors: Record<string, string> = {
      'discount': '#3498db',
      'service': '#2ecc71',
      'product': '#f39c12',
      'points': '#9b59b6',
      'cashback': '#e74c3c'
    };
    return colors[type] || '#95a5a6';
  }

  getRewardTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'discount': 'pi-percentage',
      'service': 'pi-star',
      'product': 'pi-gift',
      'points': 'pi-circle',
      'cashback': 'pi-dollar'
    };
    return icons[type] || 'pi-question';
  }

  formatRewardValue(type: string, value: number): string {
    switch (type) {
      case 'discount':
      case 'cashback':
        return `${value}%`;
      case 'points':
        return `${value} pts`;
      case 'service':
      case 'product':
        return value.toString();
      default:
        return value.toString();
    }
  }
}