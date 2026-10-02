import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { RideReceiptRow } from '../../models/ride-receipt.model';
import { ReceiptCalcService } from '../../services/receipt-calc.service';

@Component({
  selector: 'app-receipt-preview',
  templateUrl: './receipt-preview.component.html',
  styleUrl: './receipt-preview.component.scss',
  standalone: false,
})
export class ReceiptPreviewComponent {
  @Input({ required: true }) data!: RideReceiptRow;
  @ViewChild('receiptRoot') receiptRoot!: ElementRef<HTMLElement>;

  /**
   * A4 = 210mm × 297mm ≈ 793.7px × 1122.5px at 96dpi.
   * Receipt design is 1700px wide; scale so it fills A4 width.
   */
  readonly a4Scale = 793.7 / 1700;

  /** Prefer PNG for PDF capture; fall back to inline SVG if the asset is missing. */
  cashIconFailed = false;

  constructor(public calc: ReceiptCalcService) {}

  get rootEl(): HTMLElement {
    return this.receiptRoot.nativeElement;
  }

  onCashIconError(): void {
    this.cashIconFailed = true;
  }
}
