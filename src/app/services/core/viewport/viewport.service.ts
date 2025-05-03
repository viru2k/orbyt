import { Injectable, Signal, computed, effect, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ViewportService {
  private width = signal(window.innerWidth);

  constructor() {
    window.addEventListener('resize', () => {
      this.width.set(window.innerWidth);
    });
  }

  isMobile: Signal<boolean> = computed(() => this.width() < 1024);
  isDesktop: Signal<boolean> = computed(() => this.width() >= 1024);
}
