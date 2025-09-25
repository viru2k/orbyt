import { Injectable, inject } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { exhaustMap, tap, switchMap, catchError, of } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { linkToGlobalState } from '../component-state.reducer';
import { Store } from '@ngrx/store';
import { NotificationService } from '@orb-services';
import { NotificationSeverity } from '@orb-models';
import {
  NotificationResponseDto,
  NotificationSummaryResponseDto,
  FailedNotificationResponseDto,
  CreateNotificationDto,
  WebSocketStatsDto
} from '../../api/models';
import { NotificationsService } from '../../api/services/notifications.service';

export interface NotificationsState {
  // Notifications
  notifications: NotificationResponseDto[];
  unreadNotifications: NotificationResponseDto[];
  failedNotifications: FailedNotificationResponseDto[];

  // Summary
  summary: NotificationSummaryResponseDto | null;

  // WebSocket stats
  webSocketStats: WebSocketStatsDto | null;

  // UI state
  loading: boolean;
  loadingUnread: boolean;
  loadingFailed: boolean;
  loadingStats: boolean;
  error: any | null;
}

const initialState: NotificationsState = {
  notifications: [],
  unreadNotifications: [],
  failedNotifications: [],
  summary: null,
  webSocketStats: null,
  loading: false,
  loadingUnread: false,
  loadingFailed: false,
  loadingStats: false,
  error: null
};

@Injectable({ providedIn: 'root' })
export class NotificationsStore extends ComponentStore<NotificationsState> {
  private readonly notificationsService = inject(NotificationsService);
  private readonly notificationService = inject(NotificationService);

  constructor(private readonly globalStore: Store) {
    super(initialState);
    linkToGlobalState(this.state$, 'NotificationsStore', this.globalStore);
  }

  // Selectors
  readonly notifications$ = this.select((state) => state.notifications);
  readonly unreadNotifications$ = this.select((state) => state.unreadNotifications);
  readonly failedNotifications$ = this.select((state) => state.failedNotifications);
  readonly summary$ = this.select((state) => state.summary);
  readonly webSocketStats$ = this.select((state) => state.webSocketStats);
  readonly loading$ = this.select((state) => state.loading);
  readonly loadingUnread$ = this.select((state) => state.loadingUnread);
  readonly loadingFailed$ = this.select((state) => state.loadingFailed);
  readonly loadingStats$ = this.select((state) => state.loadingStats);

  // Computed selectors
  readonly selectDashboardData = this.select(
    this.summary$,
    this.unreadNotifications$,
    this.failedNotifications$,
    this.webSocketStats$,
    (summary, unreadNotifications, failedNotifications, webSocketStats) => ({
      summary,
      unreadNotifications,
      failedNotifications,
      webSocketStats
    })
  );

  readonly selectUnreadCount = this.select(
    this.summary$,
    (summary) => summary?.unread || 0
  );

  // Updaters
  private readonly setLoading = this.updater((state, loading: boolean) => ({
    ...state,
    loading
  }));

  private readonly setLoadingUnread = this.updater((state, loadingUnread: boolean) => ({
    ...state,
    loadingUnread
  }));

  private readonly setLoadingFailed = this.updater((state, loadingFailed: boolean) => ({
    ...state,
    loadingFailed
  }));

  private readonly setLoadingStats = this.updater((state, loadingStats: boolean) => ({
    ...state,
    loadingStats
  }));

  private readonly setNotifications = this.updater((state, notifications: NotificationResponseDto[]) => ({
    ...state,
    notifications,
    loading: false
  }));

  private readonly setUnreadNotifications = this.updater((state, unreadNotifications: NotificationResponseDto[]) => ({
    ...state,
    unreadNotifications,
    loadingUnread: false
  }));

  private readonly setFailedNotifications = this.updater((state, failedNotifications: FailedNotificationResponseDto[]) => ({
    ...state,
    failedNotifications,
    loadingFailed: false
  }));

  private readonly setSummary = this.updater((state, summary: NotificationSummaryResponseDto) => ({
    ...state,
    summary,
    loadingStats: false
  }));

  private readonly setWebSocketStats = this.updater((state, webSocketStats: WebSocketStatsDto) => ({
    ...state,
    webSocketStats,
    loadingStats: false
  }));

  private readonly addNotification = this.updater((state, notification: NotificationResponseDto) => ({
    ...state,
    notifications: [notification, ...state.notifications],
    unreadNotifications: notification.read ? state.unreadNotifications : [notification, ...state.unreadNotifications],
    summary: state.summary ? {
      ...state.summary,
      total: state.summary.total + 1,
      unread: notification.read ? state.summary.unread : state.summary.unread + 1
    } : null
  }));

  private readonly updateNotification = this.updater((state, notification: NotificationResponseDto) => ({
    ...state,
    notifications: state.notifications.map(n => n.id === notification.id ? notification : n),
    unreadNotifications: notification.read
      ? state.unreadNotifications.filter(n => n.id !== notification.id)
      : state.unreadNotifications.map(n => n.id === notification.id ? notification : n),
    summary: state.summary && notification.read ? {
      ...state.summary,
      unread: Math.max(0, state.summary.unread - 1)
    } : state.summary
  }));

  private readonly removeFailedNotification = this.updater((state, notificationId: number) => ({
    ...state,
    failedNotifications: state.failedNotifications.filter(n => n.id !== notificationId),
    loadingFailed: false
  }));

  private readonly setError = this.updater((state, error: any) => ({
    ...state,
    error,
    loading: false,
    loadingUnread: false,
    loadingFailed: false,
    loadingStats: false
  }));

  // Effects
  readonly loadNotifications = this.effect<{ page?: number; limit?: number }>((params$) =>
    params$.pipe(
      tap(() => this.setLoading(true)),
      exhaustMap((params) =>
        this.notificationsService.notificationControllerGetAll(params).pipe(
          tapResponse(
            (notifications: NotificationResponseDto[]) => {
              this.setNotifications(notifications);
            },
            (error: any) => {
              console.error('Error loading notifications:', error);
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al cargar las notificaciones.'
              );
            }
          )
        )
      )
    )
  );

  readonly loadUnreadNotifications = this.effect<void>((trigger$) =>
    trigger$.pipe(
      tap(() => this.setLoadingUnread(true)),
      exhaustMap(() =>
        this.notificationsService.notificationControllerGetUnread().pipe(
          tapResponse(
            (notifications: NotificationResponseDto[]) => {
              this.setUnreadNotifications(notifications);
            },
            (error: any) => {
              console.error('Error loading unread notifications:', error);
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al cargar las notificaciones no leídas.'
              );
            }
          )
        )
      )
    )
  );

  readonly loadFailedNotifications = this.effect<void>((trigger$) =>
    trigger$.pipe(
      tap(() => this.setLoadingFailed(true)),
      exhaustMap(() =>
        this.notificationsService.notificationControllerGetFailed().pipe(
          tapResponse(
            (notifications: FailedNotificationResponseDto[]) => {
              this.setFailedNotifications(notifications);
            },
            (error: any) => {
              console.error('Error loading failed notifications:', error);
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al cargar las notificaciones fallidas.'
              );
            }
          )
        )
      )
    )
  );

  readonly loadSummary = this.effect<void>((trigger$) =>
    trigger$.pipe(
      tap(() => this.setLoadingStats(true)),
      exhaustMap(() =>
        this.notificationsService.notificationControllerGetSummary().pipe(
          tapResponse(
            (summary: NotificationSummaryResponseDto) => {
              this.setSummary(summary);
            },
            (error: any) => {
              console.error('Error loading notifications summary:', error);
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al cargar el resumen de notificaciones.'
              );
            }
          )
        )
      )
    )
  );

  readonly loadWebSocketStats = this.effect<void>((trigger$) =>
    trigger$.pipe(
      tap(() => this.setLoadingStats(true)),
      exhaustMap(() =>
        this.notificationsService.notificationControllerGetWebSocketStats().pipe(
          tapResponse(
            (stats: WebSocketStatsDto) => {
              this.setWebSocketStats(stats);
            },
            (error: any) => {
              console.error('Error loading WebSocket stats:', error);
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al cargar las estadísticas de WebSocket.'
              );
            }
          )
        )
      )
    )
  );

  readonly createNotification = this.effect<CreateNotificationDto>((notificationData$) =>
    notificationData$.pipe(
      tap(() => this.setLoading(true)),
      exhaustMap((notificationData) =>
        this.notificationsService.notificationControllerCreateNotification({ body: notificationData }).pipe(
          tapResponse(
            (notification: NotificationResponseDto) => {
              this.addNotification(notification);
              this.notificationService.showSuccess(
                NotificationSeverity.Success,
                'Notificación creada con éxito.'
              );
            },
            (error: any) => {
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al crear la notificación.'
              );
            }
          )
        )
      )
    )
  );

  readonly markAsRead = this.effect<number>((notificationId$) =>
    notificationId$.pipe(
      exhaustMap((id) =>
        this.notificationsService.notificationControllerMarkAsRead({ id }).pipe(
          tapResponse(
            (notification: NotificationResponseDto) => {
              this.updateNotification(notification);
              this.notificationService.showSuccess(
                NotificationSeverity.Success,
                'Notificación marcada como leída.'
              );
            },
            (error: any) => {
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al marcar la notificación como leída.'
              );
            }
          )
        )
      )
    )
  );

  readonly retryFailedNotification = this.effect<number>((notificationId$) =>
    notificationId$.pipe(
      tap(() => this.setLoadingFailed(true)),
      exhaustMap((id) =>
        this.notificationsService.notificationControllerRetry({ id }).pipe(
          tapResponse(
            (response) => {
              this.removeFailedNotification(id);
              this.notificationService.showSuccess(
                NotificationSeverity.Success,
                'Notificación reenviada con éxito.'
              );
              // Reload failed notifications to update the list
              this.loadFailedNotifications();
            },
            (error: any) => {
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al reenviar la notificación.'
              );
            }
          )
        )
      )
    )
  );

  readonly testWebSocket = this.effect<{ message: string; title: string }>((testData$) =>
    testData$.pipe(
      tap(() => this.setLoading(true)),
      exhaustMap((testData) =>
        this.notificationsService.notificationControllerTestWebSocket({ body: testData }).pipe(
          tapResponse(
            (response) => {
              this.setLoading(false);
              this.notificationService.showSuccess(
                NotificationSeverity.Success,
                'Prueba de WebSocket enviada con éxito.'
              );
            },
            (error: any) => {
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al enviar la prueba de WebSocket.'
              );
            }
          )
        )
      )
    )
  );

  readonly testBroadcast = this.effect<{ message: string; title: string }>((testData$) =>
    testData$.pipe(
      tap(() => this.setLoading(true)),
      exhaustMap((testData) =>
        this.notificationsService.notificationControllerTestBroadcast({ body: testData }).pipe(
          tapResponse(
            (response) => {
              this.setLoading(false);
              this.notificationService.showSuccess(
                NotificationSeverity.Success,
                'Broadcast de prueba enviado con éxito.'
              );
            },
            (error: any) => {
              this.setError(error);
              this.notificationService.showError(
                NotificationSeverity.Error,
                'Error al enviar el broadcast de prueba.'
              );
            }
          )
        )
      )
    )
  );

  // Utility methods
  refreshDashboard(): void {
    this.loadSummary();
    this.loadUnreadNotifications();
    this.loadFailedNotifications();
    this.loadWebSocketStats();
  }

  refreshNotifications(): void {
    this.loadNotifications({});
    this.loadUnreadNotifications();
  }

  getNotificationById(id: number): NotificationResponseDto | undefined {
    return this.get().notifications.find(notification => notification.id === id);
  }

  getUnreadCount(): number {
    return this.get().summary?.unread || 0;
  }

  markAllAsRead(): void {
    const unreadNotifications = this.get().unreadNotifications;
    unreadNotifications.forEach(notification => {
      this.markAsRead(notification.id);
    });
  }
}