import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { ActionaryUtilService } from '../../../services/actionary-util.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sign-in',
  standalone: false,
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.scss'
})
export class SignInComponent implements OnInit {
  showpassword = signal(false);
  loginForm!: FormGroup;

  private readonly formBuilder = inject(FormBuilder);
  private readonly utilService = inject(ActionaryUtilService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);


  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  onSubmit() {
    if (!this.loginForm.valid) {
      this.loginForm.markAllAsTouched();
      return;
    };

    const payload = this.loginForm.value; // Directly use the form values as the payload
    this.authService.loginUser(payload).subscribe({
      next: (response) => {
        console.log('User logged in successfully:', response);
        const user = response.user[0]; // Assuming the user object is in the "user" array
        const accessToken = response.accessToken;
        const refreshToken = response.refreshToken;

        // Save user data and tokens to sessionStorage
        sessionStorage.setItem('user', JSON.stringify(user));
        sessionStorage.setItem('token', accessToken);
        sessionStorage.setItem('refreshToken', refreshToken);

        console.log('User logged in successfully:', user);

        // Redirect to dashboard after successful login
        this.router.navigate(['/user']);
        // Handle successful login (e.g., store token, redirect)
      },
      error: ({ error }) => {
        console.error('Login failed:', error.error);
        this.utilService.showError(error.error);
        // Handle login error (e.g., show an error message)
      },
    });
  }

  changePasswordVisibilityType() {
    this.showpassword.set(!this.showpassword());
  }
}
