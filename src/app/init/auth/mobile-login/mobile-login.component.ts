import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FirebaseAuthService } from '../../../firebase/firebase-auth.service';
import { ActionaryUtilService } from '../../../services/actionary-util.service';

@Component({
  selector: 'app-mobile-login',
  standalone: false,
  templateUrl: './mobile-login.component.html',
  styleUrl: './mobile-login.component.scss'
})
export class MobileLoginComponent implements OnInit {
  showPassword = signal(false);
  loginForm!: FormGroup;
  loading = signal(false);

  readonly showForgotPassword = signal(false);
  readonly forgotPasswordEmail = signal('');
  readonly forgotPasswordSent = signal(false);
  readonly forgotPasswordLoading = signal(false);
  readonly forgotPasswordError = signal<string | null>(null);

  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly firebaseAuthService = inject(FirebaseAuthService);
  private readonly utilService = inject(ActionaryUtilService);

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  onForgotPasswordClick(): void {
    this.forgotPasswordError.set(null);
    this.forgotPasswordSent.set(false);
    this.forgotPasswordEmail.set(this.loginForm.get('email')?.value ?? '');
    this.showForgotPassword.set(true);
  }

  onBackToLogin(): void {
    this.showForgotPassword.set(false);
    this.forgotPasswordSent.set(false);
    this.forgotPasswordError.set(null);
  }

  onSendResetEmail(): void {
    const email = this.forgotPasswordEmail().trim();
    if (!email) {
      this.forgotPasswordError.set('Please enter your email address');
      return;
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) {
      this.forgotPasswordError.set('Please enter a valid email address');
      return;
    }
    this.forgotPasswordError.set(null);
    this.forgotPasswordLoading.set(true);
    this.firebaseAuthService.sendPasswordResetEmail(email).then(
      () => {
        this.forgotPasswordLoading.set(false);
        this.forgotPasswordSent.set(true);
      },
      (err: { message?: string }) => {
        this.forgotPasswordLoading.set(false);
        this.forgotPasswordError.set(err?.message ?? 'Failed to send reset email. Check the email address.');
      }
    );
  }

  onSubmit(): void {
    if (!this.loginForm.valid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    const { email, password } = this.loginForm.getRawValue();
    this.loading.set(true);
    this.firebaseAuthService.signInWithFireBase(email, password).then(
      async (credential: { user: { getIdToken: () => Promise<string>; displayName: string | null; refreshToken: string; uid: string; email: string | null } }) => {
        const user = credential.user;
        const idToken = await user.getIdToken();
        sessionStorage.setItem('user', JSON.stringify({ uid: user.uid, email: user.email, displayName: user.displayName }));
        sessionStorage.setItem('email', JSON.stringify(email));
        sessionStorage.setItem('token', idToken);
        sessionStorage.setItem('displayName', user.displayName ?? '');
        sessionStorage.setItem('refreshToken', user.refreshToken ?? '');
        sessionStorage.setItem('localId', user.uid);
        this.firebaseAuthService.isUserLoggedIn.set(true);
        this.loading.set(false);
        this.router.navigate(['/expenses/list']);
      },
      (err: { message?: string }) => {
        this.loading.set(false);
        this.utilService.showError(err?.message ?? 'Login failed');
      }
    );
  }

  togglePassword(): void {
    this.showPassword.set(!this.showPassword());
  }
}
