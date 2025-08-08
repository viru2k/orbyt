

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { filter, take } from 'rxjs';

// Store y DTOs
import { AuthStore } from '@orb-stores';


// Componentes Orb y PrimeNG
import { OrbCardComponent, OrbButtonComponent, OrbTextInputComponent, OrbFormFieldComponent, OrbFormFooterComponent } from '@orb-components';
import { FormButtonAction } from '@orb-models';

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
    OrbFormFooterComponent
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
  isEditMode = false;

  formButtons: FormButtonAction[] = [
    {
      label: 'Cancelar',
      action: 'cancel',
      severity: 'secondary',
      styleType: 'text'
    },
    {
      label: 'Guardar',
      action: 'save',
      severity: 'success',
      buttonType: 'submit'
    }
  ];

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

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    if (!this.isEditMode) {
      // Reset form when canceling edit mode
      this.user$.pipe(
        filter(user => !!user),
        take(1)
      ).subscribe(user => {
        this.profileForm.patchValue(user!);
      });
    }
  }

  handleFormAction(action: string): void {
    if (action === 'save') {
      this.onSubmit();
    } else if (action === 'cancel') {
      this.toggleEditMode();
    }
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    // TODO: Implement profile update
    // const updateDto: UpdateProfileDto = this.profileForm.getRawValue();
    // this.authStore.patchUserProfile(updateDto);
    
    console.log('Profile update:', this.profileForm.getRawValue());
    this.isEditMode = false;
  }
}
