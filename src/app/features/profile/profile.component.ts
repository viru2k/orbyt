import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { take } from 'rxjs';

// Store y DTOs
import { AuthStore } from '@orb-stores';
import { AdminUpdateUserDto } from '@orb-api/index';

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
    this.user$.pipe(take(1)).subscribe(user => {
      if (user) {
        this.profileForm.patchValue(user);
      }
    });
  }

  private initForm(): void {
    this.profileForm = this.fb.group({
        id: [''],
      fullName: ['', Validators.required],
      name: ['', Validators.required],
      lastName: ['', Validators.required],
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]] // El email no se puede editar
    }); 
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const updateDto: AdminUpdateUserDto = this.profileForm.getRawValue();
    this.authStore.patchUserProfile({id:this.profileForm.value.id, request:updateDto});
  }
}
