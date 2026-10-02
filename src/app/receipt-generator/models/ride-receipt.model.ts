export type RideTimeOfDay = 'morning' | 'noon' | 'afternoon' | 'evening' | 'night';

export type PaymentMethod = 'Cash' | 'UPI' | 'Credit card' | 'Debit card';

export type VehicleType = 'Go' | 'Go Sedan' | 'Premier' | 'UberXL' | 'Auto' | 'Moto';

export interface RideReceiptRow {
  id: string;
  paymentMethod: PaymentMethod;
  vehicleType: VehicleType;
  /** ISO date YYYY-MM-DD (weekday only) */
  receiptDate: string;
  passengerName: string;
  rideTimeOfDay: RideTimeOfDay;
  driverName: string;
  interstateCharges: number;
  /** Negative number, e.g. -29.44 */
  promotion: number;
  tripCharge: number;
  /** Equals tripCharge */
  subtotal: number;
  total: number;
  distanceKm: number;
  durationMin: number;
  licensePlate: string;
  pickupAddress: string;
  dropoffAddress: string;
  /** "11:30 am" style */
  pickupTime: string;
  dropoffTime: string;
  /** Derived: 5% of total, truncated to 2 dp */
  gstAmount: number;
  /** Equals total */
  paymentsAmount: number;
}

export const RIDE_TIME_OF_DAY_OPTIONS: { label: string; value: RideTimeOfDay }[] = [
  { label: 'Morning', value: 'morning' },
  { label: 'Noon', value: 'noon' },
  { label: 'Afternoon', value: 'afternoon' },
  { label: 'Evening', value: 'evening' },
  { label: 'Night', value: 'night' },
];

export const PAYMENT_METHOD_OPTIONS: PaymentMethod[] = [
  'Cash',
  'UPI',
  'Credit card',
  'Debit card',
];

export const VEHICLE_TYPE_OPTIONS: VehicleType[] = [
  'Go',
  'Go Sedan',
  'Premier',
  'UberXL',
  'Auto',
  'Moto',
];

export function createSampleReceiptRow(id: string): RideReceiptRow {
  return {
    id,
    paymentMethod: 'Cash',
    vehicleType: 'Go Sedan',
    receiptDate: '2025-05-01',
    passengerName: 'Amrish',
    rideTimeOfDay: 'evening',
    driverName: 'Ram',
    interstateCharges: 126,
    promotion: -29.44,
    tripCharge: 198.37,
    subtotal: 198.37,
    total: 294.93,
    distanceKm: 8.8,
    durationMin: 40,
    licensePlate: 'DL1TCY5678',
    pickupAddress: 'Sector 26, Noida, Uttar Pradesh 201301, India',
    dropoffAddress: '401 Baani Corporate One, Jasola Vihar, New Delhi, Delhi 110025, India',
    pickupTime: '11:30 am',
    dropoffTime: '12:10 pm',
    gstAmount: 14.74,
    paymentsAmount: 294.93,
  };
}
