import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { NextRequest } from 'next/server';
import { createTestDb, seedUser, seedVehicle } from '../helpers/testDb';
import type Database from 'better-sqlite3';

let testDb: Database.Database;

vi.mock('@/lib/db', () => ({ default: () => testDb }));

vi.mock('@/lib/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth')>();
  return { ...actual, getSession: vi.fn() };
});

import { getSession } from '@/lib/auth';

let getVehicles: (req: NextRequest) => Promise<Response>;
let createVehicle: (req: NextRequest) => Promise<Response>;
let getVehicle: (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;
let updateVehicle: (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;
let deleteVehicle: (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;

beforeAll(async () => {
  const listRoute = await import('../../app/(auth)/api/vehicles/route');
  getVehicles = listRoute.GET;
  createVehicle = listRoute.POST;
  const itemRoute = await import('../../app/(auth)/api/vehicles/[id]/route');
  getVehicle = itemRoute.GET;
  updateVehicle = itemRoute.PUT;
  deleteVehicle = itemRoute.DELETE;
});

const SESSION = { userId: 1, username: 'testuser' };

function jsonRequest(method: string, url: string, body?: object) {
  return new NextRequest(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

beforeEach(() => {
  testDb = createTestDb();
  vi.clearAllMocks();
  vi.mocked(getSession).mockResolvedValue(SESSION);
  seedUser(testDb, 'testuser');
});

describe('GET /api/vehicles', () => {
  it('returns only the current user vehicles', async () => {
    const otherUserId = seedUser(testDb, 'other');
    seedVehicle(testDb, SESSION.userId, { name: 'My Car' });
    seedVehicle(testDb, otherUserId, { name: 'Other Car' });

    const res = await getVehicles(new NextRequest('http://localhost/api/vehicles'));
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].name).toBe('My Car');
  });

  it('returns 401 when not authenticated', async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const res = await getVehicles(new NextRequest('http://localhost/api/vehicles'));
    expect(res.status).toBe(401);
  });
});

describe('POST /api/vehicles', () => {
  it('creates a vehicle and returns 201', async () => {
    const res = await createVehicle(
      jsonRequest('POST', 'http://localhost/api/vehicles', {
        name: 'Honda Civic',
        type: 'car',
        fuel_type: 'Petrol 95',
      })
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.name).toBe('Honda Civic');
    expect(body.type).toBe('car');
    expect(body.user_id).toBe(SESSION.userId);
  });

  it('returns 400 when fields are missing', async () => {
    const res = await createVehicle(
      jsonRequest('POST', 'http://localhost/api/vehicles', { name: 'X' })
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid vehicle type', async () => {
    const res = await createVehicle(
      jsonRequest('POST', 'http://localhost/api/vehicles', {
        name: 'X',
        type: 'truck',
        fuel_type: 'Diesel',
      })
    );
    expect(res.status).toBe(400);
  });
});

describe('GET /api/vehicles/[id]', () => {
  it('returns the vehicle for its owner', async () => {
    const vehicleId = seedVehicle(testDb, SESSION.userId, { name: 'My Bike' });
    const res = await getVehicle(
      new NextRequest('http://localhost/api/vehicles/1'),
      { params: Promise.resolve({ id: String(vehicleId) }) }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe('My Bike');
  });

  it('returns 404 for another user vehicle', async () => {
    const otherUserId = seedUser(testDb, 'other');
    const vehicleId = seedVehicle(testDb, otherUserId);
    const res = await getVehicle(
      new NextRequest('http://localhost/api/vehicles/1'),
      { params: Promise.resolve({ id: String(vehicleId) }) }
    );
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/vehicles/[id]', () => {
  it('updates name and fuel type', async () => {
    const vehicleId = seedVehicle(testDb, SESSION.userId, { name: 'Old Name' });
    const res = await updateVehicle(
      jsonRequest('PUT', 'http://localhost/api/vehicles/1', {
        name: 'New Name',
        type: 'car',
        fuel_type: 'Diesel',
      }),
      { params: Promise.resolve({ id: String(vehicleId) }) }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe('New Name');
    expect(body.fuel_type).toBe('Diesel');
  });
});

describe('DELETE /api/vehicles/[id]', () => {
  it('deletes the vehicle and returns ok', async () => {
    const vehicleId = seedVehicle(testDb, SESSION.userId);
    const res = await deleteVehicle(
      new NextRequest('http://localhost/api/vehicles/1', { method: 'DELETE' }),
      { params: Promise.resolve({ id: String(vehicleId) }) }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);

    const v = testDb.prepare('SELECT * FROM vehicles WHERE id = ?').get(vehicleId);
    expect(v).toBeUndefined();
  });

  it('returns 404 for another user vehicle', async () => {
    const otherUserId = seedUser(testDb, 'other');
    const vehicleId = seedVehicle(testDb, otherUserId);
    const res = await deleteVehicle(
      new NextRequest('http://localhost/api/vehicles/1', { method: 'DELETE' }),
      { params: Promise.resolve({ id: String(vehicleId) }) }
    );
    expect(res.status).toBe(404);
  });
});
