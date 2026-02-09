import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ExpenseService, ViewMode } from '../../services/expense.service';
import { Expense } from '../../models/expense.model';

@Component({
  selector: 'app-expense-list',
  standalone: false,
  templateUrl: './expense-list.component.html',
  styleUrl: './expense-list.component.scss'
})
export class ExpenseListComponent implements OnInit {
  private expenseService = inject(ExpenseService);

  viewMode = signal<ViewMode>('monthly');
  expenses = signal<Expense[]>([]);
  periodLabel = signal<string>('');
  unsyncedCount = signal(0);

  // For date picker (monthly view)
  currentYearMonth = signal<string>(this.getCurrentYearMonth());
  currentDay = signal<string>(this.getToday());
  currentYear = signal<string>(String(new Date().getFullYear()));

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
    if (mode === 'daily') {
      const d = this.currentDay();
      this.periodLabel.set(d);
      this.expenseService.getForDay(d).subscribe((list) => this.expenses.set(list));
    } else if (mode === 'monthly') {
      const ym = this.currentYearMonth();
      this.periodLabel.set(ym);
      this.expenseService.getForMonth(ym).subscribe((list) => this.expenses.set(list));
    } else {
      const y = this.currentYear();
      this.periodLabel.set(y);
      this.expenseService.getForYear(y).subscribe((list) => this.expenses.set(list));
    }
  }

  onPeriodChange(): void {
    this.refresh();
  }

  deleteExpense(id: string): void {
    this.expenseService.delete(id).subscribe(() => this.refresh());
  }

  private getCurrentYearMonth(): string {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${m}`;
  }

  private getToday(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
