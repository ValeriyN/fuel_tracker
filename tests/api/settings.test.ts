import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { NextRequest } from 'next/server';
import { createTestDb, seedUser } from '../helpers/testDb';
import type Database from 'better-sqlite3';

let testDb: Database.Database;

vi.mock('@/lib/db', () => ({ default: () => testDb }));

vi.mock('@/lib/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth')>();
  return { ...actual, getSession: vi.fn() };
});

import { getSession } from '@/lib/auth';

let getSettings: (req: NextRequest) => Promise<Response>;
let updateSettings: (req: NextRequest) => Promise<Response>;

let userId: number;

beforeAll(async () => {
  const route = await import('../../app/(auth)/api/me/settings/route');
  getSettings = route.GET;
  updateSettings = route.PUT;
});

beforeEach(() => {
  testDb = createTestDb();
  userId = seedUser(testDb);
  vi.mocked(getSession).mockResolvedValue({ userId, username: 'testuser' });
});

const req = () => new NextRequest('http://localhost/api/me/settings');
const putReq = (body: object) =>
  new NextRequest('http://localhost/api/me/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('GET /api/me/settings', () => {
  it('returns default settings when no row exists', async () => {
    const res = await getSettings(req());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.currency).toBe('EUR');
    expect(body.mileage_unit).toBe('km');
    expect(body.fuel_unit).toBe('L');
  });

  it('returns existing settings', async () => {
    testDb.prepare(
      "INSERT INTO user_settings (user_id, currency, mileage_unit, fuel_unit) VALUES (?, 'UAH', 'km', 'L')"
    ).run(userId);

    const res = await getSettings(req());
    const body = await res.json();
    expect(body.currency).toBe('UAH');
  });

  it('returns 401 when not authenticated', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(null);
    const res = await getSettings(req());
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/me/settings', () => {
  it('saves valid settings', async () => {
    const res = await updateSettings(putReq({ currency: 'UAH', mileage_unit: 'mi', fuel_unit: 'gal' }));
    expect(res.status).toBe(200);

    const row = testDb.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId) as Record<string, string>;
    expect(row.currency).toBe('UAH');
    expect(row.mileage_unit).toBe('mi');
    expect(row.fuel_unit).toBe('gal');
  });

  it('updates existing settings', async () => {
    testDb.prepare(
      "INSERT INTO user_settings (user_id, currency, mileage_unit, fuel_unit) VALUES (?, 'EUR', 'km', 'L')"
    ).run(userId);

    await updateSettings(putReq({ currency: 'UAH', mileage_unit: 'km', fuel_unit: 'L' }));

    const row = testDb.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId) as Record<string, string>;
    expect(row.currency).toBe('UAH');
  });

  it('rejects invalid currency', async () => {
    const res = await updateSettings(putReq({ currency: 'GBP', mileage_unit: 'km', fuel_unit: 'L' }));
    expect(res.status).toBe(400);
  });

  it('rejects invalid mileage_unit', async () => {
    const res = await updateSettings(putReq({ currency: 'EUR', mileage_unit: 'ft', fuel_unit: 'L' }));
    expect(res.status).toBe(400);
  });

  it('rejects invalid fuel_unit', async () => {
    const res = await updateSettings(putReq({ currency: 'EUR', mileage_unit: 'km', fuel_unit: 'oz' }));
    expect(res.status).toBe(400);
  });

  it('returns 401 when not authenticated', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(null);
    const res = await updateSettings(putReq({ currency: 'EUR', mileage_unit: 'km', fuel_unit: 'L' }));
    expect(res.status).toBe(401);
  });
});
