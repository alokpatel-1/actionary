import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-sign-in',
  imports: [],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.scss'
})
export class SignInComponent {
  showpassword = signal(false);


  changePasswordVisibilityType() {
    this.showpassword.set(!this.showpassword());
  }
}
