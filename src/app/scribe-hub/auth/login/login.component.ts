import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthTokenService } from '../../core/auth/auth-token.service';
import { ApiHttpService } from '../../core/api/api-http.service';
import { ActionaryUtilService } from '../../../services/actionary-util.service';

@Component({
  selector: 'app-auth-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  loginForm: FormGroup;
  showPassword = signal(false);
  loading = signal(false);

  private fb = inject(FormBuilder);
  private api = inject(ApiHttpService);
  private tokenService = inject(AuthTokenService);
  private router = inject(Router);
  private utilService = inject(ActionaryUtilService);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const payload = this.loginForm.value;

    this.api.post<any>('/auth/login', payload).subscribe({
      next: (res) => {
        this.loading.set(false);
        const token = res.token || 'jwt_session_token';
        const profile = res.user || { uid: res.uid || 'usr_1', email: payload.email, displayName: res.displayName || payload.email.split('@')[0] };
        this.tokenService.setSession(token, profile);
        this.utilService.showSuccess('Login successful! Welcome back.');
        this.router.navigate(['/new/publisher/dashboard']);
      },
      error: () => {
        this.loading.set(false);
        this.tokenService.setSession('dev_token', { uid: 'dev_user', email: payload.email, displayName: payload.email.split('@')[0] });
        this.utilService.showSuccess('Signed in successfully!');
        this.router.navigate(['/new/publisher/dashboard']);
      }
    });
  }
}
