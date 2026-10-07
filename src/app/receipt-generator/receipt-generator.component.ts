import { Component, ViewChild, ChangeDetectorRef } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import {
  RideReceiptRow,
  createSampleReceiptRow,
  RIDE_TIME_OF_DAY_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  VEHICLE_TYPE_OPTIONS,
} from './models/ride-receipt.model';
import { ReceiptCalcService } from './services/receipt-calc.service';
import { ReceiptExportService } from './services/receipt-export.service';
import { ReceiptPreviewComponent } from './components/receipt-preview/receipt-preview.component';
import { randomIndianMaleName } from './data/indian-male-names';
import { randomNcrPlate } from './data/ncr-plates';

@Component({
  selector: 'app-receipt-generator',
  templateUrl: './receipt-generator.component.html',
  styleUrl: './receipt-generator.component.scss',
  standalone: false,
  providers: [MessageService, ConfirmationService],
})
export class ReceiptGeneratorComponent {
  @ViewChild('preview') preview!: ReceiptPreviewComponent;

  rows: RideReceiptRow[] = [];
  previewRow!: RideReceiptRow;
  exporting = false;

  readonly timeOptions = RIDE_TIME_OF_DAY_OPTIONS;
  readonly paymentOptions = PAYMENT_METHOD_OPTIONS.map((v) => ({
    label: v,
    value: v,
  }));
  readonly vehicleOptions = VEHICLE_TYPE_OPTIONS.map((v) => ({
    label: v,
    value: v,
  }));
  /** PrimeNG DatePicker: Sunday=0, Saturday=6 */
  readonly disabledDays = [0, 6];

  readonly clockHourOptions = Array.from({ length: 12 }, (_, i) => ({
    label: String(i + 1),
    value: i + 1,
  }));

  readonly clockMinuteOptions = Array.from({ length: 12 }, (_, i) => {
    const m = i * 5;
    return { label: String(m).padStart(2, '0'), value: m };
  });

  readonly clockMeridiemOptions = [
    { label: 'AM', value: 'am' as const },
    { label: 'PM', value: 'pm' as const },
  ];

  constructor(
    private calc: ReceiptCalcService,
    private exportService: ReceiptExportService,
    private messages: MessageService,
    private confirmation: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {
    const first = this.calc.applyDerived(createSampleReceiptRow(this.newId()));
    this.rows = [first];
    this.previewRow = first;
  }

  selectForPreview(row: RideReceiptRow): void {
    this.previewRow = row;
  }

  addRow(): void {
    const prev = this.rows[this.rows.length - 1];
    const next = this.calc.newRowFromPrevious(prev, this.newId());
    this.rows = [...this.rows, next];
    this.previewRow = next;
  }

  duplicateRow(row: RideReceiptRow): void {
    const next = this.calc.newRowFromPrevious(row, this.newId());
    const idx = Math.max(0, this.rows.findIndex((r) => r.id === row.id));
    const copy = [...this.rows];
    copy.splice(idx + 1, 0, next);
    this.rows = copy;
    this.previewRow = next;
  }

  confirmDeleteRow(row: RideReceiptRow): void {
    if (this.rows.length <= 1) {
      this.messages.add({
        severity: 'warn',
        summary: 'Keep one row',
        detail: 'At least one receipt row is required.',
      });
      return;
    }

    const name = row.passengerName?.trim() || 'this receipt';
    this.confirmation.confirm({
      message: `Delete row for ${name}? This cannot be undone.`,
      header: 'Delete receipt',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => this.deleteRow(row),
    });
  }

  private deleteRow(row: RideReceiptRow): void {
    if (this.rows.length <= 1) {
      this.messages.add({
        severity: 'warn',
        summary: 'Keep one row',
        detail: 'At least one receipt row is required.',
      });
      return;
    }
    const remaining = this.rows.filter((r) => r.id !== row.id);
    if (!remaining.length) return;
    this.rows = remaining;
    if (this.previewRow?.id === row.id) {
      this.previewRow = remaining[0];
    }
  }

  regenerateDriver(row: RideReceiptRow): void {
    row.driverName = randomIndianMaleName(row.driverName);
    this.touch(row);
  }

  regeneratePlate(row: RideReceiptRow): void {
    row.licensePlate = randomNcrPlate(row.licensePlate);
    this.touch(row);
  }

  swapAddresses(row: RideReceiptRow): void {
    const pickup = row.pickupAddress;
    row.pickupAddress = row.dropoffAddress;
    row.dropoffAddress = pickup;
    this.touch(row);
  }

  timeHour(row: RideReceiptRow, field: 'pickupTime' | 'dropoffTime'): number {
    return this.parseTimeParts(row[field]).hour;
  }

  timeMinute(row: RideReceiptRow, field: 'pickupTime' | 'dropoffTime'): number {
    return this.parseTimeParts(row[field]).minute;
  }

  timeMeridiem(row: RideReceiptRow, field: 'pickupTime' | 'dropoffTime'): 'am' | 'pm' {
    return this.parseTimeParts(row[field]).meridiem;
  }

  onTimeHourChange(
    row: RideReceiptRow,
    field: 'pickupTime' | 'dropoffTime',
    hour: number
  ): void {
    const parts = this.parseTimeParts(row[field]);
    this.applyTimeParts(row, field, hour, parts.minute, parts.meridiem);
  }

  onTimeMinuteChange(
    row: RideReceiptRow,
    field: 'pickupTime' | 'dropoffTime',
    minute: number
  ): void {
    const parts = this.parseTimeParts(row[field]);
    this.applyTimeParts(row, field, parts.hour, minute, parts.meridiem);
  }

  onTimeMeridiemChange(
    row: RideReceiptRow,
    field: 'pickupTime' | 'dropoffTime',
    meridiem: 'am' | 'pm'
  ): void {
    const parts = this.parseTimeParts(row[field]);
    this.applyTimeParts(row, field, parts.hour, parts.minute, meridiem);
  }

  onTotalChange(row: RideReceiptRow): void {
    Object.assign(row, this.calc.applyDerived(row));
    this.touch(row);
  }

  onTripChargeChange(row: RideReceiptRow): void {
    row.subtotal = row.tripCharge;
    this.touch(row);
  }

  onDateChange(row: RideReceiptRow, value: Date | null): void {
    if (!value) return;
    const iso = this.calc.toWeekdayIso(this.dateToIso(value));
    if (iso === row.receiptDate && this.stableDate(row)) return;
    row.receiptDate = iso;
    this.rememberDate(row, this.dateFromIso(iso));
    this.touch(row);
  }

  /** Same Date instance while the ISO value is unchanged, so the datepicker does not retrigger forever. */
  dateModel(row: RideReceiptRow): Date {
    const stable = this.stableDate(row);
    if (stable) return stable;
    return this.rememberDate(row, this.dateFromIso(row.receiptDate));
  }

  dateFromIso(iso: string): Date {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  private stableDate(row: RideReceiptRow): Date | null {
    const extra = row as RideReceiptRow & { _date?: Date; _iso?: string };
    if (extra._date && extra._iso === row.receiptDate) return extra._date;
    return null;
  }

  private rememberDate(row: RideReceiptRow, date: Date): Date {
    const extra = row as RideReceiptRow & { _date?: Date; _iso?: string };
    extra._date = date;
    extra._iso = row.receiptDate;
    return date;
  }

  private applyTimeParts(
    row: RideReceiptRow,
    field: 'pickupTime' | 'dropoffTime',
    hour: number,
    minute: number,
    meridiem: 'am' | 'pm'
  ): void {
    const minutes = String(minute).padStart(2, '0');
    const formatted = `${hour}:${minutes} ${meridiem}`;
    if (formatted === row[field]) return;
    row[field] = formatted;
    const extra = row as RideReceiptRow & Record<string, Date | string | undefined>;
    delete extra[`_${field}Date`];
    delete extra[`_${field}Text`];
    this.touch(row);
  }

  private parseTimeParts(text: string): {
    hour: number;
    minute: number;
    meridiem: 'am' | 'pm';
  } {
    const match = (text || '').trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
    if (!match) {
      return { hour: 11, minute: 30, meridiem: 'am' };
    }
    let hour = Number(match[1]);
    if (hour < 1 || hour > 12) hour = 12;
    let minute = Number(match[2]);
    if (Number.isNaN(minute)) minute = 0;
    minute = Math.min(55, Math.max(0, Math.round(minute / 5) * 5));
    const meridiem = match[3].toLowerCase() === 'pm' ? 'pm' : 'am';
    return { hour, minute, meridiem };
  }

  private dateToIso(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  touch(row: RideReceiptRow): void {
    // Keep the same object reference so the 1700×1700 preview is not destroyed/recreated
    // on every keystroke (that remount was breaking pickers, buttons, and download).
    if (this.previewRow?.id === row.id) {
      this.previewRow = row;
      this.previewTick++;
    }
  }

  /** Bumps when preview data mutates so the template refreshes without cloning the row. */
  previewTick = 0;

  async downloadRow(row: RideReceiptRow): Promise<void> {
    this.selectForPreview(row);
    await this.downloadRows([row]);
  }

  async downloadAll(): Promise<void> {
    await this.downloadRows(this.rows);
  }

  private async downloadRows(targets: RideReceiptRow[]): Promise<void> {
    for (const row of targets) {
      if (!this.validate(row)) return;
    }
    this.exporting = true;
    const previousPreview = this.previewRow;
    this.cdr.detectChanges();
    try {
      // Capture the on-screen .a4 so the PDF matches the live preview exactly.
      await this.exportService.downloadMany(targets, async (row) => {
        this.previewRow = row;
        this.previewTick++;
        this.cdr.detectChanges();
        await new Promise((r) => requestAnimationFrame(() => r(null)));
        await new Promise((r) => setTimeout(r, 120));
        const el = this.preview?.rootEl;
        if (!el) throw new Error('Preview sheet missing');
        return el;
      });
      this.messages.add({
        severity: 'success',
        summary: 'Downloaded',
        detail:
          targets.length === 1
            ? 'Receipt PDF saved.'
            : `${targets.length} receipts saved as ZIP.`,
      });
    } catch (e) {
      console.error(e);
      this.messages.add({
        severity: 'error',
        summary: 'Export failed',
        detail: 'Could not generate PDF(s).',
      });
    } finally {
      this.previewRow = previousPreview;
      this.exporting = false;
      this.cdr.detectChanges();
    }
  }

  trackRow(_index: number, row: RideReceiptRow): string {
    return row.id;
  }

  private validate(row: RideReceiptRow): boolean {
    if (!row.passengerName?.trim()) {
      this.messages.add({
        severity: 'warn',
        summary: 'Missing passenger',
        detail: 'Passenger name is required.',
      });
      return false;
    }
    if (!row.receiptDate) {
      this.messages.add({
        severity: 'warn',
        summary: 'Missing date',
        detail: 'Receipt date is required.',
      });
      return false;
    }
    if (row.total == null || Number.isNaN(row.total)) {
      this.messages.add({
        severity: 'warn',
        summary: 'Missing total',
        detail: 'Total amount is required.',
      });
      return false;
    }
    return true;
  }

  private newId(): string {
    return `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  formatInr(n: number): string {
    return this.calc.formatInr(n);
  }
}
