import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { ExpenseService, ViewMode, getMondayOfWeek, toYYYYMMDD } from '../../services/expense.service';
import { Expense } from '../../models/expense.model';

export interface WeekGroup {
  label: string;
  start: string;
  end: string;
  expenses: Expense[];
  total: number;
}

@Component({
  selector: 'app-expense-list',
  standalone: false,
  templateUrl: './expense-list.component.html',
  styleUrl: './expense-list.component.scss'
})
export class ExpenseListComponent implements OnInit {
  private expenseService = inject(ExpenseService);
  private confirmationService = inject(ConfirmationService);

  readonly viewMode = signal<ViewMode>('month');
  readonly expenses = signal<Expense[]>([]);
  readonly unsyncedCount = signal(0);

  // Period state: only month has a picker; today/week/year use "current"
  currentYearMonth = signal<string>(this.getCurrentYearMonth());
  readonly currentYear = new Date().getFullYear();

  /** Expenses excluding transfers — used for list display and summary on this screen. */
  readonly expensesForDisplay = computed(() =>
    this.expenses().filter((e) => e.type !== 'transfer' && e.category !== 'Transfer')
  );

  // Summary (recomputed when expenses change; excludes transfers)
  readonly totalAmount = computed(() => this.expensesForDisplay().reduce((s, e) => s + e.amount, 0));
  readonly transactionCount = computed(() => this.expensesForDisplay().length);
  readonly avgPerDay = computed(() => {
    const list = this.expensesForDisplay();
    const mode = this.viewMode();
    if (list.length === 0) return 0;
    if (mode === 'today') return list.reduce((s, e) => s + e.amount, 0);
    if (mode === 'week') return list.length ? this.totalAmount() / 7 : 0;
    if (mode === 'month') {
      const ym = this.currentYearMonth();
      const [y, m] = ym.split('-').map(Number);
      const days = new Date(y, m, 0).getDate();
      return days ? this.totalAmount() / days : 0;
    }
    // year: avg per month
    return list.length ? this.totalAmount() / 12 : 0;
  });

  // Comparison period totals for trend (today vs yesterday, week vs last week, etc.)
  readonly comparisonTotal = signal(0);
  readonly trend = computed(() => {
    const curr = this.totalAmount();
    const prev = this.comparisonTotal();
    if (prev === 0) return curr > 0 ? 'up' : null;
    if (curr === prev) return 'same';
    return curr > prev ? 'up' : 'down';
  });

  readonly trendPercent = computed(() => {
    const curr = this.totalAmount();
    const prev = this.comparisonTotal();
    if (prev === 0 || curr === prev) return null;
    const pct = Math.round(Math.abs((curr - prev) / prev) * 100);
    return pct;
  });

  // Largest expense in current set (excludes transfers)
  readonly largestExpense = computed(() => {
    const list = this.expensesForDisplay();
    if (list.length === 0) return null;
    return list.reduce((a, b) => (a.amount >= b.amount ? a : b));
  });

  // Week-grouped list (always group by week; excludes transfers)
  readonly weekGroups = computed(() => this.buildWeekGroups(this.expensesForDisplay()));

  // Infinite scroll over week groups (cards view)
  readonly visibleWeekGroupsCount = signal(3);
  readonly visibleWeekGroups = computed(() => this.weekGroups().slice(0, this.visibleWeekGroupsCount()));

  // Context-aware date display for the selector area
  readonly periodDisplay = computed(() => this.getPeriodDisplay());

  ngOnInit(): void {
    this.refresh();
    this.expenseService.getUnsyncedCount().subscribe((c) => this.unsyncedCount.set(c));
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
    this.refresh();
  }

  refresh(): void {
    const mode = this.viewMode();
    const today = toYYYYMMDD(new Date());
    const monday = getMondayOfWeek(new Date());
    const monthStart = this.currentYearMonth() + '-01';

    const nonTransferSum = (list: Expense[]) =>
      list.filter((e) => e.type !== 'transfer' && e.category !== 'Transfer').reduce((s, e) => s + e.amount, 0);

    if (mode === 'today') {
      this.expenseService.getForDay(today).subscribe((list) => {
        this.expenses.set(list);
        this.visibleWeekGroupsCount.set(3);
      });
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      this.expenseService.getForDay(toYYYYMMDD(yesterday)).subscribe((t) =>
        this.comparisonTotal.set(nonTransferSum(t))
      );
      return;
    }

    if (mode === 'week') {
      const sun = new Date(monday);
      sun.setDate(sun.getDate() + 6);
      const start = toYYYYMMDD(monday);
      const end = toYYYYMMDD(sun);
      this.expenseService.getForWeek(start, end).subscribe((list) => {
        this.expenses.set(list);
        this.visibleWeekGroupsCount.set(3);
      });
      const lastMon = new Date(monday);
      lastMon.setDate(lastMon.getDate() - 7);
      const lastSun = new Date(lastMon);
      lastSun.setDate(lastSun.getDate() + 6);
      this.expenseService
        .getByDateRange(toYYYYMMDD(lastMon), toYYYYMMDD(lastSun))
        .subscribe((list) => this.comparisonTotal.set(nonTransferSum(list)));
      return;
    }

    if (mode === 'month') {
      const ym = this.currentYearMonth();
      const [y, m] = ym.split('-').map(Number);
      const end = `${ym}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`;
      this.expenseService.getForMonth(ym).subscribe((list) => {
        this.expenses.set(list);
        this.visibleWeekGroupsCount.set(3);
      });
      this.comparisonTotal.set(0); // optional: compare to last month
      return;
    }

    // year
    this.expenseService.getForYear(String(this.currentYear)).subscribe((list) => {
      this.expenses.set(list);
      this.visibleWeekGroupsCount.set(3);
    });
    this.comparisonTotal.set(0);
  }

  onMonthChange(ym: string): void {
    this.currentYearMonth.set(ym);
    this.refresh();
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
            this.refresh();
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

  private getPeriodDisplay(): string {
    const mode = this.viewMode();
    const now = new Date();
    if (mode === 'today') {
      return now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
    }
    if (mode === 'week') {
      const mon = getMondayOfWeek(now);
      const sun = new Date(mon);
      sun.setDate(sun.getDate() + 6);
      return `${mon.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${sun.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }
    if (mode === 'month') {
      return ''; // month picker in template
    }
    return String(this.currentYear);
  }

  /** Same grouping and sorting as transaction history: by week (Mon–Sun), newest week first, newest expense first within each week. */
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
        expenses: [...exp].sort((a, b) => b.date.localeCompare(a.date)),
        total: exp.reduce((s, e) => s + e.amount, 0)
      };
    });
  }

  private getCurrentYearMonth(): string {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${m}`;
  }
}
