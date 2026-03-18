import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSession } from '@/lib/auth';
import { DbFueling } from '@/lib/types';

async function assertVehicleOwnership(vehicleId: number, userId: number) {
  const db = getDb();
  return db
    .prepare('SELECT id FROM vehicles WHERE id = ? AND user_id = ?')
    .get(vehicleId, userId);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!await assertVehicleOwnership(Number(id), session.userId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const db = getDb();
  const fuelings = db
    .prepare('SELECT * FROM fuelings WHERE vehicle_id = ? ORDER BY date DESC, time DESC')
    .all(Number(id));

  return NextResponse.json((fuelings as DbFueling[]).map(f => ({ ...f, full_tank: Boolean(f.full_tank) })));
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!await assertVehicleOwnership(Number(id), session.userId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await request.json();
  const { date, time, station_name, fuel_amount_l, mileage_km, total_cost_eur, full_tank } = body;

  if (!date || !time || fuel_amount_l == null || mileage_km == null || total_cost_eur == null) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const price_per_liter_eur = fuel_amount_l > 0
    ? Math.round((total_cost_eur / fuel_amount_l) * 100) / 100
    : 0;

  const db = getDb();
  const result = db.prepare(`
    INSERT INTO fuelings (vehicle_id, date, time, station_name, fuel_amount_l, mileage_km, price_per_liter_eur, total_cost_eur, full_tank)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(Number(id), date, time, station_name || '', fuel_amount_l, mileage_km, price_per_liter_eur, total_cost_eur, full_tank ? 1 : 0);

  const fueling = db.prepare('SELECT * FROM fuelings WHERE id = ?').get(result.lastInsertRowid) as Record<string, unknown>;
  return NextResponse.json({ ...fueling, full_tank: Boolean(fueling.full_tank) }, { status: 201 });
}
