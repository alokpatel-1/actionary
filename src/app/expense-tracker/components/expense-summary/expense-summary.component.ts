import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExpenseService } from '../../services/expense.service';
import { Expense } from '../../models/expense.model';

interface CategoryTotal {
  category: string;
  total: number;
  count: number;
}

@Component({
  selector: 'app-expense-summary',
  standalone: false,
  templateUrl: './expense-summary.component.html',
  styleUrl: './expense-summary.component.scss'
})
export class ExpenseSummaryComponent implements OnInit {
  private expenseService = inject(ExpenseService);

  totalAmount = signal(0);
  totalCount = signal(0);
  byCategory = signal<CategoryTotal[]>([]);
  yearMonth = signal<string>(this.getCurrentYearMonth());

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    const ym = this.yearMonth();
    this.expenseService.getForMonth(ym).subscribe((list) => {
      this.totalCount.set(list.length);
      const total = list.reduce((s, e) => s + e.amount, 0);
      this.totalAmount.set(total);
      const byCat = new Map<string, { total: number; count: number }>();
      list.forEach((e) => {
        const cur = byCat.get(e.category) ?? { total: 0, count: 0 };
        cur.total += e.amount;
        cur.count += 1;
        byCat.set(e.category, cur);
      });
      this.byCategory.set(
        Array.from(byCat.entries())
          .map(([category, v]) => ({ category, total: v.total, count: v.count }))
          .sort((a, b) => b.total - a.total)
      );
    });
  }

  onMonthChange(ym: string): void {
    this.yearMonth.set(ym);
    this.refresh();
  }

  private getCurrentYearMonth(): string {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${m}`;
  }
}
