import { Component, ViewChild, ChangeDetectorRef, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DatePickerMonthChangeEvent } from 'primeng/datepicker';
import {
  RideReceiptRow,
  createSampleReceiptRow,
  RIDE_TIME_OF_DAY_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  VEHICLE_TYPE_OPTIONS,
} from '../../models/ride-receipt.model';
import { BulkPreviewItem } from '../../models/bulk-receipt.model';
import { ReceiptCalcService } from '../../services/receipt-calc.service';
import { ReceiptExportService } from '../../services/receipt-export.service';
import { ReceiptPreviewComponent } from '../receipt-preview/receipt-preview.component';
import { randomIndianMaleName } from '../../data/indian-male-names';
import { randomNcrPlate } from '../../data/ncr-plates';

@Component({
  selector: 'app-bulk-create',
  templateUrl: './bulk-create.component.html',
  styleUrl: './bulk-create.component.scss',
  standalone: false,
  providers: [MessageService, ConfirmationService],
})
export class BulkCreateComponent implements OnInit {
  @ViewChild('preview') preview!: ReceiptPreviewComponent;

  rows: RideReceiptRow[] = [];
  previewRow!: RideReceiptRow;
  exporting = false;

  bulkDialogVisible = true;
  showSettings = true;
  showRegenerateConfirm = false;
  pendingCollapseSettings = true;
  bulkSelectedDates: Date[] = [];
  bulkCalendarMonth = new Date();
  bulkPreviewRows: BulkPreviewItem[] = [];

  bulkTripMin = 0;
  bulkTripMax = 0;
  bulkDistanceMin = 0;
  bulkDistanceMax = 0;
  bulkInterstateRanged = false;
  bulkInterstateMin = 0;
  bulkInterstateMax = 0;
  bulkPromotionRanged = false;
  bulkPromotionMin = 0;
  bulkPromotionMax = 0;
  bulkAvgDurationMin = 40;

  get bulkTableScrollHeight(): string {
    return this.showSettings ? 'calc(100vh - 34rem)' : 'calc(100vh - 12rem)';
  }

  readonly timeOptions = RIDE_TIME_OF_DAY_OPTIONS;
  readonly paymentOptions = PAYMENT_METHOD_OPTIONS.map((v: string) => ({
    label: v,
    value: v,
  }));
  readonly vehicleOptions = VEHICLE_TYPE_OPTIONS.map((v: string) => ({
    label: v,
    value: v,
  }));
  /** PrimeNG DatePicker: empty array so no day is disabled */
  readonly disabledDays: number[] = [];

  readonly clockHourOptions = Array.from({ length: 12 }, (_, i) => ({
    label: String(i + 1),
    value: i + 1,
  }));

  readonly clockMinuteOptions = Array.from({ length: 60 }, (_, i) => {
    return { label: String(i).padStart(2, '0'), value: i };
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
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    const state = history.state as { templateRow?: RideReceiptRow };
    if (!state.templateRow) {
      this.router.navigate(['/receipt-generator']);
      return;
    }

    this.previewRow = state.templateRow;
    this.rows = [this.previewRow];

    const t = this.previewRow;
    this.showSettings = true;
    this.bulkPreviewRows = [];
    this.bulkSelectedDates = [];
    this.bulkCalendarMonth = new Date();
    this.bulkTripMin = this.calc.truncate2(t.tripCharge * 0.85);
    this.bulkTripMax = this.calc.truncate2(t.tripCharge * 1.15);
    this.bulkDistanceMin = this.calc.truncate2(Math.max(1, t.distanceKm * 0.85));
    this.bulkDistanceMax = this.calc.truncate2(t.distanceKm * 1.15);
    this.bulkInterstateRanged = false;
    this.bulkInterstateMin = t.interstateCharges;
    this.bulkInterstateMax = t.interstateCharges;
    this.bulkPromotionRanged = false;
    this.bulkPromotionMin = 0;
    this.bulkPromotionMax = 0;
    this.bulkAvgDurationMin = t.durationMin || 40;
  }

  selectForPreview(row: RideReceiptRow): void {
    this.previewRow = row;
  }

  toggleSettings(): void {
    this.showSettings = !this.showSettings;
  }

  onPassengerNameChange(newName: string): void {
    if (this.previewRow) {
      this.previewRow.passengerName = newName;
    }
    for (const item of this.bulkPreviewRows) {
      item.row.passengerName = newName;
      item.exportFilename = this.defaultExportBasename(item.row);
    }
  }

  onPickupAddressChange(newAddress: string): void {
    if (this.previewRow) {
      this.previewRow.pickupAddress = newAddress;
    }
    for (const item of this.bulkPreviewRows) {
      item.row.pickupAddress = newAddress;
    }
  }

  onDropoffAddressChange(newAddress: string): void {
    if (this.previewRow) {
      this.previewRow.dropoffAddress = newAddress;
    }
    for (const item of this.bulkPreviewRows) {
      item.row.dropoffAddress = newAddress;
    }
  }

  onTemplateFieldChange(): void {
    if (!this.previewRow) return;
    for (const item of this.bulkPreviewRows) {
      item.row.vehicleType = this.previewRow.vehicleType;
      item.row.paymentMethod = this.previewRow.paymentMethod;
      item.row.driverName = this.previewRow.driverName;
    }
  }

  onTemplatePickupTimeChange(time24: string): void {
    if (!this.previewRow) return;
    this.onTime24Change(this.previewRow, 'pickupTime', time24, true);
    for (const item of this.bulkPreviewRows) {
      item.row.pickupTime = this.previewRow.pickupTime;
      this.onBulkTimeFieldChange(item.row);
    }
  }

  onTemplateDropoffTimeChange(time24: string): void {
    if (!this.previewRow) return;
    this.onTime24Change(this.previewRow, 'dropoffTime', time24, true);
    for (const item of this.bulkPreviewRows) {
      item.row.dropoffTime = this.previewRow.dropoffTime;
      this.onBulkTimeFieldChange(item.row);
    }
  }

  swapSettingsAddresses(): void {
    if (!this.previewRow) return;
    const temp = this.previewRow.pickupAddress;
    this.previewRow.pickupAddress = this.previewRow.dropoffAddress;
    this.previewRow.dropoffAddress = temp;

    for (const item of this.bulkPreviewRows) {
      const t = item.row.pickupAddress;
      item.row.pickupAddress = item.row.dropoffAddress;
      item.row.dropoffAddress = t;
    }
  }

  swapRowAddresses(row: RideReceiptRow): void {
    const temp = row.pickupAddress;
    row.pickupAddress = row.dropoffAddress;
    row.dropoffAddress = temp;
  }

  clearSelectedDates(): void {
    this.bulkSelectedDates = [];
  }

  clearAllRows(): void {
    if (!this.bulkPreviewRows.length) return;
    this.confirmation.confirm({
      header: 'Delete All Rows',
      message: 'Are you sure you want to delete all generated rows from the table?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Yes, Delete All',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.bulkPreviewRows = [];
        this.messages.add({
          severity: 'info',
          summary: 'Cleared',
          detail: 'All rows removed from table.',
        });
      },
    });
  }

  openBulkDialog(): void { }

  onBulkDialogHide(): void {
    this.router.navigate(['/receipt-generator']);
  }

  onBulkMonthChange(event: DatePickerMonthChangeEvent): void {
    const { month, year } = event;
    if (month == null || year == null) {
      return;
    }
    this.bulkCalendarMonth = new Date(year, month, 1);
  }

  fillWeekdaysInVisibleMonth(): void {
    const y = this.bulkCalendarMonth.getFullYear();
    const m = this.bulkCalendarMonth.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const isoSet = new Set(this.bulkSelectedDates.map((d) => this.dateToIso(d)));
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(y, m, day);
      const dow = d.getDay();
      if (dow !== 0 && dow !== 6) {
        isoSet.add(this.dateToIso(d));
      }
    }
    this.bulkSelectedDates = Array.from(isoSet)
      .sort()
      .map((iso) => this.dateFromIso(iso));
  }

  fillAllDaysInVisibleMonth(): void {
    const y = this.bulkCalendarMonth.getFullYear();
    const m = this.bulkCalendarMonth.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const isoSet = new Set(this.bulkSelectedDates.map((d) => this.dateToIso(d)));
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(y, m, day);
      isoSet.add(this.dateToIso(d));
    }
    this.bulkSelectedDates = Array.from(isoSet)
      .sort()
      .map((iso) => this.dateFromIso(iso));
  }

  bulkSelectedCount(): number {
    return this.bulkSelectedDates?.length ?? 0;
  }

  generateBulkPreviewRows(collapseSettings = true): void {
    const rangeError = this.validateBulkRanges();
    if (rangeError) {
      this.messages.add({
        severity: 'warn',
        summary: 'Invalid ranges',
        detail: rangeError,
      });
      return;
    }
    if (!this.bulkSelectedDates.length) {
      this.messages.add({
        severity: 'warn',
        summary: 'Select dates',
        detail: 'Pick at least one date to generate receipts.',
      });
      return;
    }

    if (this.bulkPreviewRows.length > 0) {
      this.pendingCollapseSettings = collapseSettings;
      this.showRegenerateConfirm = true;
    } else {
      this.executeGenerateBulkRows('replace', collapseSettings);
    }
  }

  executeGenerateBulkRows(mode: 'replace' | 'appendMissing', collapseSettings = true): void {
    this.showRegenerateConfirm = false;
    const dates = this.bulkSelectedDates.map((d) =>
      this.dateToIso(d)
    );
    const uniqueDates = [...new Set(dates)].sort();

    if (mode === 'replace') {
      const generated = this.calc.generateBulkRows({
        template: this.previewRow,
        dates: uniqueDates,
        tripCharge: { min: this.bulkTripMin, max: this.bulkTripMax },
        distanceKm: { min: this.bulkDistanceMin, max: this.bulkDistanceMax },
        interstateCharges: this.bulkInterstateRanged
          ? { min: this.bulkInterstateMin, max: this.bulkInterstateMax }
          : undefined,
        promotion: this.bulkPromotionRanged
          ? { min: this.bulkPromotionMin, max: this.bulkPromotionMax }
          : { min: 0, max: 0 },
        avgDurationMin: this.bulkAvgDurationMin,
        newId: () => this.newId(),
      });
      this.bulkPreviewRows = generated.map((row: RideReceiptRow) => ({
        row,
        exportFilename: this.defaultExportBasename(row),
      }));
    } else {
      const existingDateSet = new Set(
        this.bulkPreviewRows.map((item) => item.row.receiptDate)
      );
      const missingDates = uniqueDates.filter((d) => !existingDateSet.has(d));

      if (missingDates.length === 0) {
        this.messages.add({
          severity: 'info',
          summary: 'No missing dates',
          detail: 'All selected dates are already present in the table.',
        });
        if (collapseSettings) this.showSettings = false;
        return;
      }

      const existingPlates = this.bulkPreviewRows
        .map((item) => item.row.licensePlate)
        .filter(Boolean);

      const generated = this.calc.generateBulkRows({
        template: this.previewRow,
        dates: missingDates,
        existingPlates,
        tripCharge: { min: this.bulkTripMin, max: this.bulkTripMax },
        distanceKm: { min: this.bulkDistanceMin, max: this.bulkDistanceMax },
        interstateCharges: this.bulkInterstateRanged
          ? { min: this.bulkInterstateMin, max: this.bulkInterstateMax }
          : undefined,
        promotion: this.bulkPromotionRanged
          ? { min: this.bulkPromotionMin, max: this.bulkPromotionMax }
          : { min: 0, max: 0 },
        avgDurationMin: this.bulkAvgDurationMin,
        newId: () => this.newId(),
      });

      const newItems: BulkPreviewItem[] = generated.map((row: RideReceiptRow) => ({
        row,
        exportFilename: this.defaultExportBasename(row),
      }));

      const combined = [...this.bulkPreviewRows, ...newItems];
      combined.sort((a, b) => (a.row.receiptDate < b.row.receiptDate ? -1 : 1));
      this.bulkPreviewRows = combined;

      this.messages.add({
        severity: 'success',
        summary: 'Rows added',
        detail: `Added ${newItems.length} new row(s) for missing dates. Existing rows were preserved.`,
      });
    }

    if (collapseSettings) {
      this.showSettings = false;
    }
  }

  onBulkChargeFieldChange(row: RideReceiptRow): void {
    Object.assign(row, this.calc.applyBulkChargeDerived(row));
  }

  onBulkTotalFieldChange(row: RideReceiptRow): void {
    Object.assign(row, this.calc.applyDerived(row));
  }

  deleteBulkPreviewItem(item: BulkPreviewItem): void {
    if (this.bulkPreviewRows.length <= 1) {
      this.messages.add({
        severity: 'warn',
        summary: 'Keep one row',
        detail: 'At least one receipt is required in the batch.',
      });
      return;
    }
    this.bulkPreviewRows = this.bulkPreviewRows.filter((x) => x !== item);
  }

  async downloadBulkPreviewItem(item: BulkPreviewItem): Promise<void> {
    if (!this.validate(item.row)) return;
    await this.downloadRows([item.row], (row, _i) => item.exportFilename);
  }

  async confirmBulkGenerate(): Promise<void> {
    if (!this.bulkPreviewRows.length) return;

    for (const item of this.bulkPreviewRows) {
      if (!this.validate(item.row)) return;
    }
    if (!this.validateUniqueLicensePlates(this.bulkPreviewRows.map((item) => item.row))) {
      return;
    }
    const filenameMap = new Map(
      this.bulkPreviewRows.map((item) => [item.row.id, item.exportFilename])
    );
    this.rows = this.bulkPreviewRows.map((item) => item.row);
    if (this.rows.length) {
      this.previewRow = this.rows[0];
    }
    this.previewTick++;
    this.cdr.detectChanges();
    await this.downloadRows(
      this.rows,
      (row, i) => filenameMap.get(row.id) ?? this.defaultExportBasename(row)
    );
  }

  defaultExportBasename(row: RideReceiptRow): string {
    return this.exportService
      .filenameFor(row)
      .replace(/\.pdf$/i, '');
  }

  exportExcel(): void {
    if (!this.bulkPreviewRows.length) return;
    for (const item of this.bulkPreviewRows) {
      if (!this.validate(item.row)) return;
    }
    if (!this.validateUniqueLicensePlates(this.bulkPreviewRows.map((item) => item.row))) {
      return;
    }
    const rows = this.bulkPreviewRows.map((item) => item.row);
    this.exportService.downloadExcel(rows, 'receipts_summary.xlsx');
    this.messages.add({
      severity: 'success',
      summary: 'Excel Exported',
      detail: `Exported Excel summary with ${rows.length} receipt(s).`,
    });
  }

  private validateBulkRanges(): string | null {
    const check = (label: string, min: number, max: number): string | null => {
      if (Number.isNaN(min) || Number.isNaN(max)) {
        return `${label}: enter min and max values.`;
      }
      if (min > max) {
        return `${label}: min cannot be greater than max.`;
      }
      return null;
    };
    let err =
      check('Trip charge', this.bulkTripMin, this.bulkTripMax) ??
      check('Distance', this.bulkDistanceMin, this.bulkDistanceMax);
    if (err) return err;
    if (this.bulkInterstateRanged) {
      err = check('Interstate charges', this.bulkInterstateMin, this.bulkInterstateMax);
      if (err) return err;
    }
    if (this.bulkPromotionRanged) {
      err = check('Promotion', this.bulkPromotionMin, this.bulkPromotionMax);
      if (err) return err;
    }
    if (
      Number.isNaN(this.bulkAvgDurationMin) ||
      this.bulkAvgDurationMin < 5
    ) {
      return 'Typical trip duration must be at least 5 minutes.';
    }
    return null;
  }

  onBulkTimeFieldChange(row: RideReceiptRow): void {
    row.durationMin = this.calc.durationMinutes(
      row.pickupTime,
      row.dropoffTime
    );
    row.rideTimeOfDay = this.calc.timeOfDayFromPickup(row.pickupTime);
  }

  onBulkTimeHourChange(
    row: RideReceiptRow,
    field: 'pickupTime' | 'dropoffTime',
    hour: number
  ): void {
    this.onTimeHourChange(row, field, hour);
    this.onBulkTimeFieldChange(row);
  }

  onBulkTimeMinuteChange(
    row: RideReceiptRow,
    field: 'pickupTime' | 'dropoffTime',
    minute: number
  ): void {
    this.onTimeMinuteChange(row, field, minute);
    this.onBulkTimeFieldChange(row);
  }

  onBulkTimeMeridiemChange(
    row: RideReceiptRow,
    field: 'pickupTime' | 'dropoffTime',
    meridiem: 'am' | 'pm'
  ): void {
    this.onTimeMeridiemChange(row, field, meridiem);
    this.onBulkTimeFieldChange(row);
  }

  formatBulkDate(iso: string): string {
    return this.calc.formatReceiptDateLong(iso);
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

  timeTo24(time12: string): string {
    const parts = this.parseTimeParts(time12);
    let h = parts.hour;
    if (parts.meridiem === 'pm' && h < 12) h += 12;
    if (parts.meridiem === 'am' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`;
  }

  onTime24Change(
    row: RideReceiptRow,
    field: 'pickupTime' | 'dropoffTime',
    val: string,
    isBulk = false
  ): void {
    if (!val) return;
    const [hh, mm] = val.split(':').map(Number);
    let h = hh % 12;
    if (h === 0) h = 12;
    const meridiem = hh >= 12 ? 'pm' : 'am';
    this.applyTimeParts(row, field, h, mm, meridiem);
    if (isBulk) {
      this.onBulkTimeFieldChange(row);
    }
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
    row.durationMin = this.calc.durationMinutes(row.pickupTime, row.dropoffTime);
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
    minute = Math.min(59, Math.max(0, minute));
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

  private async downloadRows(
    targets: RideReceiptRow[],
    getCustomFilename?: (row: RideReceiptRow, index: number) => string | undefined
  ): Promise<void> {
    for (const row of targets) {
      if (!this.validate(row)) return;
    }
    this.exporting = true;
    const previousPreview = this.previewRow;
    this.cdr.detectChanges();
    try {
      // Capture the on-screen .a4 so the PDF matches the live preview exactly.
      await this.exportService.downloadMany(
        targets,
        async (row: RideReceiptRow) => {
          this.previewRow = row;
          this.previewTick++;
          this.cdr.detectChanges();
          await new Promise((r) => requestAnimationFrame(() => r(null)));
          await new Promise((r) => setTimeout(r, 120));
          const el = this.preview?.rootEl;
          if (!el) throw new Error('Preview sheet missing');
          return el;
        },
        'uber_receipts.zip',
        getCustomFilename
      );
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

  hasDuplicatePlate(row: RideReceiptRow): boolean {
    const plate = (row.licensePlate || '').trim().toUpperCase().replace(/\s+/g, '');
    if (!plate) return true;
    return (
      this.bulkPreviewRows.filter(
        (item) =>
          (item.row.licensePlate || '').trim().toUpperCase().replace(/\s+/g, '') === plate
      ).length > 1
    );
  }

  private validateUniqueLicensePlates(rows: RideReceiptRow[]): boolean {
    const seen = new Map<string, number>();
    const duplicates = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const plate = (rows[i].licensePlate || '').trim();
      if (!plate) {
        this.messages.add({
          severity: 'warn',
          summary: 'Missing license plate',
          detail: `License plate is required for row ${i + 1} (${this.formatBulkDate(rows[i].receiptDate)}).`,
        });
        return false;
      }

      const norm = plate.toUpperCase().replace(/\s+/g, '');
      if (seen.has(norm)) {
        duplicates.add(plate.toUpperCase());
      } else {
        seen.set(norm, i);
      }
    }

    if (duplicates.size > 0) {
      const dupList = Array.from(duplicates).join(', ');
      this.messages.add({
        severity: 'error',
        summary: 'Duplicate license plate',
        detail: `Export blocked: Every receipt row must have a different license plate number. Duplicate found: ${dupList}`,
      });
      return false;
    }

    return true;
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
    if (!row.licensePlate?.trim()) {
      this.messages.add({
        severity: 'warn',
        summary: 'Missing license plate',
        detail: 'License plate number is required for every row.',
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
