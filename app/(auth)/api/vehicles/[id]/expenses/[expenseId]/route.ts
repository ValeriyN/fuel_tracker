import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSession } from '@/lib/auth';
import { DbExpense } from '@/lib/types';

async function assertExpenseOwnership(expenseId: number, vehicleId: number, userId: number) {
  const db = getDb();
  return db.prepare(`
    SELECT e.id FROM expenses e
    JOIN vehicles v ON v.id = e.vehicle_id
    WHERE e.id = ? AND e.vehicle_id = ? AND v.user_id = ?
  `).get(expenseId, vehicleId, userId);
}

function parseExpense(row: DbExpense) {
  return {
    ...row,
    operations: row.operations ? JSON.parse(row.operations) : null,
  };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; expenseId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, expenseId } = await params;
  if (!await assertExpenseOwnership(Number(expenseId), Number(id), session.userId)) {
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
  db.prepare(`
    UPDATE expenses
    SET date = ?, expense_type = ?, station_name = ?, mileage_km = ?, total_cost_eur = ?, operations = ?, description = ?
    WHERE id = ?
  `).run(
    date,
    expense_type,
    station_name || '',
    mileage_km ?? null,
    total_cost_eur ?? null,
    operations ? JSON.stringify(operations) : null,
    description || null,
    Number(expenseId),
  );

  const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(Number(expenseId)) as DbExpense;
  return NextResponse.json(parseExpense(expense));
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; expenseId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, expenseId } = await params;
  if (!await assertExpenseOwnership(Number(expenseId), Number(id), session.userId)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const db = getDb();
  db.prepare('DELETE FROM expenses WHERE id = ?').run(Number(expenseId));
  return NextResponse.json({ ok: true });
}
