import { RideReceiptRow } from './ride-receipt.model';

export interface NumericRange {
  min: number;
  max: number;
}

export interface BulkPreviewItem {
  row: RideReceiptRow;
  /** Base name without path; .pdf added on export */
  exportFilename: string;
}

export interface BulkGenerateOptions {
  template: RideReceiptRow;
  /** ISO dates YYYY-MM-DD, one row per date */
  dates: string[];
  tripCharge: NumericRange;
  distanceKm: NumericRange;
  /** When omitted, each row uses template interstateCharges */
  interstateCharges?: NumericRange;
  /** When omitted, each row uses template promotion */
  promotion?: NumericRange;
  /** Typical trip duration (minutes); generation varies slightly around this */
  avgDurationMin: number;
  newId: () => string;
  /** Existing license plates to avoid when picking random plates */
  existingPlates?: string[];
}
