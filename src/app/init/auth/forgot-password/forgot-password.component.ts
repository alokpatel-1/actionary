import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FirebaseAuthService } from '../../../firebase/firebase-auth.service';
import { ActionaryUtilService } from '../../../services/actionary-util.service';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-forgot-password',
  standalone: false,
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent implements OnInit {
  resetForm!: FormGroup;
  emailSent = signal(false);
  sentEmail = signal('');

  private readonly formBuilder = inject(FormBuilder);
  private readonly firebaseAuthService = inject(FirebaseAuthService);
  private readonly utilService = inject(ActionaryUtilService);
  private readonly router = inject(Router);
  private readonly spinner = inject(NgxSpinnerService);

  ngOnInit() {
    this.resetForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.spinner.show();
    const email = this.resetForm.get('email')?.value;

    this.firebaseAuthService.sendPasswordResetEmail(email).then(
      () => {
        this.spinner.hide();
        this.emailSent.set(true);
        this.sentEmail.set(email);
        this.utilService.showSuccess('Password reset link sent to your email!');
      },
      (err) => {
        this.spinner.hide();
        this.utilService.showError(err?.message || 'Failed to send reset email. Please try again.');
      }
    );
  }

  onResend() {
    if (!this.sentEmail()) return;
    this.spinner.show();
    this.firebaseAuthService.sendPasswordResetEmail(this.sentEmail()).then(
      () => {
        this.spinner.hide();
        this.utilService.showSuccess('Reset email resent successfully!');
      },
      (err) => {
        this.spinner.hide();
        this.utilService.showError(err?.message || 'Failed to resend email.');
      }
    );
  }
}
