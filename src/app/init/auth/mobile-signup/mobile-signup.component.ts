import { Component, inject, signal, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FirebaseAuthService } from '../../../firebase/firebase-auth.service';
import { ActionaryUtilService } from '../../../services/actionary-util.service';

@Component({
  selector: 'app-mobile-signup',
  standalone: false,
  templateUrl: './mobile-signup.component.html',
  styleUrl: './mobile-signup.component.scss'
})
export class MobileSignupComponent implements OnInit {
  showPassword = signal(false);
  signupForm!: FormGroup;
  loading = signal(false);

  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly firebaseService = inject(FirebaseAuthService);
  private readonly utilService = inject(ActionaryUtilService);

  ngOnInit(): void {
    this.signupForm = this.formBuilder.group(
      {
        fullName: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required, Validators.minLength(8)]]
      },
      { validators: this.passwordsMatchValidator }
    );
  }

  passwordsMatchValidator(group: AbstractControl): { [key: string]: boolean } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordsMismatch: true };
  }

  onSubmit(): void {
    if (!this.signupForm.valid) {
      this.signupForm.markAllAsTouched();
      return;
    }
    const { fullName, email, password } = this.signupForm.getRawValue();
    this.loading.set(true);
    this.firebaseService.createUser(email, fullName, password).subscribe({
      next: () => {
        this.loading.set(false);
        this.utilService.showSuccess('Account created. Please sign in.');
        this.router.navigate(['/home/auth/login']);
      },
      error: (err: { error?: string; message?: string }) => {
        this.loading.set(false);
        this.utilService.showError(err?.error ?? err?.message ?? 'Sign up failed');
      }
    });
  }

  togglePassword(): void {
    this.showPassword.set(!this.showPassword());
  }
}
