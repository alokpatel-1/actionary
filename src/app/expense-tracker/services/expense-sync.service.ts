import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ExpenseIdbService } from './expense-idb.service';
import { Expense } from '../models/expense.model';
import { Auth, user } from '@angular/fire/auth';
import { Firestore, collection, doc, getDocs, setDoc } from '@angular/fire/firestore';
import { map, take } from 'rxjs/operators';
import { from, Observable, of } from 'rxjs';

const EXPENSES_COLLECTION = 'expenses';

export type SyncStatus = 'idle' | 'started' | 'completed' | 'failed';

@Injectable({
  providedIn: 'root'
})
export class ExpenseSyncService {
  private idb = inject(ExpenseIdbService);
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private platformId = inject(PLATFORM_ID);

  private userCollectionRef() {
    const uid = this.auth.currentUser?.uid;
    if (!uid) return null;
    return collection(this.firestore, 'users', uid, EXPENSES_COLLECTION);
  }

  /** Sync state for UI */
  syncStatus = signal<SyncStatus>('idle');
  lastSyncTimestamp = signal<number | null>(null);
  syncError = signal<string | null>(null);
  isOnline = signal(typeof navigator !== 'undefined' ? navigator.onLine : true);

  constructor() {
    if (isPlatformBrowser(this.platformId) && typeof window !== 'undefined') {
      window.addEventListener('online', () => this.isOnline.set(true));
      window.addEventListener('offline', () => this.isOnline.set(false));
    }
  }

  isAuthenticated$(): Observable<boolean> {
    return user(this.auth).pipe(
      map((u) => !!u),
      take(1)
    );
  }

  /** Trigger automatic sync when authenticated and online. Non-blocking. */
  tryAutoSync(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.isAuthenticated$().subscribe((auth) => {
      if (auth && this.isOnline()) {
        this.sync().subscribe();
      }
    });
  }

  /**
   * Manual sync: upload unsynced, fetch remote, merge by updatedAt (latest wins), update synced flags.
   * Never deletes local data.
   */
  sync(): Observable<{ success: boolean; error?: string }> {
    const remoteCol = this.userCollectionRef();
    if (!remoteCol) {
      return of({ success: false, error: 'Not authenticated' });
    }
    if (!this.isOnline()) {
      return of({ success: false, error: 'Offline' });
    }

    this.syncStatus.set('started');
    this.syncError.set(null);

    return from(this.runSync(remoteCol));
  }

  private async runSync(remoteCol: ReturnType<typeof collection>): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Upload all records where synced = false
      const unsynced = await this.idb.getUnsynced();
      for (const e of unsynced) {
        const d = doc(remoteCol, e.id);
        await setDoc(d, { ...e });
      }

      // 2. Fetch remote records
      const remoteSnap = await getDocs(remoteCol);
      const remoteList: Expense[] = remoteSnap.docs.map((d) => ({ ...d.data(), id: d.id } as Expense));

      // 3. Merge into IndexedDB: latest updatedAt wins
      const localList = await this.idb.getAll();
      const byId = new Map<string, Expense>();
      localList.forEach((e) => byId.set(e.id, e));
      remoteList.forEach((e) => {
        const existing = byId.get(e.id);
        if (!existing || e.updatedAt >= existing.updatedAt) {
          byId.set(e.id, { ...e, synced: true });
        } else {
          byId.set(e.id, { ...existing, synced: true });
        }
      });

      const merged = Array.from(byId.values());
      await this.idb.putAll(merged);

      // 4. Update last sync time
      this.lastSyncTimestamp.set(Date.now());
      this.syncStatus.set('completed');
      return { success: true };
    } catch (err: any) {
      const message = err?.message || String(err);
      this.syncError.set(message);
      this.syncStatus.set('failed');
      return { success: false, error: message };
    }
  }
}
