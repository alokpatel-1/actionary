import { Component, inject } from '@angular/core';
import { AuthTokenService } from '../../core/auth/auth-token.service';
import { Router } from '@angular/router';
import { ActionaryUtilService } from '../../../services/actionary-util.service';

@Component({
  selector: 'app-auth-profile',
  standalone: false,
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {
  public tokenService = inject(AuthTokenService);
  private router = inject(Router);
  private utilService = inject(ActionaryUtilService);

  logout(): void {
    this.tokenService.clearSession();
    this.utilService.showSuccess('Logged out successfully.');
    this.router.navigate(['/new/auth/login']);
  }
}
