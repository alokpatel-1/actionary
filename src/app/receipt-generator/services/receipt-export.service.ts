import { Injectable } from '@angular/core';
import JSZip from 'jszip';
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

  async downloadOne(
    element: HTMLElement,
    row: RideReceiptRow,
    index?: number
  ): Promise<void> {
    const blob = await this.pdfService.elementToPdfBlob(element);
    this.pdfService.downloadBlob(blob, this.filenameFor(row, index));
  }

  async downloadMany(
    rows: RideReceiptRow[],
    renderRow: (row: RideReceiptRow) => Promise<HTMLElement>,
    zipName = 'uber_receipts.zip'
  ): Promise<void> {
    if (rows.length === 1) {
      const el = await renderRow(rows[0]);
      await this.downloadOne(el, rows[0], 0);
      return;
    }

    const zip = new JSZip();
    for (let i = 0; i < rows.length; i++) {
      const el = await renderRow(rows[i]);
      const blob = await this.pdfService.elementToPdfBlob(el);
      zip.file(this.filenameFor(rows[i], i), blob);
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    this.pdfService.downloadBlob(zipBlob, zipName);
  }
}
