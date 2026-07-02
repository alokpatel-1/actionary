import { Injectable, inject, signal } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore, collection, doc, setDoc, deleteDoc, getDocs, query, where } from '@angular/fire/firestore';
import { NoteIdbService } from './note-idb.service';
import { Note } from '../models/note.model';
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

  tryAutoSync(): void {
    if (this.isOnline() && this.uid) {
      this.sync().subscribe();
    }
  }

  sync(): Observable<{ success: boolean }> {
    if (!this.isOnline() || !this.uid) {
      return of({ success: false });
    }

    this.syncStatus.set('started');
    this.syncError.set(null);

    return from(this.performSync()).pipe(
      map(() => {
        this.syncStatus.set('completed');
        this.lastSyncTimestamp.set(Date.now());
        return { success: true };
      }),
      catchError(err => {
        this.syncStatus.set('failed');
        this.syncError.set(err?.message || 'Sync failed');
        return of({ success: false });
      })
    );
  }

  private async performSync(): Promise<void> {
    const col = this.notesCollection;
    if (!col) return;

    // 1. Push unsynced local notes to Firestore
    const unsynced = await this.idb.getUnsynced();
    for (const note of unsynced) {
      const docRef = doc(col, note.id);
      const { synced, ...data } = note;
      await setDoc(docRef, data, { merge: true });
      note.synced = true;
      await this.idb.addNote(note);
    }

    // 2. Pull remote notes and merge by updatedAt
    const snapshot = await getDocs(col);
    for (const docSnap of snapshot.docs) {
      const remote = docSnap.data() as Omit<Note, 'synced'>;
      const local = await this.idb.getNote(remote.id);
      if (!local || remote.updatedAt > local.updatedAt) {
        await this.idb.addNote({ ...remote, synced: true } as Note);
      }
    }
  }

  deleteRemote(noteId: string): Observable<void> {
    const col = this.notesCollection;
    if (!col || !this.isOnline()) return of(undefined);
    const docRef = doc(col, noteId);
    return from(deleteDoc(docRef));
  }
}
