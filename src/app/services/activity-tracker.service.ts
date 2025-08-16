import { Injectable, inject } from '@angular/core';
import { fromEvent, merge } from 'rxjs';
import { throttleTime } from 'rxjs/operators';
import { AuthStore } from '../store/auth/auth.store';

@Injectable({
  providedIn: 'root'
})
export class ActivityTrackerService {
  private authStore = inject(AuthStore);

  constructor() {
    this.initializeActivityTracking();
  }

  private initializeActivityTracking(): void {
    // Detectar clicks en elementos de navegación/menú
    const menuClicks$ = fromEvent(document, 'click').pipe(
      throttleTime(1000) // Throttle para evitar spam
    );

    // Detectar otros eventos de actividad
    const keyboardActivity$ = fromEvent(document, 'keydown').pipe(
      throttleTime(5000)
    );

    const mouseActivity$ = fromEvent(document, 'mousemove').pipe(
      throttleTime(10000)
    );

    // Combinar todas las actividades
    merge(menuClicks$, keyboardActivity$, mouseActivity$)
      .subscribe(() => {
        if (this.authStore.isAuthenticated()) {
          this.authStore.recordActivity();
        }
      });
  }

  // Método para registrar actividad manualmente
  public recordActivity(): void {
    this.authStore.recordActivity();
  }
}