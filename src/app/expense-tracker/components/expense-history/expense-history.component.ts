import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { ExpenseService, getMondayOfWeek, toYYYYMMDD } from '../../services/expense.service';
import { Expense } from '../../models/expense.model';

export interface WeekGroup {
  label: string;
  start: string;
  end: string;
  expenses: Expense[];
  total: number;
}

type PeriodType = 'year' | 'month' | 'week';
type HistoryTab = 'expenses' | 'transfers';

@Component({
  selector: 'app-expense-history',
  standalone: false,
  templateUrl: './expense-history.component.html',
  styleUrl: './expense-history.component.scss'
})
export class ExpenseHistoryComponent implements OnInit {
  private expenseService = inject(ExpenseService);
  private confirmationService = inject(ConfirmationService);

  readonly historyTab = signal<HistoryTab>('expenses');
  readonly periodType = signal<PeriodType>('year');
  readonly selectedYear = signal<number>(new Date().getFullYear());
  readonly selectedMonth = signal<number>(new Date().getMonth() + 1); // 1-12
  readonly selectedWeekStart = signal<string>(''); // YYYY-MM-DD Monday

  readonly expenses = signal<Expense[]>([]);
  readonly unsyncedCount = signal(0);

  readonly expensesForDisplay = computed(() => {
    const list = this.expenses();
    const tab = this.historyTab();
    if (tab === 'transfers') {
      return list.filter((e) => e.type === 'transfer' || e.category === 'Transfer');
    }
    return list.filter((e) => e.type !== 'transfer' && e.category !== 'Transfer');
  });

  readonly totalAmount = computed(() => this.expensesForDisplay().reduce((s, e) => s + e.amount, 0));
  readonly transactionCount = computed(() => this.expensesForDisplay().length);
  readonly weekGroups = computed(() => this.buildWeekGroups(this.expensesForDisplay()));

  // Infinite scroll over week groups (cards view)
  readonly visibleWeekGroupsCount = signal(3);
  readonly visibleWeekGroups = computed(() => this.weekGroups().slice(0, this.visibleWeekGroupsCount()));

  readonly yearOptions = computed(() => {
    const y = new Date().getFullYear();
    return [y, y - 1, y - 2, y - 3, y - 4];
  });
  readonly monthOptions = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];

  readonly periodLabel = computed(() => {
    const t = this.periodType();
    const y = this.selectedYear();
    if (t === 'year') return `${y}`;
    if (t === 'month') return `${this.monthOptions[this.selectedMonth() - 1]?.label ?? ''} ${y}`;
    const ws = this.selectedWeekStart();
    if (t === 'week' && ws) {
      const mon = new Date(ws + 'T12:00:00');
      const sun = new Date(mon);
      sun.setDate(sun.getDate() + 6);
      return `Week of ${mon.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${sun.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    return 'Select period';
  });

  ngOnInit(): void {
    this.load();
    this.expenseService.getUnsyncedCount().subscribe((c) => this.unsyncedCount.set(c));
  }

  setHistoryTab(tab: HistoryTab): void {
    this.historyTab.set(tab);
    this.visibleWeekGroupsCount.set(3);
  }

  setPeriodType(type: PeriodType): void {
    this.periodType.set(type);
    if (type === 'week' && !this.selectedWeekStart()) {
      const mon = getMondayOfWeek(new Date());
      this.selectedWeekStart.set(toYYYYMMDD(mon));
    }
    this.load();
  }

  onYearChange(year: number): void {
    this.selectedYear.set(year);
    this.load();
  }

  onMonthChange(month: number): void {
    this.selectedMonth.set(month);
    this.load();
  }

  onWeekStartChange(dateStr: string): void {
    if (!dateStr) return;
    const d = new Date(dateStr + 'T12:00:00');
    const mon = getMondayOfWeek(d);
    this.selectedWeekStart.set(toYYYYMMDD(mon));
    this.load();
  }

  load(): void {
    const t = this.periodType();
    const y = this.selectedYear();

    if (t === 'year') {
      this.expenseService.getForYear(String(y)).subscribe((list) => {
        this.expenses.set(list);
        this.visibleWeekGroupsCount.set(3);
      });
      return;
    }

    if (t === 'month') {
      const m = this.selectedMonth();
      const ym = `${y}-${String(m).padStart(2, '0')}`;
      this.expenseService.getForMonth(ym).subscribe((list) => {
        this.expenses.set(list);
        this.visibleWeekGroupsCount.set(3);
      });
      return;
    }

    if (t === 'week') {
      const ws = this.selectedWeekStart();
      if (!ws) return;
      const mon = new Date(ws + 'T12:00:00');
      const sun = new Date(mon);
      sun.setDate(sun.getDate() + 6);
      const end = toYYYYMMDD(sun);
      this.expenseService.getByDateRange(ws, end).subscribe((list) => {
        this.expenses.set(list);
        this.visibleWeekGroupsCount.set(3);
      });
    }
  }

  deleteExpense(id: string, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.confirmationService.confirm({
      message: 'Delete this expense? This will sync to all your devices.',
      header: 'Delete expense',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.expenseService.delete(id).subscribe({
          next: () => {
            this.load();
            this.expenseService.getUnsyncedCount().subscribe((c) => this.unsyncedCount.set(c));
          },
          error: (err) => console.error('Delete failed', err)
        });
      }
    });
  }

  // Triggered when the card list scrolls near the bottom; loads more week groups.
  onTransactionsScroll(event: Event): void {
    const el = event.target as HTMLElement;
    if (!el) return;
    const threshold = 48;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - threshold) {
      const total = this.weekGroups().length;
      const current = this.visibleWeekGroupsCount();
      if (current < total) {
        this.visibleWeekGroupsCount.set(Math.min(current + 3, total));
      }
    }
  }

  getCategoryLetter(category: string): string {
    return (category?.trim().charAt(0) || '?').toUpperCase();
  }

  /** Display label for category; transfers have no category and show as "Transfer". */
  getDisplayCategory(expense: Expense): string {
    return expense.type === 'transfer' || !expense.category?.trim() ? 'Transfer' : expense.category;
  }

  getDateLabel(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T12:00:00');
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.getTime() === today.getTime()) return 'Today';
    if (d.getTime() === yesterday.getTime()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  formatCurrency(value: number): string {
    return '₹' + value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  private buildWeekGroups(list: Expense[]): WeekGroup[] {
    if (list.length === 0) return [];
    const weekKey = (d: string) => {
      const m = getMondayOfWeek(new Date(d + 'T12:00:00'));
      return toYYYYMMDD(m);
    };
    const byWeek = new Map<string, Expense[]>();
    list.forEach((e) => {
      const key = weekKey(e.date);
      if (!byWeek.has(key)) byWeek.set(key, []);
      byWeek.get(key)!.push(e);
    });
    const keys = [...byWeek.keys()].sort((a, b) => b.localeCompare(a));
    return keys.map((key) => {
      const exp = byWeek.get(key)!;
      const mon = new Date(key + 'T12:00:00');
      const sun = new Date(mon);
      sun.setDate(sun.getDate() + 6);
      return {
        label: `Week of ${mon.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${sun.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        start: key,
        end: toYYYYMMDD(sun),
        expenses: exp.sort((a, b) => b.date.localeCompare(a.date)),
        total: exp.reduce((s, e) => s + e.amount, 0)
      };
    });
  }
}
