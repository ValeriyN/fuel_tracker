import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const vehicles = db
    .prepare('SELECT * FROM vehicles WHERE user_id = ? ORDER BY created_at DESC')
    .all(session.userId);

  return NextResponse.json(vehicles);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, type, fuel_type } = await request.json();
  if (!name || !type || !fuel_type) {
    return NextResponse.json({ error: 'name, type, and fuel_type are required' }, { status: 400 });
  }
  if (!['car', 'motorcycle'].includes(type)) {
    return NextResponse.json({ error: 'type must be car or motorcycle' }, { status: 400 });
  }

  const db = getDb();
  const result = db
    .prepare('INSERT INTO vehicles (user_id, name, type, fuel_type) VALUES (?, ?, ?, ?)')
    .run(session.userId, name.trim(), type, fuel_type.trim());

  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(result.lastInsertRowid);
  return NextResponse.json(vehicle, { status: 201 });
}
