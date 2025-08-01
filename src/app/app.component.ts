import { SPANISH_LOCALE } from '@orb-models';

import { Component, inject, OnInit } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import {  TranslateService } from '@ngx-translate/core';
import { SpinnerService, ThemeService } from '@orb-services';
import { PrimeNG } from 'primeng/config';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';

@Component({
  imports: [ RouterModule, RouterOutlet,ProgressSpinnerModule, ToastModule ],
  providers: [ThemeService, PrimeNG],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'orbyt';
  spinner = inject(SpinnerService);
  private config = inject(PrimeNG);
   private translateService = inject( TranslateService);
   private themeService= inject(ThemeService);
   
   ngOnInit() {
    this.translateService.setDefaultLang('es');
    this.themeService.initTheme();
    this.translate('es');
}

translate(lang: string) {
  this.translateService.use(lang);
  this.translateService.get('primeng').subscribe(res => this.config.setTranslation(SPANISH_LOCALE));
}
}
