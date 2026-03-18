import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSession } from '@/lib/auth';

async function assertFuelingOwnership(fuelingId: number, vehicleId: number, userId: number) {
  const db = getDb();
  return db.prepare(`
    SELECT f.id FROM fuelings f
    JOIN vehicles v ON v.id = f.vehicle_id
    WHERE f.id = ? AND f.vehicle_id = ? AND v.user_id = ?
  `).get(fuelingId, vehicleId, userId);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fuelingId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, fuelingId } = await params;
  if (!await assertFuelingOwnership(Number(fuelingId), Number(id), session.userId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const db = getDb();
  const fueling = db.prepare('SELECT * FROM fuelings WHERE id = ?').get(Number(fuelingId)) as Record<string, unknown>;
  return NextResponse.json({ ...fueling, full_tank: Boolean(fueling.full_tank) });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fuelingId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, fuelingId } = await params;
  if (!await assertFuelingOwnership(Number(fuelingId), Number(id), session.userId)) {
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
  db.prepare(`
    UPDATE fuelings
    SET date = ?, time = ?, station_name = ?, fuel_amount_l = ?, mileage_km = ?, price_per_liter_eur = ?, total_cost_eur = ?, full_tank = ?
    WHERE id = ?
  `).run(date, time, station_name || '', fuel_amount_l, mileage_km, price_per_liter_eur, total_cost_eur, full_tank ? 1 : 0, Number(fuelingId));

  const fueling = db.prepare('SELECT * FROM fuelings WHERE id = ?').get(Number(fuelingId)) as Record<string, unknown>;
  return NextResponse.json({ ...fueling, full_tank: Boolean(fueling.full_tank) });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fuelingId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, fuelingId } = await params;
  if (!await assertFuelingOwnership(Number(fuelingId), Number(id), session.userId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const db = getDb();
  db.prepare('DELETE FROM fuelings WHERE id = ?').run(Number(fuelingId));
  return NextResponse.json({ ok: true });
}
