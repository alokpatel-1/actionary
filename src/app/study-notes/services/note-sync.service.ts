import { Injectable, inject, signal } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore, collection, doc, setDoc, deleteDoc, getDocs } from '@angular/fire/firestore';
import { NoteIdbService } from './note-idb.service';
import { Note, NoteFolder, DEFAULT_FOLDERS, normalizeIcon } from '../models/note.model';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NoteSyncService {
  private idb = inject(NoteIdbService);
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  readonly isOnline = signal(typeof navigator !== 'undefined' ? navigator.onLine : true);
  readonly syncStatus = signal<'idle' | 'started' | 'completed' | 'failed'>('idle');
  readonly lastSyncTimestamp = signal<number | null>(null);
  readonly syncError = signal<string | null>(null);

  /** Debounce gate: prevent overlapping auto-sync calls */
  private autoSyncTimer: any = null;
  private isSyncing = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline.set(true);
        this.tryAutoSync();
      });
      window.addEventListener('offline', () => this.isOnline.set(false));
    }
  }

  private get uid(): string | null {
    return this.auth.currentUser?.uid ??
      (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('localId') : null);
  }

  private get notesCollection() {
    const uid = this.uid;
    if (!uid) return null;
    return collection(this.firestore, `users/${uid}/studyNotes`);
  }

  private get foldersCollection() {
    const uid = this.uid;
    if (!uid) return null;
    return collection(this.firestore, `users/${uid}/studyFolders`);
  }

  /**
   * Schedules a debounced background sync.
   * Multiple rapid calls (e.g., from addNote/updateNote/togglePin) collapse into one sync.
   * Does NOT show the sync status loader — it runs silently in the background.
   */
  tryAutoSync(): void {
    if (!this.isOnline() || !this.uid) return;
    if (this.autoSyncTimer) clearTimeout(this.autoSyncTimer);
    this.autoSyncTimer = setTimeout(() => {
      this.autoSyncTimer = null;
      if (!this.isSyncing) {
        this.syncSilent().subscribe();
      }
    }, 2000);
  }

  /**
   * Silent background sync — does not update syncStatus signal (no loader shown).
   * Used for auto-save and periodic syncs.
   */
  private syncSilent(): Observable<{ success: boolean }> {
    if (!this.isOnline() || !this.uid) return of({ success: false });
    this.isSyncing = true;
    return from(this.performSync()).pipe(
      map(() => {
        this.isSyncing = false;
        this.lastSyncTimestamp.set(Date.now());
        // Trigger completed so UI refreshes data, but only briefly
        this.syncStatus.set('completed');
        return { success: true };
      }),
      catchError(err => {
        this.isSyncing = false;
        console.error('[Notes Sync]', err);
        return of({ success: false });
      })
    );
  }

  /**
   * Manual sync — shows the floating sync card loader.
   * Used when the user clicks the Save button.
   */
  sync(): Observable<{ success: boolean }> {
    if (!this.isOnline() || !this.uid) {
      return of({ success: false });
    }

    if (this.isSyncing) {
      return of({ success: false });
    }

    this.isSyncing = true;
    this.syncStatus.set('started');
    this.syncError.set(null);

    const syncWithMinDuration = Promise.all([
      this.performSync(),
      new Promise(resolve => setTimeout(resolve, 800))
    ]);

    return from(syncWithMinDuration).pipe(
      map(() => {
        this.isSyncing = false;
        this.syncStatus.set('completed');
        this.lastSyncTimestamp.set(Date.now());
        return { success: true };
      }),
      catchError(err => {
        this.isSyncing = false;
        this.syncStatus.set('failed');
        this.syncError.set(err?.message || 'Sync failed');
        return of({ success: false });
      })
    );
  }

  private async performSync(): Promise<void> {
    const col = this.notesCollection;
    const foldCol = this.foldersCollection;
    if (!col) return;

    // ══════════════════════════════════════════
    // STEP 1: Fetch current remote state FIRST
    // ══════════════════════════════════════════
    const [noteSnapshot, foldSnapshot] = await Promise.all([
      getDocs(col),
      foldCol ? getDocs(foldCol) : Promise.resolve(null)
    ]);

    const remoteNotes = noteSnapshot.docs.map(d => d.data() as Omit<Note, 'synced'>);
    const remoteNoteIds = new Set(remoteNotes.map(n => n.id));

    const remoteFolders = foldSnapshot
      ? foldSnapshot.docs.map(d => d.data() as NoteFolder)
      : [];
    const remoteFolderIds = new Set(remoteFolders.map(f => f.id));

    // ══════════════════════════════════════════
    // STEP 2: Sync Folders
    // ══════════════════════════════════════════
    if (foldCol) {
      const localFolders = await this.idb.getAllFolders();
      const systemIds = new Set(DEFAULT_FOLDERS.map(f => f.id));
      const customLocalFolders = localFolders.filter(f => !systemIds.has(f.id));

      // 2a. Remove local custom folders that were PREVIOUSLY SYNCED but are now gone from Firestore
      //     (= deleted on another device). Skip folders with synced===false — they are newly
      //     created locally and haven't been pushed yet. Deleting them here would be wrong.
      for (const folder of customLocalFolders) {
        if (folder.synced === true && !remoteFolderIds.has(folder.id)) {
          const folderNotes = await this.idb.getNotesByFolder(folder.id);
          for (const note of folderNotes) {
            note.folderId = '__uncategorized__';
            note.updatedAt = Date.now();
            note.synced = false;
            await this.idb.addNote(note);
          }
          await this.idb.deleteFolder(folder.id);
        }
      }

      // 2b. Merge all remote folders into local IndexedDB (normalise icons on the way in)
      for (const folder of remoteFolders) {
        await this.idb.putFolder({ ...folder, synced: true, icon: normalizeIcon(folder.icon) });
      }

      // 2c. Push ALL local custom folders to Firestore (both new and existing)
      //     Mark each as synced:true in IDB after a successful push.
      const activeFolders = await this.idb.getAllFolders();
      for (const folder of activeFolders) {
        if (!systemIds.has(folder.id)) {
          const { synced: _s, ...folderData } = folder as any;
          const docRef = doc(foldCol, folder.id);
          await setDoc(docRef, folderData, { merge: true });
          // Mark as synced in local IDB
          await this.idb.putFolder({ ...folder, synced: true });
        }
      }
    }

    // ══════════════════════════════════════════
    // STEP 3: Push local unsynced notes to Firestore
    // IMPORTANT: Skip notes that are ABSENT from remote (permanently deleted remotely)
    //            to prevent resurrecting them.
    // ══════════════════════════════════════════
    const unsynced = await this.idb.getUnsynced();
    for (const note of unsynced) {
      // If this note doesn't exist on Firestore AND it's a deletion (isDeleted: true),
      // it was permanently deleted from another device — remove it locally too.
      if (!remoteNoteIds.has(note.id) && note.isDeleted) {
        await this.idb.deleteNote(note.id);
        continue;
      }

      const docRef = doc(col, note.id);
      const { synced, ...data } = note;
      await setDoc(docRef, data, { merge: true });
      note.synced = true;
      await this.idb.addNote(note);
    }

    // ══════════════════════════════════════════
    // STEP 4: Delete local notes that no longer exist on Firestore
    // Only applies to notes that were previously synced (synced === true),
    // because locally-created notes that haven't synced yet won't be on Firestore.
    // ══════════════════════════════════════════
    const localNotes = await this.idb.getAllNotes();
    for (const note of localNotes) {
      if (note.synced && !remoteNoteIds.has(note.id)) {
        await this.idb.deleteNote(note.id);
      }
    }

    // ══════════════════════════════════════════
    // STEP 5: Merge remote notes into local IndexedDB
    // Remote wins if its updatedAt is newer.
    // ══════════════════════════════════════════
    for (const remote of remoteNotes) {
      const local = await this.idb.getNote(remote.id);
      if (!local || remote.updatedAt > local.updatedAt) {
        await this.idb.addNote({ ...remote, synced: true } as Note);
      }
    }
  }

  /**
   * Immediately deletes a note from Firestore. Shows the sync loader.
   */
  deleteRemote(noteId: string): Observable<void> {
    const col = this.notesCollection;
    if (!col || !this.isOnline()) return of(undefined);

    this.syncStatus.set('started');
    this.syncError.set(null);

    const docRef = doc(col, noteId);
    const deletePromise = Promise.all([
      deleteDoc(docRef),
      new Promise(resolve => setTimeout(resolve, 800))
    ]);

    return from(deletePromise).pipe(
      map(() => {
        this.syncStatus.set('completed');
        this.lastSyncTimestamp.set(Date.now());
      }),
      catchError(err => {
        this.syncStatus.set('failed');
        this.syncError.set(err?.message || 'Sync failed');
        return of(undefined);
      })
    );
  }

  /**
   * Immediately deletes a folder from Firestore. Shows the sync loader.
   */
  deleteRemoteFolder(folderId: string): Observable<void> {
    const col = this.foldersCollection;
    if (!col || !this.isOnline()) return of(undefined);

    this.syncStatus.set('started');
    this.syncError.set(null);

    const docRef = doc(col, folderId);
    const deletePromise = Promise.all([
      deleteDoc(docRef),
      new Promise(resolve => setTimeout(resolve, 800))
    ]);

    return from(deletePromise).pipe(
      map(() => {
        this.syncStatus.set('completed');
        this.lastSyncTimestamp.set(Date.now());
      }),
      catchError(err => {
        this.syncStatus.set('failed');
        this.syncError.set(err?.message || 'Sync failed');
        return of(undefined);
      })
    );
  }
}
