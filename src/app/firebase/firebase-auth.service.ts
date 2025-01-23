import { inject, Injectable, signal } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, User, user } from '@angular/fire/auth';
import { from, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirebaseAuthService {
  readonly firbaseAuth = inject(Auth);
  user$ = user(this.firbaseAuth);

  currentUserSig: any = signal('');
  isUserLoggedIn = signal(false);

  createUser(email: string, username: string, password: string): Observable<void> {
    const promise = createUserWithEmailAndPassword(
      this.firbaseAuth, email, password
    ).then((res) => updateProfile(res.user, { displayName: username }))

    return from(promise);
  };

  signInWithFireBase(email: string, password: string): Promise<any> {
    return signInWithEmailAndPassword(this.firbaseAuth, email, password);
  }

  signOut(): Promise<any> {
    return signOut(this.firbaseAuth);
  }
}
