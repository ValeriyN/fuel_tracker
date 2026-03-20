import Database from 'better-sqlite3';

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('car', 'motorcycle')),
    fuel_type TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS fuelings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    station_name TEXT NOT NULL DEFAULT '',
    fuel_amount_l REAL NOT NULL,
    mileage_km INTEGER NOT NULL,
    price_per_liter_eur REAL NOT NULL,
    total_cost_eur REAL NOT NULL,
    full_tank INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS user_settings (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    currency TEXT NOT NULL DEFAULT 'EUR',
    mileage_unit TEXT NOT NULL DEFAULT 'km',
    fuel_unit TEXT NOT NULL DEFAULT 'L'
  );
`;

export function createTestDb(): Database.Database {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
  return db;
}

export function seedUser(
  db: Database.Database,
  username = 'testuser',
  passwordHash = '$2a$10$hashedpassword'
): number {
  const result = db
    .prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)')
    .run(username, passwordHash);
  return result.lastInsertRowid as number;
}

export function seedVehicle(
  db: Database.Database,
  userId: number,
  overrides: { name?: string; type?: string; fuel_type?: string } = {}
): number {
  const { name = 'Test Car', type = 'car', fuel_type = 'Petrol 95' } = overrides;
  const result = db
    .prepare('INSERT INTO vehicles (user_id, name, type, fuel_type) VALUES (?, ?, ?, ?)')
    .run(userId, name, type, fuel_type);
  return result.lastInsertRowid as number;
}

export function seedFueling(
  db: Database.Database,
  vehicleId: number,
  overrides: Partial<{
    date: string;
    time: string;
    station_name: string;
    fuel_amount_l: number;
    mileage_km: number;
    price_per_liter_eur: number;
    total_cost_eur: number;
    full_tank: number;
  }> = {}
): number {
  const f = {
    date: '2026-03-17',
    time: '10:00',
    station_name: 'Shell',
    fuel_amount_l: 40.0,
    mileage_km: 125000,
    price_per_liter_eur: 1.659,
    total_cost_eur: 66.36,
    full_tank: 1,
    ...overrides,
  };
  const result = db
    .prepare(
      `INSERT INTO fuelings (vehicle_id, date, time, station_name, fuel_amount_l, mileage_km,
        price_per_liter_eur, total_cost_eur, full_tank)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      vehicleId,
      f.date,
      f.time,
      f.station_name,
      f.fuel_amount_l,
      f.mileage_km,
      f.price_per_liter_eur,
      f.total_cost_eur,
      f.full_tank
    );
  return result.lastInsertRowid as number;
}
