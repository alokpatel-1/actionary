import { Injectable } from '@angular/core';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import { RideReceiptRow } from '../models/ride-receipt.model';
import { ReceiptPdfService } from './receipt-pdf.service';

@Injectable({ providedIn: 'root' })
export class ReceiptExportService {
  constructor(private pdfService: ReceiptPdfService) {}

  filenameFor(row: RideReceiptRow, index?: number): string {
    const safeName = (row.passengerName || 'receipt')
      .replace(/[^a-zA-Z0-9_-]+/g, '_')
      .slice(0, 40);
    const suffix = index != null ? `_${index + 1}` : '';
    return `uber_receipt_${safeName}_${row.receiptDate}${suffix}.pdf`;
  }

  resolveFilename(
    row: RideReceiptRow,
    customBaseName?: string,
    index?: number
  ): string {
    const trimmed = customBaseName?.trim();
    if (trimmed) {
      const safe = trimmed
        .replace(/[/\\?%*:|"<>]/g, '_')
        .replace(/\s+/g, '_')
        .slice(0, 120);
      return safe.toLowerCase().endsWith('.pdf') ? safe : `${safe}.pdf`;
    }
    return this.filenameFor(row, index);
  }

  generateExcelBlob(rows: RideReceiptRow[]): Blob {
    const data = rows.map((r) => ({
      'Date': r.receiptDate,
      'Amount (₹)': r.total,
      'Plate Number': r.licensePlate,
      'Passenger Name': r.passengerName,
      'Pickup Address': r.pickupAddress,
      'Dropoff Address': r.dropoffAddress,
      'Pickup Time': r.pickupTime,
      'Dropoff Time': r.dropoffTime,
      'Trip Charge (₹)': r.tripCharge,
      'Interstate Charges (₹)': r.interstateCharges || 0,
      'Promotion (₹)': r.promotion || 0,
      'Distance (km)': r.distanceKm,
      'GST Amount (₹)': r.gstAmount || 0,
      'Duration (min)': r.durationMin,
      'Driver Name': r.driverName,
      'Vehicle Type': r.vehicleType,
      'Payment Method': r.paymentMethod,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet['!cols'] = [
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
      { wch: 20 },
      { wch: 35 },
      { wch: 35 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 18 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 18 },
      { wch: 16 },
      { wch: 16 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Receipts Summary');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }

  downloadExcel(rows: RideReceiptRow[], filename = 'receipts_summary.xlsx'): void {
    const blob = this.generateExcelBlob(rows);
    this.pdfService.downloadBlob(blob, filename);
  }

  async downloadOne(
    element: HTMLElement,
    row: RideReceiptRow,
    index?: number,
    customBaseName?: string
  ): Promise<void> {
    const blob = await this.pdfService.elementToPdfBlob(element);
    this.pdfService.downloadBlob(
      blob,
      this.resolveFilename(row, customBaseName, index)
    );
  }

  async downloadMany(
    rows: RideReceiptRow[],
    renderRow: (row: RideReceiptRow) => Promise<HTMLElement>,
    zipName = 'uber_receipts.zip',
    getCustomFilename?: (row: RideReceiptRow, index: number) => string | undefined
  ): Promise<void> {
    const excelBlob = this.generateExcelBlob(rows);

    if (rows.length === 1) {
      const el = await renderRow(rows[0]);
      await this.downloadOne(el, rows[0], 0, getCustomFilename?.(rows[0], 0));
      this.pdfService.downloadBlob(excelBlob, 'receipt_summary.xlsx');
      return;
    }

    const zip = new JSZip();
    zip.file('receipts_summary.xlsx', excelBlob);

    for (let i = 0; i < rows.length; i++) {
      const el = await renderRow(rows[i]);
      const blob = await this.pdfService.elementToPdfBlob(el);
      zip.file(
        this.resolveFilename(rows[i], getCustomFilename?.(rows[i], i), i),
        blob
      );
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    this.pdfService.downloadBlob(zipBlob, zipName);
  }
}
