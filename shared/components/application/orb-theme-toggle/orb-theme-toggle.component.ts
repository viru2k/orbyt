import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '@orb-services';
import { InputSwitchModule } from 'primeng/inputswitch';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'orb-theme-toggle',
  standalone: true,
  imports: [CommonModule, InputSwitchModule, FormsModule],
  template: `
    <div class="theme-toggle-container flex align-items-center gap-2">
      <i class="fas fa-sun" aria-hidden="true"></i>
      <p-inputSwitch [(ngModel)]="isDarkMode" (onChange)="onThemeChange()" aria-label="Cambiar tema"></p-inputSwitch>
      <i class="fas fa-moon" aria-hidden="true"></i>
    </div>
  `,
  styles: [`
    .theme-toggle-container {
      color: var(--text-color);
    }
  `]
})
export class OrbThemeToggleComponent {
  private themeService = inject(ThemeService);
  
  isDarkMode = false;

  constructor() {
    const currentTheme = localStorage.getItem('app-theme') || 'lara-light-blue';
    this.isDarkMode = currentTheme.includes('dark');
  }

  onThemeChange(): void {
    const newTheme = this.isDarkMode ? 'lara-dark-blue' : 'lara-light-blue';
    this.themeService.switchTheme(newTheme);
  }
}
