import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ExpenseService } from '../../services/expense.service';
import { ExpenseType } from '../../models/expense.model';

/** Single list: daily, common + Miscellaneous */
export const ALL_CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Entertainment',
  'Health',
  'Bills',
  'Rent',
  'Subscriptions',
  'Groceries',
  'Miscellaneous'
];

@Component({
  selector: 'app-expense-form',
  standalone: false,
  templateUrl: './expense-form.component.html',
  styleUrl: './expense-form.component.scss'
})
export class ExpenseFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private expenseService = inject(ExpenseService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly allCategories = ALL_CATEGORIES;

  form!: FormGroup;
  isEdit = signal(false);
  id = signal<string | null>(null);
  saving = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.id.set(id);
    this.isEdit.set(!!id);
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    this.form = this.fb.group({
      amount: [null, [Validators.required, Validators.min(0.01)]],
      type: ['expense' as ExpenseType, Validators.required],
      category: ['', Validators.required],
      date: [today, Validators.required],
      note: ['']
    });

    if (id) {
      this.expenseService.getById(id).subscribe((e) => {
        if (e) {
          this.form.patchValue({
            amount: e.amount,
            type: e.type ?? 'expense',
            category: e.category,
            date: e.date ? new Date(e.date + 'T12:00:00') : null,
            note: e.note ?? ''
          });
        }
      });
    }
  }

  submit(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    const raw = this.form.getRawValue();
    const date = typeof raw.date === 'string' ? raw.date : (raw.date as Date)?.toISOString?.().slice(0, 10) ?? this.todayStr();
    const payload = {
      amount: raw.amount,
      type: (raw.type ?? 'expense') as ExpenseType,
      category: raw.category,
      date,
      note: raw.note ?? ''
    };

    if (this.isEdit() && this.id()) {
      this.expenseService.update(this.id()!, payload).subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigate(['/expenses', 'list']);
        },
        error: () => this.saving.set(false)
      });
    } else {
      this.expenseService.add(payload).subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigate(['/expenses', 'list']);
        },
        error: () => this.saving.set(false)
      });
    }
  }

  private todayStr(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
