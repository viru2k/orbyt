

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { filter, take } from 'rxjs';

// Store y DTOs
import { AuthStore } from '@orb-stores';


// Componentes Orb y PrimeNG
import { OrbCardComponent, OrbButtonComponent, OrbTextInputComponent, OrbFormFieldComponent } from '@orb-components';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { FieldsetModule } from 'primeng/fieldset';
import { ChipModule } from 'primeng/chip';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AsyncPipe,
    OrbCardComponent,
    OrbButtonComponent,
    OrbTextInputComponent,
    OrbFormFieldComponent,
    AvatarModule,
    TagModule,
    FieldsetModule,
    ChipModule
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  authStore = inject(AuthStore);
  private fb = inject(FormBuilder);

  // Observables del store
  user$ = this.authStore.user$;
  loading$ = this.authStore.loading$;
  userInitials$ = this.authStore.userInitials$;

  profileForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    // Suscripción única para rellenar el formulario cuando el usuario esté disponible
    this.user$.pipe(
      filter(user => !!user), // Nos aseguramos de que el usuario no sea nulo
      take(1)
    ).subscribe(user => {
      this.profileForm.patchValue(user!);
    });
  }

  private initForm(): void {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      lastName: ['', Validators.required],
      // El email no se puede editar, por eso está deshabilitado
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

  //  const updateDto: UpdateProfileDto = this.profileForm.getRawValue();
    //this.authStore.patchUserProfile(updateDto);
  }
}
