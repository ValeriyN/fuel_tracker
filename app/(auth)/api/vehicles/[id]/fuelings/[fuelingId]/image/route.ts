import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSession } from '@/lib/auth';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DB_PATH ?? path.join(process.cwd(), 'fuel_tracker.db');
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(path.dirname(DB_PATH), 'uploads');

async function assertFuelingOwnership(fuelingId: number, vehicleId: number, userId: number) {
  const db = getDb();
  return db.prepare(`
    SELECT f.id, f.invoice_image FROM fuelings f
    JOIN vehicles v ON v.id = f.vehicle_id
    WHERE f.id = ? AND f.vehicle_id = ? AND v.user_id = ?
  `).get(fuelingId, vehicleId, userId) as { id: number; invoice_image: string | null } | undefined;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; fuelingId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, fuelingId } = await params;
  const row = await assertFuelingOwnership(Number(fuelingId), Number(id), session.userId);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!row.invoice_image) return NextResponse.json({ error: 'No image' }, { status: 404 });

  const filePath = path.join(UPLOAD_DIR, row.invoice_image);
  if (!fs.existsSync(filePath)) return NextResponse.json({ error: 'File not found' }, { status: 404 });

  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(row.invoice_image).toLowerCase().slice(1);
  const contentType =
    ext === 'png' ? 'image/png' :
    ext === 'gif' ? 'image/gif' :
    ext === 'webp' ? 'image/webp' :
    'image/jpeg';

  return new NextResponse(buffer, {
    headers: { 'Content-Type': contentType, 'Cache-Control': 'private, max-age=3600' },
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fuelingId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, fuelingId } = await params;
  const row = await assertFuelingOwnership(Number(fuelingId), Number(id), session.userId);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const formData = await request.formData();
  const file = formData.get('image') as File | null;
  if (!file) return NextResponse.json({ error: 'No image provided' }, { status: 400 });

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
  }

  fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  if (row.invoice_image) {
    const oldPath = path.join(UPLOAD_DIR, row.invoice_image);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const filename = `fueling_${fuelingId}_${Date.now()}.${ext}`;
  const filePath = path.join(UPLOAD_DIR, filename);
  fs.writeFileSync(filePath, Buffer.from(await file.arrayBuffer()));

  const db = getDb();
  db.prepare('UPDATE fuelings SET invoice_image = ? WHERE id = ?').run(filename, Number(fuelingId));

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; fuelingId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, fuelingId } = await params;
  const row = await assertFuelingOwnership(Number(fuelingId), Number(id), session.userId);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (row.invoice_image) {
    const filePath = path.join(UPLOAD_DIR, row.invoice_image);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    const db = getDb();
    db.prepare('UPDATE fuelings SET invoice_image = NULL WHERE id = ?').run(Number(fuelingId));
  }

  return NextResponse.json({ ok: true });
}
