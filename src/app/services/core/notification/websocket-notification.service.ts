import { Injectable, inject, OnDestroy, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { WebSocketService, NotificationMessage } from '../../websocket/websocket.service';
import { Subject, takeUntil } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebSocketNotificationService implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private messageService = inject(MessageService);
  private webSocketService = inject(WebSocketService);

  ngOnInit(): void {
    this.setupWebSocketNotifications();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupWebSocketNotifications(): void {
    // Escuchar nuevas notificaciones del WebSocket
    this.webSocketService.newNotification$
      .pipe(takeUntil(this.destroy$))
      .subscribe((notification: NotificationMessage) => {
        this.showWebSocketNotification(notification);
      });
  }

  private showWebSocketNotification(notification: NotificationMessage): void {
    const severity = this.getSeverityForNotificationType(notification.type);
    
    this.messageService.add({
      key: 'websocket', // Usar el key del Toast bottom-right
      severity: severity,
      summary: notification.title,
      detail: notification.message,
      life: 8000, // 8 segundos para notificaciones push
      sticky: false
    });
  }

  private getSeverityForNotificationType(type: NotificationMessage['type']): 'success' | 'info' | 'warn' | 'error' {
    switch (type) {
      case 'consultation_token':
        return 'info';
      case 'reward_earned':
        return 'success';
      case 'reward_redeemed':
        return 'success';
      case 'general':
        return 'info';
      default:
        return 'info';
    }
  }

  // Método manual para mostrar notificación de prueba
  showTestNotification(): void {
    this.messageService.add({
      key: 'websocket',
      severity: 'info',
      summary: 'Notificación de Prueba',
      detail: 'Esta es una notificación de prueba del sistema WebSocket',
      life: 5000
    });
  }
}