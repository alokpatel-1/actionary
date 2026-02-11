export type ExpenseType = 'expense' | 'transfer';

/**
 * Expense data model for IndexedDB and sync.
 * type is optional for backward compatibility with existing records.
 */
export interface Expense {
  id: string;
  amount: number;
  type?: ExpenseType; // expense or transfer (no income); default 'expense'
  category: string;
  date: string; // YYYY-MM-DD
  note: string;
  updatedAt: number;
  synced: boolean;
  /** Firebase Auth UID; expenses are filtered by this so each user sees only their data. */
  userId?: string;
}

export type ExpenseCreate = Omit<Expense, 'id' | 'updatedAt' | 'synced'>;
export type ExpenseUpdate = Partial<Omit<Expense, 'id'>>;

export const EXPENSE_DB_NAME = 'ExpenseTrackerDB';
export const EXPENSE_STORE_NAME = 'expenses';
export const EXPENSE_DB_VERSION = 1;
