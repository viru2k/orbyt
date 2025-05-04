import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OrbTextInputComponent, OrbButtonComponent, OrbCardComponent } from '@orb-components';
import { AuthStore } from '@orb-stores';
import { LoginDto } from '@orb-api/index';


@Component({
  selector: 'orb-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, OrbTextInputComponent, OrbButtonComponent, OrbCardComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authStore = inject(AuthStore);
  private router = inject(Router);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  ngOnInit() {
    if (this.authStore.isAuthenticated()) {
      this.router.navigate(['/home']);
    }
  }

  onSubmit() {
    if (this.form.invalid) return;
    const login: LoginDto = {
      email: this.form.value.email ?? '',
      password: this.form.value.password ?? ''
    };
    this.authStore.login(login);
  
  }
}
