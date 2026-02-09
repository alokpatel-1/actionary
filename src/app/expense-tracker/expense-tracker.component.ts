import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ExpenseSyncService } from './services/expense-sync.service';
import { ExpenseIdbService } from './services/expense-idb.service';
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
  private idb = inject(ExpenseIdbService);
  private auth = inject(Auth);

  unsyncedCount = signal(0);
  syncInProgress = signal(false);

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
    { label: 'Summary', url: 'summary', icon: 'pi pi-chart-bar' }
  ];
  navItemsRight = [
    { label: 'Settings', url: 'settings', icon: 'pi pi-cog' },
    { label: 'Profile', url: 'profile', icon: 'pi pi-user' }
  ];

  ngOnInit(): void {
    this.refreshUnsyncedCount();
    this.syncService.tryAutoSync();
  }

  refreshUnsyncedCount(): void {
    this.idb.getUnsyncedCount().then((c) => this.unsyncedCount.set(c));
  }

  syncNow(): void {
    if (this.syncInProgress()) return;
    this.syncInProgress.set(true);
    this.syncService.sync().subscribe({
      next: (r) => {
        this.syncInProgress.set(false);
        if (r.success) this.refreshUnsyncedCount();
      },
      error: () => this.syncInProgress.set(false)
    });
  }
}
