import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { ActionaryUtilService } from '../../../services/actionary-util.service';
import { Router } from '@angular/router';
import { FirebaseAuthService } from '../../../firebase/firebase-auth.service';
import { NgxSpinnerService } from 'ngx-spinner';

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
  private readonly firebaseAuthService = inject(FirebaseAuthService);
  private readonly spinner = inject(NgxSpinnerService);


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

    this.spinner.show();
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
        this.spinner.hide();

        // Redirect to new note after successful login
        this.router.navigate(['/library']);
      },
      error: ({ error }) => {
        console.error('Login failed:', error.error);
        this.spinner.hide();
        this.utilService.showError(error.error);
        // Handle login error (e.g., show an error message)
      },
    });
  }

  changePasswordVisibilityType() {
    this.showpassword.set(!this.showpassword());
  }

  onLoginWithFirebase() {
    if (!this.loginForm.valid) {
      this.loginForm.markAllAsTouched();
      return;
    };

    this.spinner.show();
    const { email, password } = this.loginForm.getRawValue();
    this.firebaseAuthService.signInWithFireBase(email, password).then(
      async (response) => {
        const user = response.user;
        const idToken = await user.getIdToken();

        // Save user data and tokens to sessionStorage
        sessionStorage.setItem('user', JSON.stringify({ uid: user.uid, email: user.email, displayName: user.displayName }));
        sessionStorage.setItem('email', JSON.stringify(email));
        sessionStorage.setItem('token', idToken);
        sessionStorage.setItem('displayName', user.displayName ?? '');
        sessionStorage.setItem('refreshToken', user.refreshToken ?? '');
        sessionStorage.setItem('localId', user.uid);

        this.firebaseAuthService.isUserLoggedIn.set(true);
        this.spinner.hide();
        // Redirect to new note after successful login
        this.router.navigate(['/library']);
      },
      (err) => {
        console.log('Login failed:', err);
        this.spinner.hide();
        this.utilService.showError(err?.message ?? 'Login failed');
        // Handle login error (e.g., show an error message)
      },
    );
  }
}
