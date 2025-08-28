import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';

// API Service and Models
import { EmailManagementService as ApiEmailService } from '../../../api/services/email-management.service';
import {
  EmailSettingsDto,
  EmailSettingsResponseDto,
  UpdateEmailSettingsDto,
  CreateEmailTemplateDto,
  UpdateEmailTemplateDto,
  EmailTemplateResponseDto,
  SendEmailDto,
  SendTemplateEmailDto,
  BulkEmailDto,
  EmailSendResponseDto,
  BulkEmailResponseDto,
  EmailLogResponseDto,
  EmailMetricsResponseDto,
  EmailMetricsSummaryDto,
  TestConnectionResponseDto
} from '../../../api/models';

@Injectable({
  providedIn: 'root'
})
export class EmailManagementService {
  private apiService = inject(ApiEmailService);
  
  // State management
  private emailSettingsSubject = new BehaviorSubject<EmailSettingsResponseDto | null>(null);
  private emailMetricsSubject = new BehaviorSubject<EmailMetricsResponseDto | null>(null);
  private templatesSubject = new BehaviorSubject<EmailTemplateResponseDto[]>([]);

  public readonly emailSettings$ = this.emailSettingsSubject.asObservable();
  public readonly emailMetrics$ = this.emailMetricsSubject.asObservable();
  public readonly templates$ = this.templatesSubject.asObservable();

  constructor() {
    this.loadEmailSettings();
    this.loadEmailMetrics();
    this.loadTemplates();
  }

  // ===== EMAIL SETTINGS MANAGEMENT =====
  
  getEmailSettings(): Observable<EmailSettingsResponseDto> {
    return this.apiService.emailControllerGetEmailSettings().pipe(
      tap(settings => this.emailSettingsSubject.next(settings)),
      catchError(error => {
        console.error('Failed to load email settings:', error);
        return of({} as EmailSettingsResponseDto);
      })
    );
  }

  saveEmailSettings(settings: EmailSettingsDto): Observable<void> {
    return this.apiService.emailControllerSaveEmailSettings({ body: settings }).pipe(
      tap(() => this.loadEmailSettings()),
      catchError(error => {
        console.error('Failed to save email settings:', error);
        throw error;
      })
    );
  }

  updateEmailSettings(id: string, settings: UpdateEmailSettingsDto): Observable<void> {
    return this.apiService.emailControllerUpdateEmailSettings({ id, body: settings }).pipe(
      tap(() => this.loadEmailSettings()),
      catchError(error => {
        console.error('Failed to update email settings:', error);
        throw error;
      })
    );
  }

  testSmtpConnection(): Observable<TestConnectionResponseDto> {
    return this.apiService.emailControllerTestSmtpConnection().pipe(
      catchError(error => {
        console.error('SMTP connection test failed:', error);
        throw error;
      })
    );
  }

  // Additional methods using new backend endpoints
  validateSmtpSettings(settings: EmailSettingsDto): Observable<TestConnectionResponseDto> {
    return this.apiService.emailControllerValidateSmtpSettings({ body: settings }).pipe(
      catchError(error => {
        console.error('SMTP validation failed:', error);
        throw error;
      })
    );
  }

  sendTestEmail(emailData: SendEmailDto): Observable<EmailSendResponseDto> {
    return this.sendCustomEmail(emailData);
  }

  createEmailSettings(settings: EmailSettingsDto): Observable<EmailSettingsResponseDto> {
    return this.apiService.emailControllerCreateEmailSettings({ body: settings }).pipe(
      tap(() => this.loadEmailSettings()),
      catchError(error => {
        console.error('Failed to create email settings:', error);
        throw error;
      })
    );
  }

  // ===== EMAIL TEMPLATES MANAGEMENT =====
  
  getEmailTemplates(): Observable<EmailTemplateResponseDto[]> {
    return this.apiService.emailControllerGetAllTemplates().pipe(
      tap(templates => this.templatesSubject.next(templates)),
      catchError(error => {
        console.error('Failed to load email templates:', error);
        return of([]);
      })
    );
  }

  getEmailTemplate(id: string): Observable<EmailTemplateResponseDto> {
    return this.apiService.emailControllerGetTemplateById({ id }).pipe(
      catchError(error => {
        console.error('Failed to load email template:', error);
        throw error;
      })
    );
  }

  createEmailTemplate(template: CreateEmailTemplateDto): Observable<EmailTemplateResponseDto> {
    return this.apiService.emailControllerCreateTemplate({ body: template }).pipe(
      tap(() => this.loadTemplates()),
      catchError(error => {
        console.error('Failed to create email template:', error);
        throw error;
      })
    );
  }

  updateEmailTemplate(id: string, template: UpdateEmailTemplateDto): Observable<EmailTemplateResponseDto> {
    return this.apiService.emailControllerUpdateTemplate({ id, body: template }).pipe(
      tap(() => this.loadTemplates()),
      catchError(error => {
        console.error('Failed to update email template:', error);
        throw error;
      })
    );
  }

  deleteEmailTemplate(id: string): Observable<void> {
    return this.apiService.emailControllerDeleteTemplate({ id }).pipe(
      tap(() => this.loadTemplates()),
      catchError(error => {
        console.error('Failed to delete email template:', error);
        throw error;
      })
    );
  }

  // ===== EMAIL SENDING =====
  
  sendCustomEmail(emailData: SendEmailDto): Observable<EmailSendResponseDto> {
    return this.apiService.emailControllerSendCustomEmail({ body: emailData }).pipe(
      catchError(error => {
        console.error('Failed to send custom email:', error);
        throw error;
      })
    );
  }

  sendTemplateEmail(emailData: SendTemplateEmailDto): Observable<EmailSendResponseDto> {
    return this.apiService.emailControllerSendTemplateEmail({ body: emailData }).pipe(
      catchError(error => {
        console.error('Failed to send template email:', error);
        throw error;
      })
    );
  }

  sendBulkEmails(bulkData: BulkEmailDto): Observable<BulkEmailResponseDto> {
    return this.apiService.emailControllerSendBulkEmails({ body: bulkData }).pipe(
      catchError(error => {
        console.error('Failed to send bulk emails:', error);
        throw error;
      })
    );
  }

  // ===== INTEGRATION METHODS =====
  
  sendWelcomeEmail(userId: string): Observable<EmailSendResponseDto> {
    return this.apiService.emailControllerSendWelcomeEmail({ userId }).pipe(
      catchError(error => {
        console.error('Failed to send welcome email:', error);
        throw error;
      })
    );
  }

  sendPasswordResetEmail(userId: string): Observable<EmailSendResponseDto> {
    return this.apiService.emailControllerSendPasswordResetEmail({ userId }).pipe(
      catchError(error => {
        console.error('Failed to send password reset email:', error);
        throw error;
      })
    );
  }

  sendAppointmentReminder(appointmentId: string): Observable<EmailSendResponseDto> {
    return this.apiService.emailControllerSendAppointmentReminder({ appointmentId }).pipe(
      catchError(error => {
        console.error('Failed to send appointment reminder:', error);
        throw error;
      })
    );
  }

  // ===== LOGS AND ANALYTICS =====
  
  getEmailLogs(params?: {
    page?: number;
    limit?: number;
    status?: 'pending' | 'sent' | 'failed' | 'scheduled';
    startDate?: string;
    endDate?: string;
  }): Observable<EmailLogResponseDto[]> {
    return this.apiService.emailControllerGetEmailLogs(params || {}).pipe(
      map((response: any) => {
        // Handle paginated response or array
        if (response && response.data && Array.isArray(response.data)) {
          return response.data;
        } else if (Array.isArray(response)) {
          return response;
        }
        return [];
      }),
      catchError(error => {
        console.error('Failed to load email logs:', error);
        return of([]);
      })
    );
  }

  getFailedEmails(): Observable<EmailLogResponseDto[]> {
    return this.apiService.emailControllerGetFailedEmails().pipe(
      catchError(error => {
        console.error('Failed to load failed emails:', error);
        return of([]);
      })
    );
  }

  retryFailedEmail(logId: string): Observable<any> {
    return this.apiService.emailControllerRetryFailedEmail({ logId }).pipe(
      catchError(error => {
        console.error('Failed to retry email:', error);
        throw error;
      })
    );
  }

  getEmailMetrics(dateRange?: { startDate: string; endDate: string }): Observable<EmailMetricsResponseDto> {
    return this.apiService.emailControllerGetEmailMetrics(dateRange || {}).pipe(
      tap(metrics => this.emailMetricsSubject.next(metrics)),
      catchError(error => {
        console.error('Failed to load email metrics:', error);
        return of({} as EmailMetricsResponseDto);
      })
    );
  }

  getMetricsSummary(): Observable<EmailMetricsSummaryDto> {
    return this.apiService.emailControllerGetMetricsSummary().pipe(
      catchError(error => {
        console.error('Failed to load metrics summary:', error);
        return of({} as EmailMetricsSummaryDto);
      })
    );
  }

  // ===== QUEUE MANAGEMENT =====
  
  getQueueStats(): Observable<any> {
    return this.apiService.emailControllerGetQueueStats().pipe(
      catchError(error => {
        console.error('Failed to load queue stats:', error);
        return of({});
      })
    );
  }

  pauseQueue(): Observable<any> {
    return this.apiService.emailControllerPauseQueue().pipe(
      catchError(error => {
        console.error('Failed to pause queue:', error);
        throw error;
      })
    );
  }

  resumeQueue(): Observable<any> {
    return this.apiService.emailControllerResumeQueue().pipe(
      catchError(error => {
        console.error('Failed to resume queue:', error);
        throw error;
      })
    );
  }

  cleanQueue(): Observable<any> {
    return this.apiService.emailControllerCleanQueue().pipe(
      catchError(error => {
        console.error('Failed to clean queue:', error);
        throw error;
      })
    );
  }

  // ===== PRIVATE METHODS FOR STATE MANAGEMENT =====
  
  private loadEmailSettings(): void {
    this.getEmailSettings().subscribe();
  }

  private loadEmailMetrics(): void {
    this.getEmailMetrics().subscribe();
  }

  private loadTemplates(): void {
    this.getEmailTemplates().subscribe();
  }

  // ===== UTILITY METHODS =====
  
  refreshSettings(): void {
    this.loadEmailSettings();
  }

  refreshMetrics(): void {
    this.loadEmailMetrics();
  }

  refreshTemplates(): void {
    this.loadTemplates();
  }

  getCurrentSettings(): EmailSettingsResponseDto | null {
    return this.emailSettingsSubject.value;
  }

  getCurrentMetrics(): EmailMetricsResponseDto | null {
    return this.emailMetricsSubject.value;
  }

  getCurrentTemplates(): EmailTemplateResponseDto[] {
    return this.templatesSubject.value;
  }
}