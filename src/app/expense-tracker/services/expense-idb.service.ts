import { Injectable } from '@angular/core';
import { Expense, EXPENSE_DB_NAME, EXPENSE_STORE_NAME, EXPENSE_DB_VERSION } from '../models/expense.model';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ExpenseIdbService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  /**
   * Open IndexedDB with schema versioning. Primary and permanent store.
   */
  async openDb(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;
    this.initPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(EXPENSE_DB_NAME, EXPENSE_DB_VERSION);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        this.db = req.result;
        resolve(this.db);
      };
      req.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(EXPENSE_STORE_NAME)) {
          const store = db.createObjectStore(EXPENSE_STORE_NAME, { keyPath: 'id' });
          store.createIndex('date', 'date', { unique: false });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
          store.createIndex('synced', 'synced', { unique: false });
        }
      };
    });
    return this.initPromise;
  }

  private async getStore(mode: IDBTransactionMode = 'readonly'): Promise<{ db: IDBDatabase; store: IDBObjectStore }> {
    const db = await this.openDb();
    const tx = db.transaction(EXPENSE_STORE_NAME, mode);
    const store = tx.objectStore(EXPENSE_STORE_NAME);
    return { db, store };
  }

  async add(expense: Expense): Promise<void> {
    const { store } = await this.getStore('readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put(expense);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async putAll(expenses: Expense[]): Promise<void> {
    if (!expenses.length) return;
    const { store } = await this.getStore('readwrite');
    return new Promise((resolve, reject) => {
      let completed = 0;
      const total = expenses.length;
      const onDone = () => {
        completed++;
        if (completed === total) resolve();
      };
      expenses.forEach((e) => {
        const req = store.put(e);
        req.onsuccess = onDone;
        req.onerror = () => reject(req.error);
      });
    });
  }

  async get(id: string): Promise<Expense | undefined> {
    const { store } = await this.getStore();
    return new Promise((resolve, reject) => {
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async getAll(): Promise<Expense[]> {
    const { store } = await this.getStore();
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  getAll$(): Observable<Expense[]> {
    return from(this.getAll());
  }

  async getByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
    const all = await this.getAll();
    return all.filter((e) => e.date >= startDate && e.date <= endDate);
  }

  /** Get all expenses where synced === false. Uses in-memory filter because IndexedDB key types cannot be boolean. */
  async getUnsynced(): Promise<Expense[]> {
    const all = await this.getAll();
    return all.filter((e) => e.synced === false);
  }

  async getUnsyncedCount(): Promise<number> {
    const list = await this.getUnsynced();
    return list.length;
  }

  async delete(id: string): Promise<void> {
    const { store } = await this.getStore('readwrite');
    return new Promise((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  /** Close DB (e.g. for tests or recovery). Data is never deleted. */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }
}
