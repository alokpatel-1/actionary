import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ExpenseSyncService } from './services/expense-sync.service';
import { CommonModule } from '@angular/common';
import { Auth, user } from '@angular/fire/auth';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-expense-tracker',
  standalone: false,
  templateUrl: './expense-tracker.component.html',
  styleUrl: './expense-tracker.component.scss'
})
export class ExpenseTrackerComponent implements OnInit {
  readonly syncService = inject(ExpenseSyncService);
  private auth = inject(Auth);

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
  readonly photoURL = computed(() => this.firebaseUser()?.photoURL ?? null);
  readonly avatarLetter = computed(() => {
    const name = this.displayName();
    return (name?.trim().charAt(0) || 'G').toUpperCase();
  });

  navItemsLeft = [
    { label: 'Expenses', url: 'list', icon: 'pi pi-home' },
  ];
  navItemsRight = [
    { label: 'Summary', url: 'summary', icon: 'pi pi-chart-bar' }
  ];

  ngOnInit(): void {
    this.syncService.tryAutoSync();
  }
}
