/**
 * Expense data model for IndexedDB and sync.
 * All fields are required for storage; export includes all.
 */
export interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  note: string;
  updatedAt: number;
  synced: boolean;
}

export type ExpenseCreate = Omit<Expense, 'id' | 'updatedAt' | 'synced'>;
export type ExpenseUpdate = Partial<Omit<Expense, 'id'>>;

export const EXPENSE_DB_NAME = 'ExpenseTrackerDB';
export const EXPENSE_STORE_NAME = 'expenses';
export const EXPENSE_DB_VERSION = 1;
