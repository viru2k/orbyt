import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private messageService: MessageService) {}

  show(severity: string, detail: string, summary?: string) {
    this.messageService.add({ 
      severity: severity as any, 
      summary: summary || this.getSummaryForSeverity(severity), 
      detail 
    });
  }

  private getSummaryForSeverity(severity: string): string {
    switch (severity) {
      case 'error':
        return 'Error';
      case 'success':
        return 'Éxito';
      case 'info':
        return 'Información';
      case 'warn':
        return 'Advertencia';
      default:
        return '';
    }
  }

  showError(summary: string, detail: string) {
    this.messageService.add({ severity: 'error', summary, detail });
  }

  showSuccess(summary: string, detail: string) {
    this.messageService.add({ severity: 'success', summary, detail });
  }

  showInfo(summary: string, detail: string) {
    this.messageService.add({ severity: 'info', summary, detail });
  }

  showWarn(summary: string, detail: string) {
    this.messageService.add({ severity: 'warn', summary, detail });
  }
}
