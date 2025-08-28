import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, filter, map } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { TokenService } from '../token.service';

export interface NotificationMessage {
  id?: string;
  type: 'consultation_token' | 'reward_earned' | 'reward_redeemed' | 'general';
  title: string;
  message: string;
  data?: any;
  timestamp: Date;
  read: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService implements OnDestroy {
  private socket?: Socket;
  private connected$ = new BehaviorSubject<boolean>(false);
  private _notifications$ = new BehaviorSubject<NotificationMessage[]>([]);
  private _newNotification$ = new BehaviorSubject<NotificationMessage | null>(null);

  constructor(private tokenService: TokenService) {
    this.connect();
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  private connect(): void {
    // TODO: Replace with actual token retrieval method
    const token = null; // this.tokenService.getToken();
    if (!token) {
      console.warn('No token available for WebSocket connection');
      return;
    }

    this.socket = io('http://localhost:3000/notifications', {
      auth: {
        token: token
      },
      transports: ['websocket']
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      this.connected$.next(true);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      this.connected$.next(false);
    });

    this.socket.on('notification', (data: NotificationMessage) => {
      console.log('Received notification:', data);
      const notification = {
        ...data,
        timestamp: new Date(data.timestamp),
        read: false
      };
      
      // Add to notifications list
      const currentNotifications = this._notifications$.value;
      this._notifications$.next([notification, ...currentNotifications]);
      
      // Emit as new notification
      this._newNotification$.next(notification);
    });

    this.socket.on('consultation_token_created', (data: any) => {
      const notification: NotificationMessage = {
        type: 'consultation_token',
        title: 'Token de Consulta Creado',
        message: `Se ha creado un nuevo token para la consulta #${data.consultationId}`,
        data: data,
        timestamp: new Date(),
        read: false
      };
      this.handleNotification(notification);
    });

    this.socket.on('reward_earned', (data: any) => {
      const notification: NotificationMessage = {
        type: 'reward_earned',
        title: 'Nueva Recompensa Ganada',
        message: `${data.clientName} ha ganado una nueva recompensa: ${data.rewardName}`,
        data: data,
        timestamp: new Date(),
        read: false
      };
      this.handleNotification(notification);
    });

    this.socket.on('reward_redeemed', (data: any) => {
      const notification: NotificationMessage = {
        type: 'reward_redeemed',
        title: 'Recompensa Canjeada',
        message: `${data.clientName} ha canjeado: ${data.rewardName}`,
        data: data,
        timestamp: new Date(),
        read: false
      };
      this.handleNotification(notification);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.connected$.next(false);
    });
  }

  private handleNotification(notification: NotificationMessage): void {
    const currentNotifications = this._notifications$.value;
    this._notifications$.next([notification, ...currentNotifications]);
    this._newNotification$.next(notification);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = undefined;
      this.connected$.next(false);
    }
  }

  reconnect(): void {
    this.disconnect();
    setTimeout(() => this.connect(), 1000);
  }

  // Observables for components to subscribe to
  get isConnected$(): Observable<boolean> {
    return this.connected$.asObservable();
  }

  get notifications$(): Observable<NotificationMessage[]> {
    return this._notifications$.asObservable();
  }

  get newNotification$(): Observable<NotificationMessage> {
    return this._newNotification$.asObservable().pipe(
      filter(notification => notification !== null)
    ) as Observable<NotificationMessage>;
  }

  // Get notifications by type
  getNotificationsByType(type: NotificationMessage['type']): Observable<NotificationMessage[]> {
    return this._notifications$.pipe(
      map(notifications => notifications.filter(n => n.type === type))
    );
  }

  // Mark notification as read
  markAsRead(notificationId: string): void {
    const notifications = this._notifications$.value;
    const updatedNotifications = notifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    );
    this._notifications$.next(updatedNotifications);
  }

  // Clear all notifications
  clearNotifications(): void {
    this._notifications$.next([]);
  }

  // Send test notification (for testing purposes)
  sendTestNotification(): void {
    if (this.socket?.connected) {
      this.socket.emit('test_notification', {
        message: 'Test notification from frontend'
      });
    }
  }
}