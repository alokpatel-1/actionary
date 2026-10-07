import { Injectable } from '@angular/core';
import { RideReceiptRow } from '../models/ride-receipt.model';
import { randomIndianMaleName } from '../data/indian-male-names';
import { randomNcrPlate } from '../data/ncr-plates';

@Injectable({ providedIn: 'root' })
export class ReceiptCalcService {
  /** Truncate (not round) to 2 decimal places — matches sample GST 14.74 from 294.93. */
  truncate2(value: number): number {
    return Math.trunc(value * 100) / 100;
  }

  gstFromTotal(total: number): number {
    return this.truncate2(total * 0.05);
  }

  applyDerived(row: RideReceiptRow): RideReceiptRow {
    return {
      ...row,
      subtotal: row.tripCharge,
      paymentsAmount: row.total,
      gstAmount: this.gstFromTotal(row.total),
      durationMin: this.durationMinutes(row.pickupTime, row.dropoffTime),
      receiptDate: this.toWeekdayIso(row.receiptDate),
    };
  }

  /** Minutes from pickup to dropoff. If dropoff is earlier, the trip crosses midnight. */
  durationMinutes(pickup: string, dropoff: string): number {
    const start = this.clockMinutes(pickup);
    const end = this.clockMinutes(dropoff);
    if (start == null || end == null) return 0;
    let diff = end - start;
    if (diff < 0) diff += 24 * 60;
    return diff;
  }

  private clockMinutes(text: string): number | null {
    const match = (text || '').trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
    if (!match) return null;
    let hour = Number(match[1]) % 12;
    if (match[3].toLowerCase() === 'pm') hour += 12;
    return hour * 60 + Number(match[2]);
  }

  /** Saturday = 6, Sunday = 0 — skip to next Monday. */
  toWeekdayIso(iso: string): string {
    const d = this.parseIso(iso);
    const day = d.getDay();
    if (day === 6) d.setDate(d.getDate() + 2);
    else if (day === 0) d.setDate(d.getDate() + 1);
    return this.toIso(d);
  }

  nextWeekdayIso(iso: string): string {
    const d = this.parseIso(iso);
    d.setDate(d.getDate() + 1);
    return this.toWeekdayIso(this.toIso(d));
  }

  isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6;
  }

  formatReceiptDateLong(iso: string): string {
    const d = this.parseIso(iso);
    return d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  /** Sample shape: 5/1/25 11:30 am */
  formatTripDateTime(iso: string, pickupTime: string): string {
    const d = this.parseIso(iso);
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const y = String(d.getFullYear()).slice(-2);
    return `${m}/${day}/${y} ${pickupTime}`;
  }

  formatInr(amount: number, withSign = false): string {
    const formatted = Math.abs(amount).toFixed(2);
    if (withSign && amount < 0) return `-₹${formatted}`;
    return `₹${formatted}`;
  }

  formatDistanceLine(distanceKm: number, durationMin: number): string {
    const km = distanceKm.toFixed(2);
    return `${km} kilometres | ${durationMin} min(s)`;
  }

  newRowFromPrevious(prev: RideReceiptRow, id: string): RideReceiptRow {
    const nextDate = this.nextWeekdayIso(prev.receiptDate);
    return this.applyDerived({
      ...prev,
      id,
      receiptDate: nextDate,
      driverName: randomIndianMaleName(prev.driverName),
      licensePlate: randomNcrPlate(prev.licensePlate),
    });
  }

  private parseIso(iso: string): Date {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  private toIso(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
