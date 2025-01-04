import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ImportsModule } from '../../../imports';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { ActionaryUtilService } from '../../../services/actionary-util.service';

@Component({
  selector: 'app-sign-up',
  standalone: false,
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.scss'
})
export class SignUpComponent implements OnInit {
  signupForm!: FormGroup;

  readonly fornbuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly utilService = inject(ActionaryUtilService);

  showpassword = signal(true);

  ngOnInit(): void {
    this.initForm();
  };

  initForm() {
    this.signupForm = this.fornbuilder.group({
      fullName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(8)]],
    }, { validator: this.passwordsMatchValidator })
  };

  passwordsMatchValidator(group: AbstractControl): { [key: string]: boolean } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    return password === confirmPassword ? null : { passwordsMismatch: true };
  }

  onSignUp() {
    if (!this.signupForm.valid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    const payload = this.createApiPayload(this.signupForm.value);
    this.authService.registerUser(payload).subscribe({
      next: (response) => {
        this.utilService.showSuccess('User registered successfully:');
      },
      error: (error) => {
        this.utilService.showError(error.message);
      },
    });

  };

  createApiPayload(formValue: any): any {
    const [firstName, lastName] = formValue.fullName.split(" ");
    return {
      firstName: firstName || "",
      lastName: lastName || "",
      password: formValue.password,
      email: formValue.email
    };
  }

  changePasswordVisibilityType() {
    this.showpassword.set(!this.showpassword());
  }
}
