import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSession } from '@/lib/auth';

async function getOwnedVehicle(vehicleId: number, userId: number) {
  const db = getDb();
  return db
    .prepare('SELECT * FROM vehicles WHERE id = ? AND user_id = ?')
    .get(vehicleId, userId);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const vehicle = await getOwnedVehicle(Number(id), session.userId);
  if (!vehicle) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(vehicle);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const vehicle = await getOwnedVehicle(Number(id), session.userId);
  if (!vehicle) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { name, type, fuel_type } = await request.json();
  if (!name || !type || !fuel_type) {
    return NextResponse.json({ error: 'name, type, and fuel_type are required' }, { status: 400 });
  }

  const db = getDb();
  db.prepare('UPDATE vehicles SET name = ?, type = ?, fuel_type = ? WHERE id = ?')
    .run(name.trim(), type, fuel_type.trim(), Number(id));

  return NextResponse.json(db.prepare('SELECT * FROM vehicles WHERE id = ?').get(Number(id)));
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const vehicle = await getOwnedVehicle(Number(id), session.userId);
  if (!vehicle) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const db = getDb();
  db.prepare('DELETE FROM vehicles WHERE id = ?').run(Number(id));
  return NextResponse.json({ ok: true });
}
