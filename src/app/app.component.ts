import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SpinnerService, ThemeService } from '@orb-services';
import { PrimeNG } from 'primeng/config';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';

@Component({
  imports: [ RouterModule, ProgressSpinnerModule, ToastModule ],
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
    this.translateService.setDefaultLang('en');
    this.themeService.initTheme();
    this.translate('en');
}

translate(lang: string) {
  this.translateService.use(lang);
  this.translateService.get('primeng').subscribe(res => this.config.setTranslation(res));
}
}
