import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ImportsModule } from '../../../imports';

@Component({
  selector: 'app-sign-up',
  standalone: false,
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.scss'
})
export class SignUpComponent {
  showpassword = signal(false);


  changePasswordVisibilityType() {
    this.showpassword.set(!this.showpassword());
  }
}
