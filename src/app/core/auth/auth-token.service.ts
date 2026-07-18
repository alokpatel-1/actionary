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

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('auth_token', token);
      sessionStorage.setItem('email', profile.email);
      sessionStorage.setItem('displayName', profile.displayName);
      sessionStorage.setItem('localId', profile.uid);
      sessionStorage.setItem('user_profile', JSON.stringify(profile));
    }
  }

  clearSession(): void {
    this.currentToken.set(null);
    this.currentUserProfile.set(null);

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('user_profile');
      sessionStorage.clear();
    }
  }

  private getStoredToken(): string | null {
    if (typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem('auth_token') || null;
    }
    return null;
  }

  private getStoredProfile(): UserSessionProfile | null {
    if (typeof sessionStorage !== 'undefined') {
      const raw = sessionStorage.getItem('user_profile');
      if (raw) {
        try { return JSON.parse(raw); } catch (e) { return null; }
      }
      const email = sessionStorage.getItem('email')?.replace(/"/g, '');
      const uid = sessionStorage.getItem('localId')?.replace(/"/g, '');
      const displayName = sessionStorage.getItem('displayName')?.replace(/"/g, '') || 'User';
      if (email || uid) {
        return { uid: uid || 'user_local', email: email || '', displayName };
      }
    }
    return null;
  }
}
