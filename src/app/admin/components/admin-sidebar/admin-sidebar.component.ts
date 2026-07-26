import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthTokenService } from '../../../core/auth/auth-token.service';

@Component({
  selector: 'app-admin-sidebar',
  standalone: false,
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.scss'
})
export class AdminSidebarComponent {
  public tokenService = inject(AuthTokenService);
  private router = inject(Router);
  
  isCollapsed: boolean = true;

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  logout(): void {
    this.tokenService.clearSession();
    this.router.navigate(['/auth/login']);
  }
}
