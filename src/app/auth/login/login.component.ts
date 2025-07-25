import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule, AsyncPipe } from '@angular/common';
import { OrbTextInputComponent, OrbButtonComponent, OrbCardComponent } from '@orb-components';
import { AuthStore } from '@orb-stores';
import { LoginDto } from '@orb-api/index';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'orb-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AsyncPipe,
    OrbTextInputComponent,
    OrbButtonComponent,
    OrbCardComponent,
    MessageModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  public authStore = inject(AuthStore);
  private router = inject(Router);

  // Exponemos los observables a la plantilla
  loading$ = this.authStore.loading$;
  error$ = this.authStore.error$;

  form = this.fb.group({
    email: ['peluqueria@glamour.com', [Validators.required, Validators.email]],
    password: ['12345678', Validators.required]
  });

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    
    const login: LoginDto = {
      email: this.form.value.email ?? '',
      password: this.form.value.password ?? ''
    };
    this.authStore.login(login);
  }
}
