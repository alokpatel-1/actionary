import { Injectable } from '@angular/core';
import {
  Note,
  NoteFolder,
  NOTE_DB_NAME,
  NOTE_STORE_NAME,
  FOLDER_STORE_NAME,
  THOUGHT_STORE_NAME,
  NOTE_DB_VERSION,
  DEFAULT_FOLDERS,
  QuickThought
} from '../models/note.model';

@Injectable({
  providedIn: 'root'
})
export class NoteIdbService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  async openDb(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;
    this.initPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const open = () => {
        const req = indexedDB.open(NOTE_DB_NAME, NOTE_DB_VERSION);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(NOTE_STORE_NAME) || 
              !db.objectStoreNames.contains(FOLDER_STORE_NAME) || 
              !db.objectStoreNames.contains(THOUGHT_STORE_NAME)) {
            console.warn('Inconsistent database stores detected. Recreating database...');
            db.close();
            const deleteReq = indexedDB.deleteDatabase(NOTE_DB_NAME);
            deleteReq.onsuccess = () => {
              const retryReq = indexedDB.open(NOTE_DB_NAME, NOTE_DB_VERSION);
              retryReq.onerror = () => reject(retryReq.error);
              retryReq.onsuccess = () => {
                this.db = retryReq.result;
                resolve(this.db);
              };
              retryReq.onupgradeneeded = (ev) => {
                const retryDb = (ev.target as IDBOpenDBRequest).result;
                this.createStores(retryDb);
              };
            };
            deleteReq.onerror = () => {
              reject(new Error('Failed to delete inconsistent database'));
            };
            return;
          }
          this.db = db;
          resolve(this.db);
        };
        req.onupgradeneeded = (e) => {
          const db = (e.target as IDBOpenDBRequest).result;
          this.createStores(db);
        };
      };
      open();
    });
    const db = await this.initPromise;
    await this.ensureDefaultFolders();
    return db;
  }

  private createStores(db: IDBDatabase): void {
    if (!db.objectStoreNames.contains(NOTE_STORE_NAME)) {
      const noteStore = db.createObjectStore(NOTE_STORE_NAME, { keyPath: 'id' });
      noteStore.createIndex('folderId', 'folderId', { unique: false });
      noteStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      noteStore.createIndex('synced', 'synced', { unique: false });
      noteStore.createIndex('isPinned', 'isPinned', { unique: false });
    }
    if (!db.objectStoreNames.contains(FOLDER_STORE_NAME)) {
      const folderStore = db.createObjectStore(FOLDER_STORE_NAME, { keyPath: 'id' });
      folderStore.createIndex('order', 'order', { unique: false });
    }
    if (!db.objectStoreNames.contains(THOUGHT_STORE_NAME)) {
      const thoughtStore = db.createObjectStore(THOUGHT_STORE_NAME, { keyPath: 'id' });
      thoughtStore.createIndex('createdAt', 'createdAt', { unique: false });
    }
  }

  private async ensureDefaultFolders(): Promise<void> {
    for (const folder of DEFAULT_FOLDERS) {
      const existing = await this.getFolder(folder.id);
      if (!existing) {
        await this.putFolder(folder);
      }
    }
  }

  // ── Notes CRUD ──

  private async getNoteStore(mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    const db = await this.openDb();
    const tx = db.transaction(NOTE_STORE_NAME, mode);
    return tx.objectStore(NOTE_STORE_NAME);
  }

  async addNote(note: Note): Promise<void> {
    const store = await this.getNoteStore('readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put(note);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getNote(id: string): Promise<Note | undefined> {
    const store = await this.getNoteStore();
    return new Promise((resolve, reject) => {
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async getAllNotes(): Promise<Note[]> {
    const store = await this.getNoteStore();
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async deleteNote(id: string): Promise<void> {
    const store = await this.getNoteStore('readwrite');
    return new Promise((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getNotesByFolder(folderId: string): Promise<Note[]> {
    const all = await this.getAllNotes();
    return all.filter(n => n.folderId === folderId);
  }

  async searchNotes(query: string): Promise<Note[]> {
    const all = await this.getAllNotes();
    const q = query.toLowerCase().trim();
    if (!q) return all;
    return all.filter(n => {
      const titleMatch = n.title.toLowerCase().includes(q);
      const plainContent = n.content.replace(/<[^>]*>/g, '').toLowerCase();
      return titleMatch || plainContent.includes(q);
    });
  }

  async getUnsynced(): Promise<Note[]> {
    const all = await this.getAllNotes();
    return all.filter(n => n.synced === false);
  }

  // ── Folders CRUD ──

  private async getFolderStore(mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    const db = await this.openDb();
    const tx = db.transaction(FOLDER_STORE_NAME, mode);
    return tx.objectStore(FOLDER_STORE_NAME);
  }

  async putFolder(folder: NoteFolder): Promise<void> {
    const store = await this.getFolderStore('readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put(folder);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getFolder(id: string): Promise<NoteFolder | undefined> {
    const store = await this.getFolderStore();
    return new Promise((resolve, reject) => {
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async getAllFolders(): Promise<NoteFolder[]> {
    const store = await this.getFolderStore();
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => {
        const folders = (req.result || []) as NoteFolder[];
        folders.sort((a, b) => a.order - b.order);
        resolve(folders);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async deleteFolder(id: string): Promise<void> {
    const store = await this.getFolderStore('readwrite');
    return new Promise((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getNoteCountByFolder(folderId: string): Promise<number> {
    const notes = await this.getNotesByFolder(folderId);
    return notes.length;
  }

  // ── Quick Thoughts CRUD ──

  private async getThoughtStore(mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    const db = await this.openDb();
    const tx = db.transaction(THOUGHT_STORE_NAME, mode);
    return tx.objectStore(THOUGHT_STORE_NAME);
  }

  async putThought(thought: QuickThought): Promise<void> {
    const store = await this.getThoughtStore('readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put(thought);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getAllThoughts(): Promise<QuickThought[]> {
    const store = await this.getThoughtStore();
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => {
        const list = req.result as QuickThought[];
        list.sort((a, b) => b.createdAt - a.createdAt);
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async deleteThought(id: string): Promise<void> {
    const store = await this.getThoughtStore('readwrite');
    return new Promise((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }
}
