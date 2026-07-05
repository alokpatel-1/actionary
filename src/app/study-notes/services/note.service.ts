import { Injectable, inject, signal, effect } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { NoteIdbService } from './note-idb.service';
import { NoteSyncService } from './note-sync.service';
import { Note, NoteCreate, NoteFolder, DEFAULT_FOLDER, DEFAULT_FOLDERS, normalizeIcon } from '../models/note.model';
import { v4 as uuidv4 } from 'uuid';
import { Observable, from, BehaviorSubject, forkJoin, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NoteService {
  private idb = inject(NoteIdbService);
  public syncService = inject(NoteSyncService);

  get sync() {
    return this.syncService;
  }
  
  private auth = inject(Auth);

  private notesUpdated$ = new BehaviorSubject<void>(undefined);
  activeFolderId = signal<string | null>(null);
  expandedFolders = signal<Record<string, boolean>>({});

  constructor() {
    effect(() => {
      if (this.syncService.syncStatus() === 'completed') {
        this.triggerRefresh();
        this.cleanupOldArchivedNotes().subscribe();
      }
    });
  }

  private cleanupOldArchivedNotes(): Observable<void> {
    const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    return from(this.idb.getAllNotes()).pipe(
      switchMap(notes => {
        const toDelete = notes.filter(n => n.isDeleted && (now - n.updatedAt) > NINETY_DAYS_MS);
        const deletes = toDelete.map(n => this.permanentlyDeleteNote(n.id));
        return deletes.length ? forkJoin(deletes) : of(null);
      }),
      map(() => void 0)
    );
  }

  triggerRefresh(): void {
    this.notesUpdated$.next();
  }

  getNotesRefreshObservable(): Observable<void> {
    return this.notesUpdated$.asObservable();
  }

  private get currentUserId(): string | null {
    return this.auth.currentUser?.uid ??
      (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('localId') : null);
  }

  private filterByUser(notes: Note[]): Note[] {
    const uid = this.currentUserId;
    if (!uid) return notes;
    return notes.filter(n => n.userId === uid || !n.userId);
  }

  // ── Notes ──

  addNote(data: NoteCreate): Observable<Note> {
    const uid = this.currentUserId;
    const note: Note = {
      id: uuidv4(),
      title: data.title || 'Untitled Note',
      content: data.content || '',
      folderId: data.folderId || DEFAULT_FOLDER.id,
      isPinned: data.isPinned || false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      synced: false,
      userId: uid ?? undefined
    };
    return from(this.idb.addNote(note)).pipe(
      tap(() => this.syncService.tryAutoSync()),
      tap(() => this.triggerRefresh()),
      map(() => note)
    );
  }

  updateNote(id: string, changes: Partial<Note>): Observable<Note> {
    return from(this.idb.getNote(id)).pipe(
      switchMap(existing => {
        if (!existing) throw new Error('Note not found');
        const updated: Note = {
          ...existing,
          ...changes,
          id: existing.id,
          updatedAt: Date.now(),
          synced: false,
          userId: existing.userId
        };
        return from(this.idb.addNote(updated)).pipe(
          tap(() => this.syncService.tryAutoSync()),
          tap(() => this.triggerRefresh()),
          map(() => updated)
        );
      })
    );
  }

  deleteNote(id: string): Observable<void> {
    return this.updateNote(id, { isDeleted: true }).pipe(
      map(() => undefined)
    );
  }

  bulkDeleteNotes(ids: string[]): Observable<void> {
    return from(this.idb.getAllNotes()).pipe(
      switchMap(notes => {
        const notesToDelete = notes.filter(n => !n.isDeleted && ids.includes(n.id));
        const updates = notesToDelete.map(n => this.updateNote(n.id, { isDeleted: true }));
        return updates.length ? forkJoin(updates) : of(null);
      }),
      map(() => void 0)
    );
  }

  duplicateNote(id: string): Observable<Note> {
    return from(this.idb.getNote(id)).pipe(
      switchMap(existing => {
        if (!existing) throw new Error('Note not found');
        const duplicated: Note = {
          ...existing,
          id: uuidv4(),
          title: existing.title ? `${existing.title} Copy` : 'Untitled Copy',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          synced: false
        };
        return from(this.idb.addNote(duplicated)).pipe(
          tap(() => this.syncService.tryAutoSync()),
          tap(() => this.triggerRefresh()),
          map(() => duplicated)
        );
      })
    );
  }

  renameNote(id: string, newTitle: string): Observable<Note> {
    return this.updateNote(id, { title: newTitle });
  }

  permanentlyDeleteNote(id: string): Observable<void> {
    return from(this.idb.deleteNote(id)).pipe(
      tap(() => this.triggerRefresh()),
      switchMap(() => this.syncService.deleteRemote(id))
    );
  }

  restoreNote(id: string): Observable<Note> {
    return this.updateNote(id, { isDeleted: false });
  }

  getNote(id: string): Observable<Note | undefined> {
    return from(this.idb.getNote(id));
  }

  getAllNotes(): Observable<Note[]> {
    return from(this.idb.getAllNotes()).pipe(
      map(notes => this.filterByUser(notes)),
      map(notes => notes.filter(n => !n.isDeleted)),
      map(notes => notes.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return b.updatedAt - a.updatedAt;
      }))
    );
  }

  getDeletedNotes(): Observable<Note[]> {
    return from(this.idb.getAllNotes()).pipe(
      map(notes => this.filterByUser(notes)),
      map(notes => notes.filter(n => n.isDeleted === true)),
      map(notes => notes.sort((a, b) => b.updatedAt - a.updatedAt))
    );
  }

  getNotesByFolder(folderId: string): Observable<Note[]> {
    return from(this.idb.getNotesByFolder(folderId)).pipe(
      map(notes => this.filterByUser(notes)),
      map(notes => notes.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return b.updatedAt - a.updatedAt;
      }))
    );
  }

  searchNotes(query: string): Observable<Note[]> {
    return from(this.idb.searchNotes(query)).pipe(
      map(notes => this.filterByUser(notes)),
      map(notes => notes.sort((a, b) => b.updatedAt - a.updatedAt))
    );
  }

  togglePin(id: string): Observable<void> {
    return from(this.idb.getNote(id)).pipe(
      switchMap(note => {
        if (!note) throw new Error('Note not found');
        note.isPinned = !note.isPinned;
        note.updatedAt = Date.now();
        note.synced = false;
        return from(this.idb.addNote(note)).pipe(
          tap(() => this.triggerRefresh())
        );
      }),
      tap(() => this.syncService.tryAutoSync())
    );
  }

  // ── Folders ──

  addFolder(folder: Omit<NoteFolder, 'id'>): Observable<NoteFolder> {
    const uid = this.currentUserId;
    const newFolder: NoteFolder = {
      ...folder,
      id: uuidv4(),
      icon: normalizeIcon(folder.icon),   // migrate any legacy pi-class on create
      synced: false,                       // marks it as not yet pushed to Firestore
      userId: uid ?? undefined
    };

    // Auto-create a default "Untitled Note" inside the new folder
    const defaultNote: Note = {
      id: uuidv4(),
      title: 'Untitled Note',
      content: '',
      folderId: newFolder.id,
      isPinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      synced: false,
      userId: uid ?? undefined
    };

    return from(
      this.idb.putFolder(newFolder).then(() => this.idb.addNote(defaultNote))
    ).pipe(
      tap(() => this.syncService.tryAutoSync()),
      tap(() => this.triggerRefresh()),
      map(() => newFolder)
    );
  }

  updateFolder(folder: NoteFolder): Observable<void> {
    return from(this.idb.putFolder(folder)).pipe(
      tap(() => this.syncService.tryAutoSync())
    );
  }

  deleteFolder(id: string): Observable<void> {
    const isDefault = DEFAULT_FOLDERS.some(f => f.id === id);
    if (isDefault) {
      throw new Error('Cannot delete a default folder');
    }
    return from(
      Promise.all([
        this.idb.getNotesByFolder(id).then(async notes => {
          for (const note of notes) {
            note.folderId = DEFAULT_FOLDER.id;
            note.updatedAt = Date.now();
            note.synced = false;
            await this.idb.addNote(note);
          }
        }),
        this.idb.getAllFolders().then(async folders => {
          const deletedFolder = folders.find(f => f.id === id);
          const parentId = deletedFolder?.parentId;
          for (const folder of folders) {
            if (folder.parentId === id) {
              folder.parentId = parentId;
              await this.idb.putFolder(folder);
            }
          }
        })
      ]).then(() => this.idb.deleteFolder(id))
    ).pipe(
      switchMap(() => this.syncService.deleteRemoteFolder(id))
    );
  }

  getFolders(): Observable<NoteFolder[]> {
    return from(this.idb.getAllFolders()).pipe(
      switchMap(async folders => {
        const migrated = folders.map(f => ({ ...f, icon: normalizeIcon(f.icon) }));
        // Persist the migrated icon back to IDB for any folder that had a legacy pi-class
        for (const folder of migrated) {
          const original = folders.find(f => f.id === folder.id);
          if (original && original.icon !== folder.icon) {
            await this.idb.putFolder(folder);
          }
        }
        return migrated;
      })
    );
  }

  getFolder(id: string): Observable<NoteFolder | undefined> {
    return from(this.idb.getFolder(id)).pipe(
      map(f => f ? { ...f, icon: normalizeIcon(f.icon) } : undefined)
    );
  }

  getNoteCountByFolder(folderId: string): Observable<number> {
    return from(this.idb.getNoteCountByFolder(folderId));
  }
}
