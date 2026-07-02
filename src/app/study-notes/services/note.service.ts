import { Injectable, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { NoteIdbService } from './note-idb.service';
import { NoteSyncService } from './note-sync.service';
import { Note, NoteCreate, NoteFolder, DEFAULT_FOLDER, DEFAULT_FOLDERS } from '../models/note.model';
import { v4 as uuidv4 } from 'uuid';
import { Observable, from, BehaviorSubject } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NoteService {
  private idb = inject(NoteIdbService);
  private syncService = inject(NoteSyncService);
  private auth = inject(Auth);

  private notesUpdated$ = new BehaviorSubject<void>(undefined);

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
    const newFolder: NoteFolder = {
      ...folder,
      id: uuidv4(),
      userId: this.currentUserId ?? undefined
    };
    return from(this.idb.putFolder(newFolder)).pipe(map(() => newFolder));
  }

  updateFolder(folder: NoteFolder): Observable<void> {
    return from(this.idb.putFolder(folder));
  }

  deleteFolder(id: string): Observable<void> {
    const isDefault = DEFAULT_FOLDERS.some(f => f.id === id);
    if (isDefault) {
      throw new Error('Cannot delete a default folder');
    }
    return from(
      this.idb.getNotesByFolder(id).then(async notes => {
        for (const note of notes) {
          note.folderId = DEFAULT_FOLDER.id;
          note.updatedAt = Date.now();
          await this.idb.addNote(note);
        }
        await this.idb.deleteFolder(id);
      })
    );
  }

  getFolders(): Observable<NoteFolder[]> {
    return from(this.idb.getAllFolders());
  }

  getFolder(id: string): Observable<NoteFolder | undefined> {
    return from(this.idb.getFolder(id));
  }

  getNoteCountByFolder(folderId: string): Observable<number> {
    return from(this.idb.getNoteCountByFolder(folderId));
  }
}
