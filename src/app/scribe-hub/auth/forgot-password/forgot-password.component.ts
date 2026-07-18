import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiHttpService } from '../../core/api/api-http.service';
import { ActionaryUtilService } from '../../../services/actionary-util.service';

@Component({
  selector: 'app-auth-forgot-password',
  standalone: false,
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent {
  resetForm: FormGroup;
  sent = signal(false);
  sentEmail = signal('');

  private fb = inject(FormBuilder);
  private api = inject(ApiHttpService);
  private utilService = inject(ActionaryUtilService);

  constructor() {
    this.resetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    const email = this.resetForm.value.email;
    this.api.post('/auth/forgot-password', { email }).subscribe({
      next: () => {
        this.sentEmail.set(email);
        this.sent.set(true);
        this.utilService.showSuccess('Reset instructions sent to your email.');
      },
      error: () => {
        this.sentEmail.set(email);
        this.sent.set(true);
        this.utilService.showSuccess('Reset link sent!');
      }
    });
  }
}
