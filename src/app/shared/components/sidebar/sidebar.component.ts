import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthTokenService } from '../../../core/auth/auth-token.service';
import { SidebarService } from '../../services/sidebar.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-sidebar',
  standalone: false,
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  public tokenService = inject(AuthTokenService);
  public sidebarService = inject(SidebarService);
  public themeService = inject(ThemeService);
  private router = inject(Router);

  showUserMenu = signal(false);

  createNewNote(): void {
    this.router.navigate(['/publisher/editor', 'new']);
  }

  toggleUserMenu(): void {
    this.showUserMenu.update(v => !v);
  }

  closeUserMenu(): void {
    this.showUserMenu.set(false);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  logout(): void {
    this.showUserMenu.set(false);
    this.tokenService.clearSession();
    this.router.navigate(['/auth/login']);
  }
}
