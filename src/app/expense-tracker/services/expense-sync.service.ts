import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ExpenseIdbService } from './expense-idb.service';
import { Expense } from '../models/expense.model';
import { Auth, user } from '@angular/fire/auth';
import { Firestore, collection, doc, getDocs, setDoc, deleteDoc } from '@angular/fire/firestore';
import { map, take } from 'rxjs/operators';
import { from, Observable, of, Subject } from 'rxjs';

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

  /** Emits after a successful sync so list/history/summary can reload data. */
  readonly syncCompleted$ = new Subject<void>();

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
   * Delete expense from Firestore so the deletion syncs to other devices.
   * Call after removing from local IDB. No-op if not authenticated or offline.
   */
  deleteRemote(id: string): Observable<{ success: boolean; error?: string }> {
    const remoteCol = this.userCollectionRef();
    if (!remoteCol) return of({ success: false, error: 'Not authenticated' });
    if (!this.isOnline()) return of({ success: false, error: 'Offline' });
    return from(
      (async () => {
        try {
          await deleteDoc(doc(remoteCol, id));
          return { success: true };
        } catch (err: any) {
          return { success: false, error: err?.message ?? String(err) };
        }
      })()
    );
  }

  /**
   * Manual sync: upload unsynced, fetch remote, merge by updatedAt (latest wins).
   * Removes from local any expense that was synced but no longer exists on remote (deletion sync).
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
    const uid = this.auth.currentUser?.uid;
    if (!uid) return { success: false, error: 'Not authenticated' };

    try {
      // 1. Upload all records where synced = false (current user only)
      const allUnsynced = await this.idb.getUnsynced();
      const unsynced = allUnsynced.filter((e) => e.userId === uid);
      for (const e of unsynced) {
        const d = doc(remoteCol, e.id);
        await setDoc(d, { ...e });
      }

      // 2. Fetch remote records
      const remoteSnap = await getDocs(remoteCol);
      const remoteList: Expense[] = remoteSnap.docs.map((d) => ({ ...d.data(), id: d.id } as Expense));

      // 3. Merge: latest updatedAt wins; only current user's local data
      const remoteIds = new Set(remoteList.map((e) => e.id));
      const allLocal = await this.idb.getAll();
      const localList = allLocal.filter((e) => e.userId === uid);
      const byId = new Map<string, Expense>();
      localList.forEach((e) => byId.set(e.id, e));
      remoteList.forEach((e) => {
        const existing = byId.get(e.id);
        const withUser = { ...e, userId: e.userId ?? uid, synced: true };
        if (!existing || e.updatedAt >= existing.updatedAt) {
          byId.set(e.id, withUser);
        } else {
          byId.set(e.id, { ...existing, synced: true });
        }
      });
      // Remove local records that were synced but deleted on server
      const merged = Array.from(byId.values()).filter(
        (e) => remoteIds.has(e.id) || e.synced === false
      );
      // Write merged back: putAll only adds/updates; we must also delete removed ids from IDB
      const mergedIds = new Set(merged.map((e) => e.id));
      for (const e of localList) {
        if (e.synced && !mergedIds.has(e.id)) await this.idb.delete(e.id);
      }
      await this.idb.putAll(merged);

      // 4. Update last sync time and notify listeners to refresh
      this.lastSyncTimestamp.set(Date.now());
      this.syncStatus.set('completed');
      this.syncCompleted$.next();
      return { success: true };
    } catch (err: any) {
      const message = err?.message || String(err);
      this.syncError.set(message);
      this.syncStatus.set('failed');
      return { success: false, error: message };
    }
  }
}
