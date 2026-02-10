import { inject, Injectable, signal } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, signOut, updateProfile, User, user } from '@angular/fire/auth';
import { from, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirebaseAuthService {
  readonly firbaseAuth = inject(Auth);
  user$ = user(this.firbaseAuth);

  currentUserSig: any = signal('');
  isUserLoggedIn = signal(false);

  /** Set when user changes name so profile and nav update immediately without waiting for auth state. */
  readonly displayNameOverride = signal<string | null>(null);

  createUser(email: string, username: string, password: string): Observable<void> {
    const promise = createUserWithEmailAndPassword(
      this.firbaseAuth, email, password
    ).then((res) => updateProfile(res.user, { displayName: username }))

    return from(promise);
  };

  signInWithFireBase(email: string, password: string): Promise<any> {
    return signInWithEmailAndPassword(this.firbaseAuth, email, password);
  }

  /** Send a password reset email to the given address. */
  sendPasswordResetEmail(email: string): Promise<void> {
    return sendPasswordResetEmail(this.firbaseAuth, email.trim());
  }

  signOut(): Promise<any> {
    this.displayNameOverride.set(null);
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
