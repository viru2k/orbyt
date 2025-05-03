import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { OrbScrollPanelComponent, OrbTextInputComponent } from '@orb-components'; // o tu ruta exacta
import { OrbCardComponent } from '@orb-components';
import { OrbButtonComponent } from '@orb-components';
import { CommonModule } from '@angular/common';
import { ThemeService } from '@orb-services';

@Component({
  selector: 'orb-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    OrbTextInputComponent,
    OrbCardComponent,
    OrbButtonComponent,
    OrbScrollPanelComponent
  ],
  providers: [ThemeService],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private themeService = inject(ThemeService);
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });



  onSubmit(): void {
    if (this.form.valid) {
      console.log(this.form.value);
      // this.authStore.login(this.form.value);
    }
  }

  toggleTheme():void {
    this.themeService.toggleTheme();
  }
}
