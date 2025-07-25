import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { LocalStorageService } from '../../storage/local-storage.service';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private themeKey = 'orbyt-theme';
  private renderer: Renderer2;
  private static readonly THEME_STORAGE_KEY = 'app-theme';

    constructor(
    @Inject(DOCUMENT) private document: Document,
    private rendererFactory: RendererFactory2,
    private storageService: LocalStorageService
  ) {
    this.renderer = this.rendererFactory.createRenderer(null, null);
  }



  initTheme(): void {
    const savedTheme = this.storageService.getItem(ThemeService.THEME_STORAGE_KEY) || 'lara-light-blue';
    this.switchTheme(savedTheme);
  }

  switchTheme(theme: string): void {
    const themeLink = this.document.getElementById('app-theme') as HTMLLinkElement;
    if (themeLink) {
      themeLink.href = `${theme}.css`;
      this.storageService.setItem(ThemeService.THEME_STORAGE_KEY, theme);
      if (theme.includes('dark')) {
        this.renderer.addClass(this.document.body, 'dark-theme');
        this.renderer.removeClass(this.document.body, 'light-theme');
      } else {
        this.renderer.addClass(this.document.body, 'light-theme');
        this.renderer.removeClass(this.document.body, 'dark-theme');
      }
    }
  }

}
