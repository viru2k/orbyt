import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private themeKey = 'orbyt-theme';

  private themes = {
    light: {
      '--p-color-primary': '#7c3aed',
      '--p-color-primary-text': '#ffffff',
      '--p-surface-ground': '#f5f5f5',
      '--p-surface-card': '#ffffff',
      '--p-surface-border': '#cccccc',
    },
    dark: {
      '--p-color-primary': '#7c3aed',
      '--p-color-primary-text': '#ffffff',
      '--p-surface-ground': '#1e1e1e',
      '--p-surface-card': '#2a2a2a',
      '--p-surface-border': '#444444',
    }
  };

  setTheme(themeName: 'light' | 'dark') {
    const theme = this.themes[themeName];
    Object.entries(theme).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(themeName);
    localStorage.setItem(this.themeKey, themeName);
  }

  initTheme() {
    const saved = localStorage.getItem(this.themeKey) as 'light' | 'dark';
    this.setTheme(saved || 'dark');
  }

  toggleTheme() {
    const current = localStorage.getItem(this.themeKey) === 'dark' ? 'light' : 'dark';
    this.setTheme(current as 'light' | 'dark');
  }

  getCurrentTheme(): 'light' | 'dark' {
    return (localStorage.getItem(this.themeKey) as 'light' | 'dark') || 'light';
  }
}
