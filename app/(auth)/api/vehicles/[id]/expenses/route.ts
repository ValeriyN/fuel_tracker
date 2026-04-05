import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSession } from '@/lib/auth';
import { DbExpense } from '@/lib/types';

async function assertVehicleOwnership(vehicleId: number, userId: number) {
  const db = getDb();
  return db
    .prepare('SELECT id FROM vehicles WHERE id = ? AND user_id = ?')
    .get(vehicleId, userId);
}

function parseExpense(row: DbExpense) {
  return {
    ...row,
    operations: row.operations ? JSON.parse(row.operations) : null,
  };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!await assertVehicleOwnership(Number(id), session.userId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const db = getDb();
  const expenses = db
    .prepare('SELECT * FROM expenses WHERE vehicle_id = ? ORDER BY date DESC')
    .all(Number(id)) as DbExpense[];

  return NextResponse.json(expenses.map(parseExpense));
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!await assertVehicleOwnership(Number(id), session.userId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await request.json();
  const { date, expense_type, station_name, mileage_km, total_cost_eur, operations, description } = body;

  if (!date || !expense_type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const validTypes = ['maintenance', 'repair', 'tires', 'accessories', 'other'];
  if (!validTypes.includes(expense_type)) {
    return NextResponse.json({ error: 'Invalid expense type' }, { status: 400 });
  }

  const db = getDb();
  const result = db.prepare(`
    INSERT INTO expenses (vehicle_id, date, expense_type, station_name, mileage_km, total_cost_eur, operations, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    Number(id),
    date,
    expense_type,
    station_name || '',
    mileage_km ?? null,
    total_cost_eur ?? null,
    operations ? JSON.stringify(operations) : null,
    description || null,
  );

  const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(result.lastInsertRowid) as DbExpense;
  return NextResponse.json(parseExpense(expense), { status: 201 });
}
