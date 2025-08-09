import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule, AsyncPipe } from '@angular/common';
// Removed unused Orb components imports
import { AuthStore } from '@orb-stores';
import { LoginDto } from '../../api/model/models';
import { MessageModule } from 'primeng/message';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
// import { OrbButtonComponent } from "@orb-components";

@Component({
  selector: 'orb-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MessageModule,
    InputGroupModule,
    InputGroupAddonModule,
    InputTextModule
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
    
    // Limpiar error anterior
    this.authStore.setError(null);
    
    const login: LoginDto = {
      email: this.form.value.email ?? '',
      password: this.form.value.password ?? ''
    };
    this.authStore.login(login);
  }
}
