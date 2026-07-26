import { Injectable, signal, computed } from '@angular/core';

export interface UserSessionProfile {
  uid: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthTokenService {
  readonly currentToken = signal<string | null>(this.getStoredToken());
  readonly currentUserProfile = signal<UserSessionProfile | null>(this.getStoredProfile());

  readonly isAuthenticated = computed(() => !!this.currentToken() || !!this.currentUserProfile());
  readonly userDisplayName = computed(() => this.currentUserProfile()?.displayName || 'User');
  readonly userEmail = computed(() => this.currentUserProfile()?.email || '');

  setSession(token: string, profile: UserSessionProfile): void {
    this.currentToken.set(token);
    this.currentUserProfile.set(profile);

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('email', profile.email);
      localStorage.setItem('displayName', profile.displayName);
      localStorage.setItem('localId', profile.uid);
      localStorage.setItem('user_profile', JSON.stringify(profile));
    }
  }

  clearSession(): void {
    this.currentToken.set(null);
    this.currentUserProfile.set(null);

    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_profile');
      localStorage.removeItem('email');
      localStorage.removeItem('displayName');
      localStorage.removeItem('localId');
    }
  }

  private getStoredToken(): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('auth_token') || null;
    }
    return null;
  }

  private getStoredProfile(): UserSessionProfile | null {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem('user_profile');
      if (raw) {
        try { return JSON.parse(raw); } catch (e) { return null; }
      }
      const email = localStorage.getItem('email')?.replace(/"/g, '');
      const uid = localStorage.getItem('localId')?.replace(/"/g, '');
      const displayName = localStorage.getItem('displayName')?.replace(/"/g, '') || 'User';
      if (email || uid) {
        return { uid: uid || 'user_local', email: email || '', displayName };
      }
    }
    return null;
  }
}
