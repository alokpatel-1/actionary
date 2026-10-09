import { Injectable } from '@angular/core';
import { BulkGenerateOptions, NumericRange } from '../models/bulk-receipt.model';
import { RideReceiptRow, RideTimeOfDay } from '../models/ride-receipt.model';
import { randomIndianMaleName } from '../data/indian-male-names';
import { randomNcrPlate } from '../data/ncr-plates';

@Injectable({ providedIn: 'root' })
export class ReceiptCalcService {
  /** Minutes ± around typical duration when bulk-generating (not shown in UI). */
  readonly bulkDurationSpreadMin = 10;

  /** Truncate (not round) to 2 decimal places — matches sample GST 14.74 from 294.93. */
  truncate2(value: number): number {
    return Math.trunc(value * 100) / 100;
  }

  gstFromTotal(total: number): number {
    return this.truncate2(total * 0.05);
  }

  /** Maps pickup time string (e.g. "11:30 am") to the appropriate time-of-day label. */
  timeOfDayFromPickup(pickupTime: string): RideTimeOfDay {
    const mins = this.clockMinutes(pickupTime);
    if (mins == null) return 'morning';
    const hour = Math.floor(mins / 60);
    if (hour >= 5  && hour < 12) return 'morning';
    if (hour >= 12 && hour < 14) return 'noon';
    if (hour >= 14 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }

  applyDerived(row: RideReceiptRow): RideReceiptRow {
    return {
      ...row,
      subtotal: row.tripCharge,
      paymentsAmount: row.total,
      gstAmount: this.gstFromTotal(row.total),
      durationMin: this.durationMinutes(row.pickupTime, row.dropoffTime),
      receiptDate: row.receiptDate,
      rideTimeOfDay: this.timeOfDayFromPickup(row.pickupTime),
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

  clockMinutes(text: string): number | null {
    const match = (text || '').trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
    if (!match) return null;
    let hour = Number(match[1]) % 12;
    if (match[3].toLowerCase() === 'pm') hour += 12;
    return hour * 60 + Number(match[2]);
  }

  minutesToClockText(totalMinutes: number): string {
    const mins = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
    const h24 = Math.floor(mins / 60);
    const m = Math.round((mins % 60) / 5) * 5 % 60;
    const meridiem = h24 >= 12 ? 'pm' : 'am';
    let h12 = h24 % 12;
    if (h12 === 0) h12 = 12;
    return `${h12}:${String(m).padStart(2, '0')} ${meridiem}`;
  }

  addMinutesToPickup(pickup: string, durationMin: number): string {
    const start = this.clockMinutes(pickup);
    if (start == null) return pickup;
    return this.minutesToClockText(start + durationMin);
  }

  /** Random duration in 5-min steps, within ±spread of avg. */
  randomDurationNear(avg: number, spread: number): number {
    const safeAvg = Math.max(5, Math.round(avg / 5) * 5);
    const safeSpread = Math.max(0, spread);
    const low = Math.max(5, safeAvg - safeSpread);
    const high = safeAvg + safeSpread;
    const raw = low + Math.random() * (high - low);
    return Math.max(5, Math.round(raw / 5) * 5);
  }

  /** Small pickup jitter (5-min steps) so dropoff times differ per row. */
  jitterPickupTime(pickup: string, maxShiftMin: number): string {
    const start = this.clockMinutes(pickup);
    if (start == null) return pickup;
    const steps = Math.max(0, Math.round(maxShiftMin / 5));
    const deltaSteps = Math.floor(Math.random() * (steps * 2 + 1)) - steps;
    return this.minutesToClockText(start + deltaSteps * 5);
  }

  applyRandomTripTimes(
    template: RideReceiptRow,
    avgDurationMin: number,
    durationSpreadMin: number
  ): Pick<RideReceiptRow, 'pickupTime' | 'dropoffTime' | 'durationMin'> {
    const pickupTime = this.jitterPickupTime(template.pickupTime, 15);
    const durationMin = this.randomDurationNear(avgDurationMin, durationSpreadMin);
    const dropoffTime = this.addMinutesToPickup(pickupTime, durationMin);
    return {
      pickupTime,
      dropoffTime,
      durationMin: this.durationMinutes(pickupTime, dropoffTime),
    };
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

  randomInRange(range: NumericRange): number {
    const { min, max } = range;
    if (max <= min) return this.truncate2(min);
    return this.truncate2(min + Math.random() * (max - min));
  }

  totalFromCharges(
    tripCharge: number,
    interstateCharges: number,
    promotion: number
  ): number {
    return this.truncate2(tripCharge + interstateCharges + promotion);
  }

  /** Recompute total from line items, then GST, duration, etc. (bulk review only). */
  applyBulkChargeDerived(row: RideReceiptRow): RideReceiptRow {
    const total = this.totalFromCharges(
      row.tripCharge,
      row.interstateCharges ?? 0,
      row.promotion ?? 0
    );
    return this.applyDerived({ ...row, total, subtotal: row.tripCharge });
  }

  generateBulkRows(options: BulkGenerateOptions): RideReceiptRow[] {
    const { template, dates, newId } = options;
    const sorted = [...dates].sort();
    const usedDrivers = new Set<string>();
    const usedPlates = new Set<string>(
      (options.existingPlates || []).map((p) => p.trim().toUpperCase().replace(/\s+/g, ''))
    );

    const pickDriver = (): string => {
      let name = randomIndianMaleName();
      for (let i = 0; i < 40 && usedDrivers.has(name); i++) {
        name = randomIndianMaleName(name);
      }
      usedDrivers.add(name);
      return name;
    };

    const pickPlate = (): string => {
      let plate = randomNcrPlate();
      let norm = plate.trim().toUpperCase().replace(/\s+/g, '');
      for (let i = 0; i < 50 && usedPlates.has(norm); i++) {
        plate = randomNcrPlate(plate);
        norm = plate.trim().toUpperCase().replace(/\s+/g, '');
      }
      usedPlates.add(norm);
      return plate;
    };

    return sorted.map((iso) => {
      const tripCharge = this.randomInRange(options.tripCharge);
      const distanceKm = this.randomInRange(options.distanceKm);
      const interstateCharges = options.interstateCharges
        ? this.randomInRange(options.interstateCharges)
        : template.interstateCharges;
      const promotion = options.promotion
        ? this.randomInRange(options.promotion)
        : template.promotion;
      const total = this.totalFromCharges(
        tripCharge,
        interstateCharges,
        promotion
      );

      const times = this.applyRandomTripTimes(
        template,
        options.avgDurationMin,
        this.bulkDurationSpreadMin
      );

      const base: RideReceiptRow = {
        ...template,
        id: newId(),
        receiptDate: iso,
        driverName: pickDriver(),
        licensePlate: pickPlate(),
        tripCharge,
        distanceKm,
        interstateCharges,
        promotion,
        total,
        subtotal: tripCharge,
        pickupTime: times.pickupTime,
        dropoffTime: times.dropoffTime,
        durationMin: times.durationMin,
      };

      return this.applyDerived(base);
    });
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
