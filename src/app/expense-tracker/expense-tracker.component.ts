import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ExpenseSyncService } from './services/expense-sync.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-expense-tracker',
  standalone: false,
  templateUrl: './expense-tracker.component.html',
  styleUrl: './expense-tracker.component.scss'
})
export class ExpenseTrackerComponent implements OnInit {
  readonly syncService = inject(ExpenseSyncService);

  navItems = [
    { label: 'Expenses', url: 'list', icon: 'pi pi-list' },
    { label: 'Add', url: 'add', icon: 'pi pi-plus' },
    { label: 'Summary', url: 'summary', icon: 'pi pi-chart-bar' },
    { label: 'Settings', url: 'settings', icon: 'pi pi-cog' }
  ];

  ngOnInit(): void {
    this.syncService.tryAutoSync();
  }
}
