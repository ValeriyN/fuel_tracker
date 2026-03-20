import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { NextRequest } from 'next/server';
import { createTestDb, seedUser, seedVehicle, seedFueling } from '../helpers/testDb';
import type Database from 'better-sqlite3';

let testDb: Database.Database;

vi.mock('@/lib/db', () => ({ default: () => testDb }));

vi.mock('@/lib/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth')>();
  return { ...actual, getSession: vi.fn() };
});

import { getSession } from '@/lib/auth';

type RouteCtx = { params: Promise<{ id: string; fuelingId?: string }> };
let getFuelings: (req: NextRequest, ctx: RouteCtx) => Promise<Response>;
let createFueling: (req: NextRequest, ctx: RouteCtx) => Promise<Response>;
let getFueling: (req: NextRequest, ctx: RouteCtx) => Promise<Response>;
let updateFueling: (req: NextRequest, ctx: RouteCtx) => Promise<Response>;
let deleteFueling: (req: NextRequest, ctx: RouteCtx) => Promise<Response>;
let importFuelings: (req: NextRequest, ctx: RouteCtx) => Promise<Response>;

beforeAll(async () => {
  const listRoute = await import('../../app/(auth)/api/vehicles/[id]/fuelings/route');
  getFuelings = listRoute.GET;
  createFueling = listRoute.POST;
  const itemRoute = await import('../../app/(auth)/api/vehicles/[id]/fuelings/[fuelingId]/route');
  getFueling = itemRoute.GET;
  updateFueling = itemRoute.PUT;
  deleteFueling = itemRoute.DELETE;
  const importRoute = await import('../../app/(auth)/api/vehicles/[id]/fuelings/import/route');
  importFuelings = importRoute.POST;
});

const SESSION = { userId: 1, username: 'testuser' };

function jsonRequest(method: string, url: string, body?: object) {
  return new NextRequest(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

const FUELING_BODY = {
  date: '2026-03-17',
  time: '10:00',
  station_name: 'Shell',
  fuel_amount_l: 40.0,
  mileage_km: 125000,
  total_cost_eur: 66.36,
  full_tank: true,
};

let vehicleId: number;

beforeEach(() => {
  testDb = createTestDb();
  vi.clearAllMocks();
  vi.mocked(getSession).mockResolvedValue(SESSION);
  seedUser(testDb, 'testuser');
  vehicleId = seedVehicle(testDb, SESSION.userId);
});

describe('GET /api/vehicles/[id]/fuelings', () => {
  it('returns fuelings with boolean full_tank', async () => {
    seedFueling(testDb, vehicleId);
    seedFueling(testDb, vehicleId, { date: '2026-03-16' });

    const res = await getFuelings(
      new NextRequest('http://localhost/api/vehicles/1/fuelings'),
      { params: Promise.resolve({ id: String(vehicleId) }) }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(2);
    expect(typeof body[0].full_tank).toBe('boolean');
  });

  it('returns 404 for another user vehicle', async () => {
    const otherId = seedUser(testDb, 'other');
    const otherVehicle = seedVehicle(testDb, otherId);

    const res = await getFuelings(
      new NextRequest('http://localhost/api/vehicles/1/fuelings'),
      { params: Promise.resolve({ id: String(otherVehicle) }) }
    );
    expect(res.status).toBe(404);
  });
});

describe('POST /api/vehicles/[id]/fuelings', () => {
  it('creates a fueling and calculates total_cost_eur', async () => {
    const res = await createFueling(
      jsonRequest('POST', 'http://localhost/api/vehicles/1/fuelings', FUELING_BODY),
      { params: Promise.resolve({ id: String(vehicleId) }) }
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.fuel_amount_l).toBe(40.0);
    expect(body.total_cost_eur).toBeCloseTo(66.36, 2);
    expect(body.full_tank).toBe(true);
  });

  it('returns 400 for missing required fields', async () => {
    const res = await createFueling(
      jsonRequest('POST', 'http://localhost/api/vehicles/1/fuelings', { date: '2026-03-17' }),
      { params: Promise.resolve({ id: String(vehicleId) }) }
    );
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/vehicles/[id]/fuelings/[fuelingId]', () => {
  it('updates the fueling record', async () => {
    const fuelingId = seedFueling(testDb, vehicleId, { mileage_km: 100000 });

    const res = await updateFueling(
      jsonRequest('PUT', 'http://localhost/api/vehicles/1/fuelings/1', {
        ...FUELING_BODY,
        mileage_km: 126000,
        full_tank: false,
      }),
      { params: Promise.resolve({ id: String(vehicleId), fuelingId: String(fuelingId) }) }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.mileage_km).toBe(126000);
    expect(body.full_tank).toBe(false);
  });

  it('returns 404 for another user fueling', async () => {
    const otherId = seedUser(testDb, 'other');
    const otherVehicle = seedVehicle(testDb, otherId);
    const otherFueling = seedFueling(testDb, otherVehicle);

    const res = await updateFueling(
      jsonRequest('PUT', 'http://localhost/api/vehicles/1/fuelings/1', FUELING_BODY),
      { params: Promise.resolve({ id: String(otherVehicle), fuelingId: String(otherFueling) }) }
    );
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/vehicles/[id]/fuelings/[fuelingId]', () => {
  it('deletes the fueling', async () => {
    const fuelingId = seedFueling(testDb, vehicleId);

    const res = await deleteFueling(
      new NextRequest('http://localhost/api/vehicles/1/fuelings/1', { method: 'DELETE' }),
      { params: Promise.resolve({ id: String(vehicleId), fuelingId: String(fuelingId) }) }
    );
    expect(res.status).toBe(200);

    const f = testDb.prepare('SELECT * FROM fuelings WHERE id = ?').get(fuelingId);
    expect(f).toBeUndefined();
  });
});

const VALID_CSV = `date,time,station_name,fuel_amount_l,mileage_km,total_cost_eur,full_tank
2026-03-01,10:00,Shell,40.0,125000,66.36,true
2026-03-15,14:30,BP,35.5,126200,58.82,false`;

function csvRequest(csv: string, deleteExisting: boolean, vehicleId: number) {
  const formData = new FormData();
  formData.append('file', new File([csv], 'fuelings.csv', { type: 'text/csv' }));
  formData.append('deleteExisting', String(deleteExisting));
  return new NextRequest(`http://localhost/api/vehicles/${vehicleId}/fuelings/import`, {
    method: 'POST',
    body: formData,
  });
}

describe('POST /api/vehicles/[id]/fuelings/import', () => {
  it('imports valid CSV rows', async () => {
    const res = await importFuelings(
      csvRequest(VALID_CSV, false, vehicleId),
      { params: Promise.resolve({ id: String(vehicleId) }) }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.imported).toBe(2);
    expect(body.skipped).toBe(0);

    const rows = testDb.prepare('SELECT * FROM fuelings WHERE vehicle_id = ?').all(vehicleId);
    expect(rows).toHaveLength(2);
  });

  it('deletes existing fuelings when deleteExisting=true', async () => {
    seedFueling(testDb, vehicleId);
    seedFueling(testDb, vehicleId, { date: '2026-01-01' });

    const res = await importFuelings(
      csvRequest(VALID_CSV, true, vehicleId),
      { params: Promise.resolve({ id: String(vehicleId) }) }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.imported).toBe(2);

    const rows = testDb.prepare('SELECT * FROM fuelings WHERE vehicle_id = ?').all(vehicleId);
    expect(rows).toHaveLength(2);
  });

  it('keeps existing fuelings when deleteExisting=false', async () => {
    seedFueling(testDb, vehicleId);

    const res = await importFuelings(
      csvRequest(VALID_CSV, false, vehicleId),
      { params: Promise.resolve({ id: String(vehicleId) }) }
    );
    expect(res.status).toBe(200);

    const rows = testDb.prepare('SELECT * FROM fuelings WHERE vehicle_id = ?').all(vehicleId);
    expect(rows).toHaveLength(3);
  });

  it('skips invalid rows and reports count', async () => {
    const csv = `date,time,station_name,fuel_amount_l,mileage_km,total_cost_eur,full_tank
2026-03-01,10:00,Shell,40.0,125000,66.36,true
bad-row-missing-fields
,,,,,, `;

    const res = await importFuelings(
      csvRequest(csv, false, vehicleId),
      { params: Promise.resolve({ id: String(vehicleId) }) }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.imported).toBe(1);
    expect(body.skipped).toBe(2);
  });

  it('uses default time 12:00 when time field is empty', async () => {
    const csv = `date,time,station_name,fuel_amount_l,mileage_km,total_cost_eur,full_tank
2026-03-01,,Shell,40.0,125000,66.36,true`;

    const res = await importFuelings(
      csvRequest(csv, true, vehicleId),
      { params: Promise.resolve({ id: String(vehicleId) }) }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.imported).toBe(1);
    expect(body.skipped).toBe(0);

    const row = testDb.prepare('SELECT time FROM fuelings WHERE vehicle_id = ?').get(vehicleId) as { time: string };
    expect(row.time).toBe('12:00');
  });

  it('returns 400 when no file is provided', async () => {
    const formData = new FormData();
    formData.append('deleteExisting', 'false');
    const req = new NextRequest(`http://localhost/api/vehicles/${vehicleId}/fuelings/import`, {
      method: 'POST',
      body: formData,
    });
    const res = await importFuelings(req, { params: Promise.resolve({ id: String(vehicleId) }) });
    expect(res.status).toBe(400);
  });

  it('returns 404 for another user vehicle', async () => {
    const otherId = seedUser(testDb, 'other2');
    const otherVehicle = seedVehicle(testDb, otherId);

    const res = await importFuelings(
      csvRequest(VALID_CSV, false, otherVehicle),
      { params: Promise.resolve({ id: String(otherVehicle) }) }
    );
    expect(res.status).toBe(404);
  });
});

describe('GET /api/vehicles/[id]/fuelings/[fuelingId]', () => {
  it('returns a single fueling', async () => {
    const fuelingId = seedFueling(testDb, vehicleId);

    const res = await getFueling(
      new NextRequest('http://localhost/api/vehicles/1/fuelings/1'),
      { params: Promise.resolve({ id: String(vehicleId), fuelingId: String(fuelingId) }) }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(fuelingId);
    expect(typeof body.full_tank).toBe('boolean');
  });
});
