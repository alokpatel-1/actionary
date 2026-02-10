import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ExpenseService } from '../../services/expense.service';
import { ExpenseType } from '../../models/expense.model';

/** Single list: daily, common + Miscellaneous */
export const ALL_CATEGORIES = [
  'Food',
  'Transport',
  'Parking',
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
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly allCategories = ALL_CATEGORIES;

  /** Maximum selectable date (today) — disables future dates. */
  maxDate = signal<Date>(new Date());

  form!: FormGroup;
  isEdit = signal(false);
  id = signal<string | null>(null);
  saving = signal(false);
  /** In-screen success message; cleared after 5 seconds. */
  successMessage = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.id.set(id);
    this.isEdit.set(!!id);
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    this.form = this.fb.group({
      amount: [null, [Validators.required, Validators.min(0.01)]],
      type: ['expense' as ExpenseType, Validators.required],
      category: [''],
      date: [today, Validators.required],
      note: ['']
    });

    this.form.get('type')?.valueChanges.subscribe((t: ExpenseType) => {
      const cat = this.form.get('category');
      if (t === 'transfer') {
        cat?.clearValidators();
        cat?.setValue('Transfer');
      } else {
        cat?.setValidators(Validators.required);
      }
      cat?.updateValueAndValidity();
    });

    // Set initial validator: expense requires category
    this.form.get('category')?.setValidators(Validators.required);
    this.form.get('category')?.updateValueAndValidity();

    if (id) {
      this.expenseService.getById(id).subscribe((e) => {
        if (e) {
          const type = (e.type ?? 'expense') as ExpenseType;
          this.form.patchValue({
            amount: e.amount,
            type,
            category: type === 'transfer' ? 'Transfer' : (e.category ?? ''),
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
    const type = (raw.type ?? 'expense') as ExpenseType;
    const date = this.getDateStrFromForm(raw.date);
    const payload = {
      amount: raw.amount,
      type,
      category: type === 'transfer' ? 'Transfer' : (raw.category ?? ''),
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
          this.showSuccessMessage('Record added.');
          this.resetForm();
        },
        error: () => this.saving.set(false)
      });
    }
  }

  private resetForm(): void {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    this.maxDate.set(new Date());
    this.form.patchValue({
      amount: null,
      type: 'expense',
      category: '',
      date: today,
      note: ''
    });
    this.form.markAsUntouched();
    // PrimeNG date picker can hold internal state; set date again next tick so it reflects today
    setTimeout(() => {
      const dateControl = this.form.get('date');
      if (dateControl) {
        const freshToday = new Date();
        freshToday.setHours(12, 0, 0, 0);
        dateControl.setValue(freshToday, { emitEvent: false });
      }
    }, 0);
  }

  private showSuccessMessage(text: string): void {
    this.successMessage.set(text);
    setTimeout(() => this.successMessage.set(null), 5000);
  }

  /** Normalize form date (Date or string) to YYYY-MM-DD in local time to avoid timezone data loss. */
  private getDateStrFromForm(value: Date | string | null): string {
    if (value == null) return this.todayStr();
    if (typeof value === 'string') {
      const trimmed = value.trim().slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
      const d = new Date(value + (value.length === 10 ? 'T12:00:00' : ''));
      return isNaN(d.getTime()) ? this.todayStr() : this.dateToLocalYYYYMMDD(d);
    }
    return this.dateToLocalYYYYMMDD(value);
  }

  private todayStr(): string {
    return this.dateToLocalYYYYMMDD(new Date());
  }

  /** Format date as YYYY-MM-DD in local time (avoids UTC shift when saving). */
  private dateToLocalYYYYMMDD(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
