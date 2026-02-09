import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
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

  readonly viewMode = signal<ViewMode>('month');
  readonly expenses = signal<Expense[]>([]);
  readonly unsyncedCount = signal(0);

  // Period state: only month has a picker; today/week/year use "current"
  currentYearMonth = signal<string>(this.getCurrentYearMonth());
  readonly currentYear = new Date().getFullYear();

  // Summary (recomputed when expenses change)
  readonly totalAmount = computed(() => this.expenses().reduce((s, e) => s + e.amount, 0));
  readonly transactionCount = computed(() => this.expenses().length);
  readonly avgPerDay = computed(() => {
    const list = this.expenses();
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

  // Largest expense in current set
  readonly largestExpense = computed(() => {
    const list = this.expenses();
    if (list.length === 0) return null;
    return list.reduce((a, b) => (a.amount >= b.amount ? a : b));
  });

  // Week-grouped list (always group by week)
  readonly weekGroups = computed(() => this.buildWeekGroups(this.expenses()));

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

    if (mode === 'today') {
      this.expenseService.getForDay(today).subscribe((list) => this.expenses.set(list));
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      this.expenseService.getForDay(toYYYYMMDD(yesterday)).subscribe((t) =>
        this.comparisonTotal.set(t.reduce((s, e) => s + e.amount, 0))
      );
      return;
    }

    if (mode === 'week') {
      const sun = new Date(monday);
      sun.setDate(sun.getDate() + 6);
      const start = toYYYYMMDD(monday);
      const end = toYYYYMMDD(sun);
      this.expenseService.getForWeek(start, end).subscribe((list) => this.expenses.set(list));
      const lastMon = new Date(monday);
      lastMon.setDate(lastMon.getDate() - 7);
      const lastSun = new Date(lastMon);
      lastSun.setDate(lastSun.getDate() + 6);
      this.expenseService
        .getByDateRange(toYYYYMMDD(lastMon), toYYYYMMDD(lastSun))
        .subscribe((list) => this.comparisonTotal.set(list.reduce((s, e) => s + e.amount, 0)));
      return;
    }

    if (mode === 'month') {
      const ym = this.currentYearMonth();
      const [y, m] = ym.split('-').map(Number);
      const end = `${ym}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`;
      this.expenseService.getForMonth(ym).subscribe((list) => this.expenses.set(list));
      this.comparisonTotal.set(0); // optional: compare to last month
      return;
    }

    // year
    this.expenseService.getForYear(String(this.currentYear)).subscribe((list) => this.expenses.set(list));
    this.comparisonTotal.set(0);
  }

  onMonthChange(ym: string): void {
    this.currentYearMonth.set(ym);
    this.refresh();
  }

  deleteExpense(id: string): void {
    this.expenseService.delete(id).subscribe(() => this.refresh());
  }

  getCategoryLetter(category: string): string {
    return (category?.trim().charAt(0) || '?').toUpperCase();
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

  private buildWeekGroups(list: Expense[]): WeekGroup[] {
    if (list.length === 0) return [];
    const now = new Date();
    const todayStr = toYYYYMMDD(now);
    const thisMonday = getMondayOfWeek(now);
    const thisSunday = new Date(thisMonday);
    thisSunday.setDate(thisSunday.getDate() + 6);
    const thisWeekStart = toYYYYMMDD(thisMonday);
    const thisWeekEnd = toYYYYMMDD(thisSunday);

    const lastMonday = new Date(thisMonday);
    lastMonday.setDate(lastMonday.getDate() - 7);
    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastSunday.getDate() + 6);
    const lastWeekStart = toYYYYMMDD(lastMonday);
    const lastWeekEnd = toYYYYMMDD(lastSunday);

    const weekKey = (d: string) => {
      const m = getMondayOfWeek(new Date(d + 'T12:00:00'));
      return toYYYYMMDD(m);
    };

    const groups: WeekGroup[] = [];
    // Order: Today (if any), This Week (rest), Last Week, then "Week of Mon – Sun"
    const todayExpenses = list.filter((e) => e.date === todayStr);
    const thisWeekExpenses = list.filter(
      (e) => e.date >= thisWeekStart && e.date <= thisWeekEnd && e.date !== todayStr
    );
    const lastWeekExpenses = list.filter((e) => e.date >= lastWeekStart && e.date <= lastWeekEnd);
    const otherWeeks = new Map<string, Expense[]>();
    list.forEach((e) => {
      if (e.date === todayStr) return;
      if (e.date >= thisWeekStart && e.date <= thisWeekEnd) return;
      if (e.date >= lastWeekStart && e.date <= lastWeekEnd) return;
      const key = weekKey(e.date);
      if (!otherWeeks.has(key)) otherWeeks.set(key, []);
      otherWeeks.get(key)!.push(e);
    });

    if (todayExpenses.length > 0) {
      groups.push({
        label: 'Today',
        start: todayStr,
        end: todayStr,
        expenses: todayExpenses,
        total: todayExpenses.reduce((s, e) => s + e.amount, 0)
      });
    }
    if (thisWeekExpenses.length > 0) {
      groups.push({
        label: 'This Week',
        start: thisWeekStart,
        end: thisWeekEnd,
        expenses: thisWeekExpenses,
        total: thisWeekExpenses.reduce((s, e) => s + e.amount, 0)
      });
    }
    if (lastWeekExpenses.length > 0) {
      groups.push({
        label: 'Last Week',
        start: lastWeekStart,
        end: lastWeekEnd,
        expenses: lastWeekExpenses,
        total: lastWeekExpenses.reduce((s, e) => s + e.amount, 0)
      });
    }
    const otherKeys = [...otherWeeks.keys()].sort((a, b) => b.localeCompare(a));
    otherKeys.forEach((key) => {
      const exp = otherWeeks.get(key)!;
      const mon = new Date(key + 'T12:00:00');
      const sun = new Date(mon);
      sun.setDate(sun.getDate() + 6);
      groups.push({
        label: `Week of ${mon.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${sun.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        start: key,
        end: toYYYYMMDD(sun),
        expenses: exp,
        total: exp.reduce((s, e) => s + e.amount, 0)
      });
    });

    return groups;
  }

  private getCurrentYearMonth(): string {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${m}`;
  }
}
