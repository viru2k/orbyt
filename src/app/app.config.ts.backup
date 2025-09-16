
import { MessageService, ConfirmationService } from 'primeng/api';
import { ApiConfiguration } from './api/api-configuration';
import { ActivityTrackerService } from './services/activity-tracker.service';
import { CalendarUtils, DateAdapter, CalendarA11y, CalendarDateFormatter, CalendarEventTitleFormatter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { es } from 'date-fns/locale';
import { ApplicationConfig, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { LocalStorageService } from './services/storage/local-storage.service';
import { provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { componentStateReducer } from './store/component-state.reducer';
import { providePrimeNG } from 'primeng/config';
import Lara from '@primeng/themes/lara';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';
import { DatePipe, registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';


registerLocaleData(localeEs, 'es-ES');
registerLocaleData(localeEs, 'es');


export const appConfig: ApplicationConfig = {
  providers: [    
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
          preset: Lara,
      options: {
              prefix: 'p',
              darkModeSelector: '.ligth-theme', 
              cssLayer: false
          }
      },
      zIndex: {
        modal: 1100,
        overlay: 1000,
        menu: 1000,
        tooltip: 1100
      }
      ,
      ripple: true,
       translation: {
          firstDayOfWeek: 1,
          dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
          dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
          dayNamesMin: ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'],
          monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
          monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
          today: 'Hoy',
          clear: 'Borrar',
          dateFormat: 'dd/mm/yy', 
          weekHeader: 'Sm'
}
  }),

  provideTranslateService({
    loader: {
      provide: TranslateLoader,
      useFactory: (http: HttpClient) => new TranslateHttpLoader(http, '/assets/i18n/', '.json'),
      deps: [HttpClient]
    },
    defaultLanguage: 'es'
  }),
  {
    provide: HTTP_INTERCEPTORS,
    useClass: AuthInterceptor,
    multi: true
  },
  {
    provide: ApiConfiguration,
    useFactory: apiConfigFactory,
    deps: [LocalStorageService],
  },
  // NgRx Store Global
  provideStore({
    componentState: componentStateReducer
  }),

  // Devtools de NgRx
  provideStoreDevtools({
    maxAge: 25,
    logOnly: true
  }),
    MessageService,
    ConfirmationService,
    DatePipe,
    ActivityTrackerService,
    CalendarUtils,
    CalendarA11y,
    CalendarDateFormatter,
    CalendarEventTitleFormatter,
    {
      provide: DateAdapter,
      useFactory: adapterFactory,
    },
    { provide: LOCALE_ID, useValue: 'es' }
  ],

};

export function apiConfigFactory(localStorage: LocalStorageService): ApiConfiguration {
  const config = new ApiConfiguration();
  config.rootUrl = 'http://127.0.0.1:3000';
  return config;
}