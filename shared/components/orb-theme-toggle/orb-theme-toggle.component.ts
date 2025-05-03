import { Component } from '@angular/core';
import { ThemeService } from './../../../src/app/services/core/theme/theme.service';
@Component({
  selector: 'orb-theme-toggle',
  standalone: true,
  templateUrl: './orb-theme-toggle.component.html',
})
export class OrbThemeToggleComponent {
  theme: 'light' | 'dark';

  constructor(private themeService: ThemeService) {
    this.theme = this.themeService.getCurrentTheme();
  }

  toggleTheme() {
    this.themeService.toggleTheme();
    this.theme = this.themeService.getCurrentTheme();
  }
}
