import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb, seedUser, seedVehicle, seedFueling } from '../helpers/testDb';
import type Database from 'better-sqlite3';

let db: Database.Database;

beforeEach(() => {
  db = createTestDb();
});

describe('database schema', () => {
  it('creates all three tables', () => {
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all() as { name: string }[];
    const names = tables.map(t => t.name);
    expect(names).toContain('users');
    expect(names).toContain('vehicles');
    expect(names).toContain('fuelings');
  });

  it('enforces UNIQUE constraint on username', () => {
    seedUser(db, 'alice');
    expect(() => seedUser(db, 'alice')).toThrow();
  });

  it('can insert and retrieve a user', () => {
    const id = seedUser(db, 'alice', 'hash123');
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as {
      username: string;
      password_hash: string;
    };
    expect(user.username).toBe('alice');
    expect(user.password_hash).toBe('hash123');
  });

  it('can insert a vehicle linked to a user', () => {
    const userId = seedUser(db);
    const vehicleId = seedVehicle(db, userId, { name: 'My Honda', type: 'motorcycle' });
    const v = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vehicleId) as {
      name: string;
      type: string;
      user_id: number;
    };
    expect(v.name).toBe('My Honda');
    expect(v.type).toBe('motorcycle');
    expect(v.user_id).toBe(userId);
  });

  it('cascades delete from users to vehicles', () => {
    const userId = seedUser(db);
    const vehicleId = seedVehicle(db, userId);
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    const v = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vehicleId);
    expect(v).toBeUndefined();
  });

  it('cascades delete from vehicles to fuelings', () => {
    const userId = seedUser(db);
    const vehicleId = seedVehicle(db, userId);
    const fuelingId = seedFueling(db, vehicleId);
    db.prepare('DELETE FROM vehicles WHERE id = ?').run(vehicleId);
    const f = db.prepare('SELECT * FROM fuelings WHERE id = ?').get(fuelingId);
    expect(f).toBeUndefined();
  });

  it('rejects vehicle with invalid type', () => {
    const userId = seedUser(db);
    expect(() =>
      db
        .prepare('INSERT INTO vehicles (user_id, name, type, fuel_type) VALUES (?, ?, ?, ?)')
        .run(userId, 'Test', 'truck', 'Diesel')
    ).toThrow();
  });

  it('stores fueling with correct total_cost_eur', () => {
    const userId = seedUser(db);
    const vehicleId = seedVehicle(db, userId);
    const fuelingId = seedFueling(db, vehicleId, {
      fuel_amount_l: 40.0,
      price_per_liter_eur: 1.659,
      total_cost_eur: 66.36,
    });
    const f = db.prepare('SELECT * FROM fuelings WHERE id = ?').get(fuelingId) as {
      total_cost_eur: number;
      full_tank: number;
    };
    expect(f.total_cost_eur).toBe(66.36);
    expect(f.full_tank).toBe(1);
  });
});
