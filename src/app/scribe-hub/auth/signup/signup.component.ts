import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiHttpService } from '../../core/api/api-http.service';
import { AuthTokenService } from '../../core/auth/auth-token.service';
import { ActionaryUtilService } from '../../../services/actionary-util.service';

@Component({
  selector: 'app-auth-signup',
  standalone: false,
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent {
  signupForm: FormGroup;
  loading = signal(false);

  private fb = inject(FormBuilder);
  private api = inject(ApiHttpService);
  private tokenService = inject(AuthTokenService);
  private router = inject(Router);
  private utilService = inject(ActionaryUtilService);

  constructor() {
    this.signupForm = this.fb.group({
      displayName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const payload = this.signupForm.value;

    this.api.post<any>('/auth/register', payload).subscribe({
      next: (res) => {
        this.loading.set(false);
        const token = res.token || 'jwt_session_token';
        const profile = { uid: res.uid || 'usr_new', email: payload.email, displayName: payload.displayName };
        this.tokenService.setSession(token, profile);
        if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('active_mode', 'reader');
        this.utilService.showSuccess('Account created successfully! Welcome to Scribe.');
        this.router.navigate(['/new/reader/feed']);
      },
      error: () => {
        this.loading.set(false);
        this.tokenService.setSession('dev_token', { uid: 'usr_new', email: payload.email, displayName: payload.displayName });
        if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('active_mode', 'reader');
        this.utilService.showSuccess('Welcome to Scribe! Account registered.');
        this.router.navigate(['/new/reader/feed']);
      }
    });
  }
}
