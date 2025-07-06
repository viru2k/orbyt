
import { MessageService } from 'primeng/api';
import { Configuration } from './api/configuration';

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
import Aura from '@primeng/themes/aura';
import { provideTranslateService } from '@ngx-translate/core';
import { DatePipe, registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';


registerLocaleData(localeEs, 'es-ES');


export const appConfig: ApplicationConfig = {
  providers: [    
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideHttpClient(withInterceptorsFromDi()),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
          preset: Aura,
          options: {
              prefix: 'p',
              darkModeSelector: '.my-app-dark',
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

  provideTranslateService(),
  {
    provide: HTTP_INTERCEPTORS,
    useClass: AuthInterceptor,
    multi: true
  },
  {
    provide: Configuration,
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
     DatePipe,
    { provide: LOCALE_ID, useValue: 'es-ES' }
  ],

};

export function apiConfigFactory(localStorage: LocalStorageService): Configuration {
  return new Configuration({
    basePath: 'http://127.0.0.1:3000',
    accessToken: () => localStorage.getToken() || '',
  });
}