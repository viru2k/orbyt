import { Injectable } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { ConsultationsService } from '../../../api/services/consultations.service';
import { PublicConsultationService } from '../../../api/services/public-consultation.service';
import { CreateConsultationTokenDto } from '../../../api/models/create-consultation-token-dto';
import { ConsultationTokenResponseDto } from '../../../api/models/consultation-token-response-dto';

@Injectable({
  providedIn: 'root'
})
export class ConsultationTokensService {

  constructor(
    private consultationsService: ConsultationsService,
    private publicConsultationService: PublicConsultationService
  ) {}

  // Token creation methods
  createToken(consultationId: number, scenario: string): Observable<any> {
    return this.consultationsService.consultationControllerCreateTokenByScenario({
      id: consultationId,
      scenario: scenario
    }).pipe(
      catchError(error => {
        console.error('Error creating token:', error);
        throw error;
      })
    );
  }

  createAutoTokens(consultationId: number): Observable<any> {
    return this.consultationsService.consultationControllerCreateAutoTokens({
      id: consultationId
    }).pipe(
      catchError(error => {
        console.error('Error creating auto tokens:', error);
        throw error;
      })
    );
  }

  // Token management methods
  getTokensForConsultation(consultationId: number): Observable<any> {
    return this.consultationsService.consultationControllerGetTokensForConsultation({
      id: consultationId
    }).pipe(
      catchError(error => {
        console.error('Error fetching tokens:', error);
        return of([]);
      })
    );
  }

  revokeToken(tokenId: string): Observable<any> {
    return this.consultationsService.consultationControllerRevokeToken({
      tokenId: tokenId
    }).pipe(
      catchError(error => {
        console.error('Error revoking token:', error);
        throw error;
      })
    );
  }

  // Public access methods (no authentication required)
  validateToken(token: string): Observable<any> {
    return this.publicConsultationService.publicConsultationControllerValidateToken({
      token: token
    }).pipe(
      catchError(error => {
        console.error('Error validating token:', error);
        return of({ valid: false, error: error.message });
      })
    );
  }

  getTokenInfo(token: string): Observable<any> {
    return this.publicConsultationService.publicConsultationControllerGetTokenInfo({
      token: token
    }).pipe(
      catchError(error => {
        console.error('Error getting token info:', error);
        throw error;
      })
    );
  }

  accessConsultationByToken(token: string): Observable<any> {
    return this.publicConsultationService.publicConsultationControllerAccessConsultationByToken({
      token: token
    }).pipe(
      catchError(error => {
        console.error('Error accessing consultation:', error);
        throw error;
      })
    );
  }

  useTokenAndAccessConsultation(token: string, action?: string, data?: any): Observable<any> {
    return this.publicConsultationService.publicConsultationControllerUseTokenAndAccessConsultation({
      token: token,
      body: { action, data }
    }).pipe(
      catchError(error => {
        console.error('Error using token:', error);
        throw error;
      })
    );
  }

  // Utility methods
  generateTokenUrl(token: string): string {
    return `${window.location.origin}/consulta/${token}`;
  }

  isTokenExpired(expiresAt: string | Date): boolean {
    const expiry = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
    return expiry < new Date();
  }

  getScenarioDisplayName(scenario: string): string {
    const scenarios: Record<string, string> = {
      'pre-consultation': 'Pre-consulta',
      'post-consultation': 'Post-consulta',
      'follow-up': 'Seguimiento',
      'emergency': 'Emergencia'
    };
    return scenarios[scenario] || scenario;
  }

  getScenarioColor(scenario: string): string {
    const colors: Record<string, string> = {
      'pre-consultation': '#3498db',
      'post-consultation': '#2ecc71',
      'follow-up': '#f39c12',
      'emergency': '#e74c3c'
    };
    return colors[scenario] || '#95a5a6';
  }
}