import { Injectable, inject } from '@angular/core';
import { ExpenseIdbService } from './expense-idb.service';
import { Expense, ExpenseCreate } from '../models/expense.model';
import { v4 as uuidv4 } from 'uuid';
import { Observable } from 'rxjs';
import { from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

export type ViewMode = 'daily' | 'monthly' | 'yearly';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private idb = inject(ExpenseIdbService);

  add(data: ExpenseCreate): Observable<Expense> {
    const expense: Expense = {
      id: uuidv4(),
      amount: data.amount,
      category: data.category,
      date: data.date,
      note: data.note ?? '',
      updatedAt: Date.now(),
      synced: false
    };
    return from(this.idb.add(expense)).pipe(map(() => expense));
  }

  update(id: string, data: Partial<ExpenseCreate>): Observable<void> {
    return from(this.idb.get(id)).pipe(
      switchMap((existing) => {
        if (!existing) throw new Error('Expense not found');
        const updated: Expense = {
          ...existing,
          ...data,
          id: existing.id,
          updatedAt: Date.now(),
          synced: false
        };
        return from(this.idb.add(updated));
      })
    );
  }

  delete(id: string): Observable<void> {
    return from(this.idb.delete(id));
  }

  getById(id: string): Observable<Expense | undefined> {
    return from(this.idb.get(id));
  }

  getAll(): Observable<Expense[]> {
    return this.idb.getAll$();
  }

  getByDateRange(start: string, end: string): Observable<Expense[]> {
    return from(this.idb.getByDateRange(start, end));
  }

  getUnsyncedCount(): Observable<number> {
    return from(this.idb.getUnsyncedCount());
  }

  /** Get expenses for a given day (YYYY-MM-DD). */
  getForDay(date: string): Observable<Expense[]> {
    return this.getByDateRange(date, date);
  }

  /** Get expenses for a month (YYYY-MM). */
  getForMonth(yearMonth: string): Observable<Expense[]> {
    const [y, m] = yearMonth.split('-').map(Number);
    const start = `${yearMonth}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const end = `${yearMonth}-${String(lastDay).padStart(2, '0')}`;
    return this.getByDateRange(start, end);
  }

  /** Get expenses for a year (YYYY). */
  getForYear(year: string): Observable<Expense[]> {
    return this.getByDateRange(`${year}-01-01`, `${year}-12-31`);
  }
}
