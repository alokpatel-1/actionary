import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth, user } from '@angular/fire/auth';
import { toSignal } from '@angular/core/rxjs-interop';
import { FirebaseAuthService } from '../../../firebase/firebase-auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-expense-profile',
  standalone: false,
  templateUrl: './expense-profile.component.html',
  styleUrl: './expense-profile.component.scss'
})
export class ExpenseProfileComponent {
  private auth = inject(Auth);
  private firebaseAuthService = inject(FirebaseAuthService);
  private router = inject(Router);

  readonly firebaseUser = toSignal(user(this.auth), { initialValue: null });
  readonly displayName = computed(() => {
    const u = this.firebaseUser();
    if (u?.displayName) return u.displayName;
    if (typeof sessionStorage !== 'undefined') {
      const name = sessionStorage.getItem('displayName');
      if (name) return name;
    }
    return 'Guest';
  });
  readonly email = computed(() => this.firebaseUser()?.email ?? null);
  readonly photoURL = computed(() => this.firebaseUser()?.photoURL ?? null);
  readonly avatarLetter = computed(() => {
    const name = this.displayName();
    return (name?.trim().charAt(0) || 'G').toUpperCase();
  });

  signOut(): void {
    this.firebaseAuthService.signOut().then(() => {
      this.firebaseAuthService.isUserLoggedIn.set(false);
      sessionStorage.clear();
      localStorage.clear();
      this.router.navigate(['/']);
    }).catch(() => {
      this.firebaseAuthService.isUserLoggedIn.set(false);
    });
  }
}
