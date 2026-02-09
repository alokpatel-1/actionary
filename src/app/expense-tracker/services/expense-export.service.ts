import { Injectable, inject } from '@angular/core';
import { ExpenseIdbService } from './expense-idb.service';
import { Expense } from '../models/expense.model';

export type ExportScope = 'current-year' | 'last-year' | 'custom';

export interface ExportOptions {
  scope: ExportScope;
  startDate?: string; // YYYY-MM-DD, required for custom
  endDate?: string;   // YYYY-MM-DD, required for custom
  format: 'json' | 'csv';
}

@Injectable({
  providedIn: 'root'
})
export class ExpenseExportService {
  private idb = inject(ExpenseIdbService);

  /**
   * Get start and end date for scope. All from IndexedDB; works offline.
   */
  async getDateRangeForScope(scope: ExportScope, customStart?: string, customEnd?: string): Promise<{ start: string; end: string }> {
    const today = new Date();
    const y = today.getFullYear();
    const pad = (n: number) => String(n).padStart(2, '0');
    const todayStr = `${y}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

    switch (scope) {
      case 'current-year':
        return { start: `${y}-01-01`, end: todayStr };
      case 'last-year':
        return { start: `${y - 1}-01-01`, end: `${y - 1}-12-31` };
      case 'custom':
        if (!customStart || !customEnd) throw new Error('Custom range requires startDate and endDate');
        return { start: customStart, end: customEnd };
      default:
        throw new Error('Invalid export scope');
    }
  }

  /**
   * Export data from IndexedDB only. Does not modify local data. Works fully offline.
   */
  async export(options: ExportOptions): Promise<Blob> {
    const { start, end } = await this.getDateRangeForScope(
      options.scope,
      options.startDate,
      options.endDate
    );
    const expenses = await this.idb.getByDateRange(start, end);

    if (options.format === 'json') {
      const json = JSON.stringify(expenses, null, 2);
      return new Blob([json], { type: 'application/json' });
    }

    // CSV: all expense fields
    const header = 'id,amount,category,date,note,updatedAt,synced';
    const rows = expenses.map((e) =>
      [
        e.id,
        e.amount,
        escapeCsv(e.category),
        e.date,
        escapeCsv(e.note),
        e.updatedAt,
        e.synced
      ].join(',')
    );
    const csv = [header, ...rows].join('\n');
    return new Blob([csv], { type: 'text/csv;charset=utf-8' });
  }

  /** Trigger download of blob with suggested filename. */
  downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}

function escapeCsv(value: string): string {
  if (value == null) return '';
  const s = String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}
