import { Injectable, inject } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { exhaustMap, tap, switchMap, catchError, of } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { linkToGlobalState } from '../component-state.reducer';
import { Store } from '@ngrx/store';
import { NotificationService } from '@orb-services';
import { NotificationSeverity } from '@orb-models';
import {
  EmailLogResponseDto,
  EmailMetricsResponseDto,
  EmailTemplateResponseDto,
  SendEmailDto,
  CreateEmailTemplateDto,
  UpdateEmailTemplateDto
} from '../../api/models';
import { EmailManagementService } from '../../features/email-management/services/email-management.service';

export interface EmailManagementState {
  // Email logs
  emailLogs: EmailLogResponseDto[];
  recentEmails: EmailLogResponseDto[];
  failedEmails: EmailLogResponseDto[];

  // Metrics
  metrics: EmailMetricsResponseDto | null;

  // Templates
  emailTemplates: EmailTemplateResponseDto[];

  // System status
  systemStatus: {
    smtpConnected: boolean;
    templatesLoaded: boolean;
    templatesCount: number;
    queueHealthy: boolean;
    pendingInQueue: number;
  };

  // UI state
  loading: boolean;
  loadingTemplates: boolean;
  loadingMetrics: boolean;
  error: any | null;
}

const initialState: EmailManagementState = {
  emailLogs: [],
  recentEmails: [],
  failedEmails: [],
  metrics: null,
  emailTemplates: [],
  systemStatus: {
    smtpConnected: true,
    templatesLoaded: true,
    templatesCount: 0,
    queueHealthy: true,
    pendingInQueue: 0
  },
  loading: false,
  loadingTemplates: false,
  loadingMetrics: false,
  error: null
};

@Injectable({ providedIn: 'root' })
export class EmailManagementStore extends ComponentStore<EmailManagementState> {
  private readonly emailService = inject(EmailManagementService);
  private readonly notificationService = inject(NotificationService);

  constructor(private readonly globalStore: Store) {
    super(initialState);
    linkToGlobalState(this.state$, 'EmailManagementStore', this.globalStore);
  }

  // Selectors
  readonly emailLogs$ = this.select((state) => state.emailLogs);
  readonly recentEmails$ = this.select((state) => state.recentEmails);
  readonly failedEmails$ = this.select((state) => state.failedEmails);
  readonly metrics$ = this.select((state) => state.metrics);
  readonly emailTemplates$ = this.select((state) => state.emailTemplates);
  readonly systemStatus$ = this.select((state) => state.systemStatus);
  readonly loading$ = this.select((state) => state.loading);
  readonly loadingTemplates$ = this.select((state) => state.loadingTemplates);
  readonly loadingMetrics$ = this.select((state) => state.loadingMetrics);

  // Computed selectors
  readonly selectDashboardData = this.select(
    this.metrics$,
    this.recentEmails$,
    this.failedEmails$,
    this.systemStatus$,
    (metrics, recentEmails, failedEmails, systemStatus) => ({
      metrics,
      recentEmails,
      failedEmails,
      systemStatus
    })
  );

  // Updaters
  private readonly setLoading = this.updater((state, loading: boolean) => ({
    ...state,
    loading
  }));

  private readonly setLoadingMetrics = this.updater((state, loadingMetrics: boolean) => ({
    ...state,
    loadingMetrics
  }));

  private readonly setLoadingTemplates = this.updater((state, loadingTemplates: boolean) => ({
    ...state,
    loadingTemplates
  }));

  private readonly setEmailLogs = this.updater((state, emailLogs: EmailLogResponseDto[]) => ({
    ...state,
    emailLogs,
    recentEmails: emailLogs.slice(0, 50), // Most recent 50
    failedEmails: emailLogs.filter(email => email.status === 'failed'),
    loading: false
  }));

  private readonly setMetrics = this.updater((state, metrics: EmailMetricsResponseDto) => ({
    ...state,
    metrics,
    loadingMetrics: false
  }));

  private readonly setEmailTemplates = this.updater((state, emailTemplates: EmailTemplateResponseDto[]) => ({
    ...state,
    emailTemplates,
    loadingTemplates: false,
    systemStatus: {
      ...state.systemStatus,
      templatesCount: emailTemplates.length,
      templatesLoaded: true
    }
  }));

  private readonly addEmailTemplate = this.updater((state, template: EmailTemplateResponseDto) => ({
    ...state,
    emailTemplates: [...state.emailTemplates, template],
    loadingTemplates: false
  }));

  private readonly updateEmailTemplate = this.updater((state, template: EmailTemplateResponseDto) => ({
    ...state,
    emailTemplates: state.emailTemplates.map(t => t.id === template.id ? template : t),
    loadingTemplates: false
  }));

  private readonly removeEmailTemplate = this.updater((state, templateId: string) => ({
    ...state,
    emailTemplates: state.emailTemplates.filter(t => t.id !== templateId),
    loadingTemplates: false
  }));

  private readonly updateSystemStatus = this.updater((state, status: Partial<EmailManagementState['systemStatus']>) => ({
    ...state,
    systemStatus: { ...state.systemStatus, ...status }
  }));

  private readonly setError = this.updater((state, error: any) => ({
    ...state,
    error,
    loading: false,
    loadingMetrics: false,
    loadingTemplates: false
  }));

  // Effects
  readonly loadEmailLogs = this.effect<{ page?: number; limit?: number; status?: 'pending' | 'sent' | 'failed' | 'scheduled' }>((params$) =>
    params$.pipe(
      tap(() => this.setLoading(true)),
      exhaustMap((params) =>
        this.emailService.getEmailLogs(params).pipe(
          tapResponse(
            (logs: EmailLogResponseDto[]) => {
              this.setEmailLogs(logs);
            },
            (error: any) => {
              console.error('Error loading email logs:', error);
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al cargar los logs de email.'
              );
            }
          )
        )
      )
    )
  );

  readonly loadEmailMetrics = this.effect<{ from?: string; to?: string }>((params$) =>
    params$.pipe(
      tap(() => this.setLoadingMetrics(true)),
      exhaustMap((params) =>
        this.emailService.getEmailMetrics(params && params.from && params.to ? { startDate: params.from, endDate: params.to } : undefined).pipe(
          tapResponse(
            (metrics: EmailMetricsResponseDto) => {
              this.setMetrics(metrics);
            },
            (error: any) => {
              console.error('Error loading email metrics:', error);
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al cargar las métricas de email.'
              );
            }
          )
        )
      )
    )
  );

  readonly loadEmailTemplates = this.effect<void>((trigger$) =>
    trigger$.pipe(
      tap(() => this.setLoadingTemplates(true)),
      exhaustMap(() =>
        this.emailService.getEmailTemplates().pipe(
          tapResponse(
            (templates: EmailTemplateResponseDto[]) => {
              this.setEmailTemplates(templates);
            },
            (error: any) => {
              console.error('Error loading email templates:', error);
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al cargar las plantillas de email.'
              );
            }
          )
        )
      )
    )
  );

  readonly sendEmail = this.effect<SendEmailDto>((emailData$) =>
    emailData$.pipe(
      tap(() => this.setLoading(true)),
      exhaustMap((emailData) =>
        this.emailService.sendCustomEmail(emailData).pipe(
          tapResponse(
            (response) => {
              this.setLoading(false);
              this.notificationService.showSuccess(
                NotificationSeverity.Success,
                'Email enviado con éxito.'
              );
              // Reload logs to show the new email
              this.loadEmailLogs({});
            },
            (error: any) => {
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al enviar el email.'
              );
            }
          )
        )
      )
    )
  );

  readonly retryFailedEmail = this.effect<string>((emailId$) =>
    emailId$.pipe(
      tap(() => this.setLoading(true)),
      exhaustMap((emailId) =>
        this.emailService.retryFailedEmail(emailId).pipe(
          tapResponse(
            (response) => {
              this.setLoading(false);
              this.notificationService.showSuccess(
                NotificationSeverity.Success,
                'Email reenviado con éxito.'
              );
              // Reload logs to update status
              this.loadEmailLogs({});
            },
            (error: any) => {
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al reenviar el email.'
              );
            }
          )
        )
      )
    )
  );

  readonly createEmailTemplate = this.effect<CreateEmailTemplateDto>((templateData$) =>
    templateData$.pipe(
      tap(() => this.setLoadingTemplates(true)),
      exhaustMap((templateData) =>
        this.emailService.createEmailTemplate(templateData).pipe(
          tapResponse(
            (template: EmailTemplateResponseDto) => {
              this.addEmailTemplate(template);
              this.notificationService.showSuccess(
                NotificationSeverity.Success,
                'Plantilla de email creada con éxito.'
              );
            },
            (error: any) => {
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al crear la plantilla de email.'
              );
            }
          )
        )
      )
    )
  );

  readonly updateTemplate = this.effect<{ id: string; templateData: UpdateEmailTemplateDto }>((params$) =>
    params$.pipe(
      tap(() => this.setLoadingTemplates(true)),
      exhaustMap(({ id, templateData }) =>
        this.emailService.updateEmailTemplate(id, templateData).pipe(
          tapResponse(
            (template: EmailTemplateResponseDto) => {
              this.updateEmailTemplate(template);
              this.notificationService.showSuccess(
                NotificationSeverity.Success,
                'Plantilla de email actualizada con éxito.'
              );
            },
            (error: any) => {
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al actualizar la plantilla de email.'
              );
            }
          )
        )
      )
    )
  );

  readonly deleteEmailTemplate = this.effect<string>((templateId$) =>
    templateId$.pipe(
      tap(() => this.setLoadingTemplates(true)),
      exhaustMap((templateId) =>
        this.emailService.deleteEmailTemplate(templateId).pipe(
          tapResponse(
            () => {
              this.removeEmailTemplate(templateId);
              this.notificationService.showSuccess(
                NotificationSeverity.Success,
                'Plantilla de email eliminada con éxito.'
              );
            },
            (error: any) => {
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al eliminar la plantilla de email.'
              );
            }
          )
        )
      )
    )
  );

  readonly testEmailConnection = this.effect<void>((trigger$) =>
    trigger$.pipe(
      tap(() => this.setLoading(true)),
      exhaustMap(() =>
        this.emailService.testSmtpConnection().pipe(
          tapResponse(
            (response) => {
              this.setLoading(false);
              this.updateSystemStatus({
                smtpConnected: (response as any).connected || false,
                queueHealthy: (response as any).queueHealthy || false
              });
              this.notificationService.showSuccess(
                NotificationSeverity.Success,
                'Conexión de email probada con éxito.'
              );
            },
            (error: any) => {
              this.setError(error);
              this.updateSystemStatus({
                smtpConnected: false,
                queueHealthy: false
              });
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al probar la conexión de email.'
              );
            }
          )
        )
      )
    )
  );

  // Utility methods
  refreshMetrics(): void {
    this.loadEmailMetrics({});
  }

  refreshDashboard(): void {
    this.loadEmailLogs({});
    this.loadEmailMetrics({});
    this.testEmailConnection();
  }

  getEmailById(id: string): EmailLogResponseDto | undefined {
    return this.get().emailLogs.find(email => email.id === id);
  }

  getTemplateById(id: string): EmailTemplateResponseDto | undefined {
    return this.get().emailTemplates.find(template => template.id === id);
  }
}