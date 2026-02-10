import { Component, inject, computed, signal } from '@angular/core';
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
    const override = this.firebaseAuthService.displayNameOverride();
    if (override) return override;
    if (typeof sessionStorage !== 'undefined') {
      const name = sessionStorage.getItem('displayName');
      if (name) return name;
    }
    const u = this.firebaseUser();
    if (u?.displayName) return u.displayName;
    return 'Guest';
  });
  readonly email = computed(() => this.firebaseUser()?.email ?? null);
  readonly photoURL = computed(() => this.firebaseUser()?.photoURL ?? null);
  readonly avatarLetter = computed(() => {
    const name = this.displayName();
    return (name?.trim().charAt(0) || 'G').toUpperCase();
  });

  readonly editingName = signal(false);
  readonly editNameValue = signal('');
  readonly savingName = signal(false);
  readonly nameError = signal<string | null>(null);

  startEditName(): void {
    this.nameError.set(null);
    this.editNameValue.set(this.displayName());
    this.editingName.set(true);
  }

  cancelEditName(): void {
    this.editingName.set(false);
    this.nameError.set(null);
  }

  saveName(): void {
    const value = this.editNameValue().trim();
    if (!value) {
      this.nameError.set('Name cannot be empty');
      return;
    }
    this.nameError.set(null);
    this.savingName.set(true);
    this.firebaseAuthService.updateDisplayName(value).then(() => {
      this.savingName.set(false);
      this.editingName.set(false);
    }).catch((err) => {
      this.savingName.set(false);
      this.nameError.set(err?.message ?? 'Failed to update name');
    });
  }

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
