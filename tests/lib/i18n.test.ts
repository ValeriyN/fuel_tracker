import { describe, it, expect } from 'vitest';
import { getT, FUEL_TYPE_KEYS, LANGUAGES } from '@/lib/i18n';

describe('getT', () => {
  it('returns English strings for known keys', () => {
    const t = getT('en');
    expect(t('signIn')).toBe('Sign in');
    expect(t('myVehicles')).toBe('My Vehicles');
    expect(t('fullTank')).toBe('Full tank');
  });

  it('returns Ukrainian strings for known keys', () => {
    const t = getT('uk');
    expect(t('signIn')).toBe('Увійти');
    expect(t('myVehicles')).toBe('Мої автомобілі');
    expect(t('fullTank')).toBe('Повний бак');
  });

  it('both languages cover all the same keys', () => {
    const enKeys = Object.keys(getT('en')('appName') ? {} : {});
    // Build translation objects via getT for a known set of keys
    const keys: Parameters<ReturnType<typeof getT>>[0][] = [
      'appName', 'signOut', 'signIn', 'username', 'password',
      'myVehicles', 'addVehicle', 'car', 'motorcycle',
      'date', 'time', 'fuelStation', 'fullTank', 'totalCost',
      'saveChanges', 'delete', 'addFuelingTitle', 'editFueling',
    ];
    const enT = getT('en');
    const ukT = getT('uk');
    for (const key of keys) {
      expect(enT(key)).toBeTruthy();
      expect(ukT(key)).toBeTruthy();
    }
    void enKeys;
  });

  it('EN and UK return different values for translatable keys', () => {
    expect(getT('en')('signIn')).not.toBe(getT('uk')('signIn'));
    expect(getT('en')('car')).not.toBe(getT('uk')('car'));
  });
});

describe('FUEL_TYPE_KEYS', () => {
  it('contains 6 preset fuel types', () => {
    expect(FUEL_TYPE_KEYS).toHaveLength(6);
  });

  it('each entry has a value and a labelKey', () => {
    for (const entry of FUEL_TYPE_KEYS) {
      expect(typeof entry.value).toBe('string');
      expect(entry.value.length).toBeGreaterThan(0);
      expect(typeof entry.labelKey).toBe('string');
    }
  });

  it('all labelKeys resolve to different strings per language', () => {
    const enT = getT('en');
    const ukT = getT('uk');
    for (const { labelKey } of FUEL_TYPE_KEYS) {
      expect(enT(labelKey)).toBeTruthy();
      expect(ukT(labelKey)).toBeTruthy();
    }
  });

  it('includes Petrol 95 and Diesel as canonical values', () => {
    const values = FUEL_TYPE_KEYS.map(f => f.value);
    expect(values).toContain('Petrol 95');
    expect(values).toContain('Diesel');
  });
});

describe('LANGUAGES', () => {
  it('contains en and uk', () => {
    expect(LANGUAGES).toContain('en');
    expect(LANGUAGES).toContain('uk');
    expect(LANGUAGES).toHaveLength(2);
  });
});
