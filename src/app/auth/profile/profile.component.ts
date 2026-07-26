import { Component, inject, signal } from '@angular/core';
import { AuthTokenService } from '../../core/auth/auth-token.service';
import { Router } from '@angular/router';
import { ActionaryUtilService } from '../../services/actionary-util.service';
import { SidebarService } from '../../shared/services/sidebar.service';

export type ProfileTab = 'general' | 'security' | 'social';

@Component({
  selector: 'app-auth-profile',
  standalone: false,
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {
  public tokenService = inject(AuthTokenService);
  public sidebarService = inject(SidebarService);
  private router = inject(Router);
  private utilService = inject(ActionaryUtilService);

  activeTab = signal<ProfileTab>('general');

  // Profile Form Signals
  displayName = signal(this.tokenService.userDisplayName());
  email = signal(this.tokenService.userEmail() || 'user@scribe.app');
  bio = signal('Full-stack software engineer & technical writer sharing insights on Web Dev, TypeScript, and Distributed Systems.');
  isSaving = signal(false);

  // Social Links Signals
  twitterLink = signal('https://twitter.com/eadvp97');
  githubLink = signal('https://github.com/eadvp97');
  linkedinLink = signal('https://linkedin.com/in/eadvp97');
  websiteLink = signal('https://alokpatel.dev');
  isSavingSocial = signal(false);

  // Change Password Signals & Eye Visibility Toggles
  currentPassword = signal('');
  newPassword = signal('');
  confirmPassword = signal('');
  showCurrentPassword = signal(false);
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);
  isChangingPassword = signal(false);

  // Delete Account Confirmation Modal State
  showDeleteAccountModal = signal(false);

  setTab(tab: ProfileTab): void {
    this.activeTab.set(tab);
  }

  toggleCurrentPassword(): void {
    this.showCurrentPassword.update(v => !v);
  }

  toggleNewPassword(): void {
    this.showNewPassword.update(v => !v);
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.update(v => !v);
  }

  saveProfile(): void {
    this.isSaving.set(true);
    setTimeout(() => {
      this.isSaving.set(false);
      this.utilService.showSuccess('Profile updated successfully!');
    }, 600);
  }

  saveSocialProfile(): void {
    this.isSavingSocial.set(true);
    setTimeout(() => {
      this.isSavingSocial.set(false);
      this.utilService.showSuccess('Social links updated successfully!');
    }, 600);
  }

  changePassword(): void {
    if (!this.currentPassword() || !this.newPassword()) {
      this.utilService.showError('Please fill in current and new passwords.');
      return;
    }
    if (this.newPassword() !== this.confirmPassword()) {
      this.utilService.showError('New passwords do not match!');
      return;
    }

    this.isChangingPassword.set(true);
    setTimeout(() => {
      this.isChangingPassword.set(false);
      this.currentPassword.set('');
      this.newPassword.set('');
      this.confirmPassword.set('');
      this.utilService.showSuccess('Password changed successfully!');
    }, 700);
  }

  openDeleteAccountModal(): void {
    this.showDeleteAccountModal.set(true);
  }

  closeDeleteAccountModal(): void {
    this.showDeleteAccountModal.set(false);
  }

  confirmDeleteAccount(): void {
    this.showDeleteAccountModal.set(false);
    this.tokenService.clearSession();
    this.utilService.showSuccess('Account permanently deleted.');
    this.router.navigate(['/auth/signup']);
  }

  logout(): void {
    this.tokenService.clearSession();
    this.utilService.showSuccess('Logged out successfully.');
    this.router.navigate(['/auth/login']);
  }
}
