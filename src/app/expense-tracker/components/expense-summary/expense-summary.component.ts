import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ExpenseService } from '../../services/expense.service';
import { Expense } from '../../models/expense.model';

export type SummaryPeriod = 'month' | 'year' | 'range';

function toYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function daysBetween(start: string, end: string): number {
  const a = new Date(start + 'T12:00:00').getTime();
  const b = new Date(end + 'T12:00:00').getTime();
  return Math.max(0, Math.round((b - a) / (24 * 60 * 60 * 1000)) + 1);
}

interface CategoryRow {
  category: string;
  count: number;
  total: number;
  percent: number;
}

interface DonutSegment {
  category: string;
  total: number;
  percent: number;
  color: string;
}

interface TrendPoint {
  label: string;
  value: number;
}

// Distinct hues for easy identification (blue, green, amber, violet, teal, slate)
const DONUT_COLORS = [
  '#4DA3FF', // blue
  '#22C55E', // green
  '#F59E0B', // amber
  '#8B5CF6', // violet
  '#06B6D4', // teal
  '#64748B'  // slate (Other)
];

@Component({
  selector: 'app-expense-summary',
  standalone: false,
  templateUrl: './expense-summary.component.html',
  styleUrl: './expense-summary.component.scss'
})
export class ExpenseSummaryComponent implements OnInit {
  private expenseService = inject(ExpenseService);

  readonly period = signal<SummaryPeriod>('month');
  readonly dateRangeStart = signal<string>(toYYYYMMDD(new Date()));
  readonly dateRangeEnd = signal<string>(toYYYYMMDD(new Date()));
  readonly expenses = signal<Expense[]>([]);
  readonly previousPeriodTotal = signal(0);

  readonly dateRangeLabel = computed(() => {
    const s = this.dateRangeStart();
    const e = this.dateRangeEnd();
    if (!s || !e) return '';
    const from = new Date(s + 'T12:00:00');
    const to = new Date(e + 'T12:00:00');
    return `${from.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} – ${to.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  });

  readonly rangeStartDate = computed(() => new Date(this.dateRangeStart() + 'T12:00:00'));
  readonly rangeEndDate = computed(() => new Date(this.dateRangeEnd() + 'T12:00:00'));

  readonly totalAmount = computed(() =>
    this.expenses().reduce((s, e) => s + e.amount, 0)
  );
  readonly totalCount = computed(() => this.expenses().length);
  readonly averageSpend = computed(() => {
    const total = this.totalAmount();
    const list = this.expenses();
    if (list.length === 0) return 0;
    const period = this.period();
    if (period === 'month') {
      const d = new Date();
      const days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      return days ? total / days : 0;
    }
    if (period === 'range') {
      const days = daysBetween(this.dateRangeStart(), this.dateRangeEnd());
      return days > 0 ? total / days : 0;
    }
    return total / 12;
  });
  readonly highestExpense = computed(() => {
    const list = this.expenses();
    if (list.length === 0) return null;
    return list.reduce((a, b) => (a.amount >= b.amount ? a : b));
  });

  readonly transferTotal = computed(() =>
    this.expenses().filter((e) => e.type === 'transfer' || e.category === 'Transfer').reduce((s, e) => s + e.amount, 0)
  );
  readonly transferCount = computed(() =>
    this.expenses().filter((e) => e.type === 'transfer' || e.category === 'Transfer').length
  );

  /** Expenses excluding transfers — used for graph and category table only. */
  private readonly expensesExcludingTransfers = computed(() =>
    this.expenses().filter((e) => e.type !== 'transfer' && e.category !== 'Transfer')
  );

  readonly totalExcludingTransfers = computed(() =>
    this.expensesExcludingTransfers().reduce((s, e) => s + e.amount, 0)
  );

  readonly byCategorySorted = computed(() => {
    const list = this.expensesExcludingTransfers();
    const byCat = new Map<string, { total: number; count: number }>();
    list.forEach((e) => {
      const cat = e.category?.trim() || 'Miscellaneous';
      const cur = byCat.get(cat) ?? { total: 0, count: 0 };
      cur.total += e.amount;
      cur.count += 1;
      byCat.set(cat, cur);
    });
    return Array.from(byCat.entries())
      .map(([category, v]) => ({ category, total: v.total, count: v.count }))
      .sort((a, b) => b.total - a.total);
  });

  readonly categoryTable = computed((): CategoryRow[] => {
    const rows = this.byCategorySorted();
    const total = this.totalExcludingTransfers();
    if (total === 0) return [];
    return rows.map((r) => ({
      category: r.category,
      count: r.count,
      total: r.total,
      percent: Math.round((r.total / total) * 1000) / 10
    }));
  });

  readonly donutSegments = computed((): DonutSegment[] => {
    const rows = this.byCategorySorted();
    const total = this.totalExcludingTransfers();
    if (total === 0) return [];
    const top5 = rows.slice(0, 5);
    const otherTotal = rows.slice(5).reduce((s, r) => s + r.total, 0);
    const segments: DonutSegment[] = top5.map((r, i) => ({
      category: r.category,
      total: r.total,
      percent: Math.round((r.total / total) * 1000) / 10,
      color: DONUT_COLORS[i] ?? DONUT_COLORS[0]
    }));
    if (otherTotal > 0) {
      segments.push({
        category: 'Other',
        total: otherTotal,
        percent: Math.round((otherTotal / total) * 1000) / 10,
        color: DONUT_COLORS[5]
      });
    }
    return segments;
  });

  readonly trendPoints = computed((): TrendPoint[] => {
    const list = this.expensesExcludingTransfers();
    const period = this.period();
    if (period === 'month' || period === 'range') {
      const start = period === 'range' ? this.dateRangeStart() : `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;
      const end = period === 'range' ? this.dateRangeEnd() : (() => {
        const d = new Date();
        const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(last).padStart(2, '0')}`;
      })();
      const startDate = new Date(start + 'T12:00:00');
      const endDate = new Date(end + 'T12:00:00');
      const byDay = new Map<string, number>();
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const key = toYYYYMMDD(d);
        byDay.set(key, 0);
      }
      list.forEach((e) => {
        if (e.date >= start && e.date <= end) {
          byDay.set(e.date, (byDay.get(e.date) ?? 0) + e.amount);
        }
      });
      const points: TrendPoint[] = [];
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const key = toYYYYMMDD(d);
        points.push({ label: key.slice(8, 10), value: byDay.get(key) ?? 0 });
      }
      return points;
    }
    const byMonth = new Map<number, number>();
    for (let m = 1; m <= 12; m++) byMonth.set(m, 0);
    list.forEach((e) => {
      const m = parseInt(e.date.slice(5, 7), 10);
      byMonth.set(m, (byMonth.get(m) ?? 0) + e.amount);
    });
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthNames.map((label, i) => ({
      label,
      value: byMonth.get(i + 1) ?? 0
    }));
  });

  readonly lineChartPath = computed(() => {
    const points = this.trendPoints();
    if (points.length === 0) return '';
    const max = Math.max(...points.map((p) => p.value), 1);
    const w = 100;
    const h = 40;
    const pad = 2;
    const xs = points.length;
    const step = xs <= 1 ? w : (w - 2 * pad) / (xs - 1);
    const pts = points.map((p, i) => {
      const x = pad + i * step;
      const y = h - pad - (p.value / max) * (h - 2 * pad);
      return `${x},${y}`;
    });
    return `M ${pts.join(' L ')}`;
  });

  readonly lineChartMaxIndex = computed(() => {
    const points = this.trendPoints();
    if (points.length === 0) return -1;
    let maxI = 0;
    points.forEach((p, i) => {
      if (p.value > points[maxI].value) maxI = i;
    });
    return maxI;
  });

  readonly lineChartLabelIndices = computed(() => {
    const points = this.trendPoints();
    if (points.length === 0) return [];
    if (this.period() === 'year') return points.map((_, i) => i);
    const n = points.length;
    if (n <= 7) return points.map((_, i) => i);
    const step = (n - 1) / 6;
    return Array.from({ length: 7 }, (_, i) => Math.min(Math.round(i * step), n - 1));
  });

  readonly lineChartHighlight = computed(() => {
    const points = this.trendPoints();
    const maxI = this.lineChartMaxIndex();
    if (points.length === 0 || maxI < 0 || points[maxI].value === 0) return null;
    const max = Math.max(...points.map((p) => p.value), 1);
    const w = 100;
    const h = 40;
    const pad = 2;
    const step = points.length <= 1 ? w : (w - 2 * pad) / (points.length - 1);
    const x = pad + maxI * step;
    const y = h - pad - (points[maxI].value / max) * (h - 2 * pad);
    return { x, y };
  });

  readonly conicGradient = computed(() => {
    const segs = this.donutSegments();
    const total = this.totalExcludingTransfers();
    if (total === 0 || segs.length === 0) return 'conic-gradient(var(--color-border-subtle) 0 100%)';
    let acc = 0;
    const parts = segs.map((s) => {
      const start = (acc / total) * 100;
      acc += s.total;
      const end = (acc / total) * 100;
      return `${s.color} ${start}% ${end}%`;
    });
    return `conic-gradient(${parts.join(', ')})`;
  });

  readonly insights = computed(() => {
    const lines: string[] = [];
    const total = this.totalAmount();
    const prev = this.previousPeriodTotal();
    const p = this.period();
    const periodLabel = p === 'month' ? 'month' : p === 'year' ? 'year' : 'period';
    if (prev > 0 && total !== prev) {
      const pct = Math.round(Math.abs((total - prev) / prev) * 100);
      const dir = total > prev ? 'higher' : 'lower';
      lines.push(`Spending is ${pct}% ${dir} than last ${periodLabel}.`);
    }
    const segs = this.donutSegments();
    if (segs.length > 0 && segs[0].percent >= 30) {
      lines.push(`${segs[0].category} accounts for ${segs[0].percent}% of total spend.`);
    }
    const table = this.categoryTable();
    if (table.length >= 2 && this.period() === 'month') {
      const last = table[table.length - 1];
      if (last.percent < 15 && table.length > 3) {
        lines.push('Several categories have a small share of spending.');
      }
    }
    return lines.slice(0, 3);
  });

  readonly zeroSpendDays = computed(() => {
    const p = this.period();
    if (p !== 'month' && p !== 'range') return null;
    const points = this.trendPoints();
    return points.filter((pt) => pt.value === 0).length;
  });

  ngOnInit(): void {
    this.refresh();
  }

  setPeriod(p: SummaryPeriod): void {
    this.period.set(p);
    if (p === 'range') {
      const now = new Date();
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      this.dateRangeStart.set(toYYYYMMDD(first));
      this.dateRangeEnd.set(toYYYYMMDD(last));
    }
    this.refresh();
  }

  setDateRange(start: string, end: string): void {
    if (start && end && start > end) {
      [start, end] = [end, start];
    }
    this.dateRangeStart.set(start);
    this.dateRangeEnd.set(end);
    this.refresh();
  }

  onRangeStartSelect(date: Date | null): void {
    if (date instanceof Date) this.setDateRange(toYYYYMMDD(date), this.dateRangeEnd());
  }

  onRangeEndSelect(date: Date | null): void {
    if (date instanceof Date) this.setDateRange(this.dateRangeStart(), toYYYYMMDD(date));
  }

  refresh(): void {
    const now = new Date();
    const p = this.period();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const y = String(now.getFullYear());

    if (p === 'month') {
      this.expenseService.getForMonth(ym).subscribe((list) => this.expenses.set(list));
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1);
      const prevYm = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
      this.expenseService.getForMonth(prevYm).subscribe((list) => {
        this.previousPeriodTotal.set(list.reduce((s, e) => s + e.amount, 0));
      });
    } else if (p === 'year') {
      this.expenseService.getForYear(y).subscribe((list) => this.expenses.set(list));
      this.expenseService.getForYear(String(now.getFullYear() - 1)).subscribe((list) => {
        this.previousPeriodTotal.set(list.reduce((s, e) => s + e.amount, 0));
      });
    } else {
      const start = this.dateRangeStart();
      const end = this.dateRangeEnd();
      if (start && end) {
        this.expenseService.getByDateRange(start, end).subscribe((list) => this.expenses.set(list));
      }
      this.previousPeriodTotal.set(0);
    }
  }

  formatCurrency(value: number): string {
    return '₹' + value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
