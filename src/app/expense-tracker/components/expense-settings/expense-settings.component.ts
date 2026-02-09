import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExpenseSyncService } from '../../services/expense-sync.service';
import { ExpenseExportService, ExportScope, ExportOptions } from '../../services/expense-export.service';
import { ExpenseIdbService } from '../../services/expense-idb.service';

@Component({
  selector: 'app-expense-settings',
  standalone: false,
  templateUrl: './expense-settings.component.html',
  styleUrl: './expense-settings.component.scss'
})
export class ExpenseSettingsComponent {
  readonly syncService = inject(ExpenseSyncService);
  readonly exportService = inject(ExpenseExportService);
  readonly idb = inject(ExpenseIdbService);

  exportScope: ExportScope = 'current-year';
  exportFormat: 'json' | 'csv' = 'json';
  customStart: Date | null = null;
  customEnd: Date | null = null;
  unsyncedCount = signal(0);
  exporting = signal(false);
  syncInProgress = signal(false);

  constructor() {
    this.idb.getUnsyncedCount().then((c) => this.unsyncedCount.set(c));
  }

  private toYYYYMMDD(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  syncNow(): void {
    if (this.syncInProgress()) return;
    this.syncInProgress.set(true);
    this.syncService.sync().subscribe({
      next: (r) => {
        this.syncInProgress.set(false);
        if (r.success) {
          this.idb.getUnsyncedCount().then((c) => this.unsyncedCount.set(c));
        }
      },
      error: () => this.syncInProgress.set(false)
    });
  }

  async export(): Promise<void> {
    if (this.exporting()) return;
    const scope = this.exportScope;
    const options: ExportOptions = {
      scope,
      format: this.exportFormat
    };
    if (scope === 'custom') {
      options.startDate = this.customStart ? this.toYYYYMMDD(this.customStart) : undefined;
      options.endDate = this.customEnd ? this.toYYYYMMDD(this.customEnd) : undefined;
      if (!options.startDate || !options.endDate) {
        return;
      }
    }
    this.exporting.set(true);
    try {
      const blob = await this.exportService.export(options);
      const ext = options.format === 'json' ? 'json' : 'csv';
      const scopeLabel = scope === 'current-year' ? 'current-year' : scope === 'last-year' ? 'last-year' : 'custom';
      this.exportService.downloadBlob(blob, `expenses-${scopeLabel}-${Date.now()}.${ext}`);
    } catch (e) {
      console.error(e);
    } finally {
      this.exporting.set(false);
    }
  }
}
