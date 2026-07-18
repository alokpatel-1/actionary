import { inject, Injectable, signal } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, signOut, updateProfile, User, user } from '@angular/fire/auth';
import { from, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { ActionaryUtilService } from '../services/actionary-util.service';

@Injectable({
  providedIn: 'root'
})
export class FirebaseAuthService {
  readonly firbaseAuth = inject(Auth);
  private readonly router = inject(Router);
  private readonly utilService = inject(ActionaryUtilService);

  user$ = user(this.firbaseAuth);

  currentUserSig: any = signal('');
  isUserLoggedIn = signal(false);

  /** Set when user changes name so profile and nav update immediately without waiting for auth state. */
  readonly displayNameOverride = signal<string | null>(null);

  constructor() {
    // Monitor session state changes
    this.user$.subscribe((u) => {
      if (u) {
        this.isUserLoggedIn.set(true);
      } else {
        const hadSession = typeof sessionStorage !== 'undefined' && (sessionStorage.getItem('token') || sessionStorage.getItem('email'));
        if (hadSession && !this.isUserLoggedIn()) {
          this.handleSessionExpired();
        }
      }
    });
  }

  handleSessionExpired(message?: string): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
    this.isUserLoggedIn.set(false);
    this.displayNameOverride.set(null);
    this.utilService.showError(message || 'Your session has expired. Please log in again to access your notes.');
    this.router.navigate(['/login']);
  }

  createUser(email: string, username: string, password: string): Observable<void> {
    const promise = createUserWithEmailAndPassword(
      this.firbaseAuth, email, password
    ).then((res) => updateProfile(res.user, { displayName: username }));

    return from(promise);
  }

  signInWithFireBase(email: string, password: string): Promise<any> {
    return signInWithEmailAndPassword(this.firbaseAuth, email, password);
  }

  /** Send a password reset email to the given address. */
  sendPasswordResetEmail(email: string): Promise<void> {
    return sendPasswordResetEmail(this.firbaseAuth, email.trim());
  }

  signOut(): Promise<any> {
    this.displayNameOverride.set(null);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
    this.isUserLoggedIn.set(false);
    return signOut(this.firbaseAuth);
  }

  /** Update the current user's display name (Firebase Auth + sessionStorage + override for immediate UI). */
  updateDisplayName(newDisplayName: string): Promise<void> {
    const u = this.firbaseAuth.currentUser;
    if (!u) return Promise.resolve();
    const name = newDisplayName.trim();
    return updateProfile(u, { displayName: name }).then(() => {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('displayName', name);
      }
      this.displayNameOverride.set(name);
    });
  }
}
