export const CURRENCIES = ['EUR', 'UAH'] as const;
export const MILEAGE_UNITS = ['km', 'mi'] as const;
export const FUEL_UNITS = ['L', 'gal'] as const;

export type Currency = typeof CURRENCIES[number];
export type MileageUnit = typeof MILEAGE_UNITS[number];
export type FuelUnit = typeof FUEL_UNITS[number];

export interface UserUnits {
  currency: Currency;
  mileage: MileageUnit;
  fuel: FuelUnit;
}

export const DEFAULT_UNITS: UserUnits = { currency: 'EUR', mileage: 'km', fuel: 'L' };

export function currencySymbol(c: Currency): string {
  return c === 'EUR' ? '€' : '₴';
}

export function consumptionLabel(mileage: MileageUnit, fuel: FuelUnit): string {
  if (mileage === 'mi' && fuel === 'gal') return 'mpg';
  return `${fuel}/100${mileage}`;
}
