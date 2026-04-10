import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSession } from '@/lib/auth';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DB_PATH ?? path.join(process.cwd(), 'fuel_tracker.db');
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(path.dirname(DB_PATH), 'uploads');

async function assertExpenseOwnership(expenseId: number, vehicleId: number, userId: number) {
  const db = getDb();
  return db.prepare(`
    SELECT e.id, e.document_image FROM expenses e
    JOIN vehicles v ON v.id = e.vehicle_id
    WHERE e.id = ? AND e.vehicle_id = ? AND v.user_id = ?
  `).get(expenseId, vehicleId, userId) as { id: number; document_image: string | null } | undefined;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; expenseId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, expenseId } = await params;
  const row = await assertExpenseOwnership(Number(expenseId), Number(id), session.userId);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!row.document_image) return NextResponse.json({ error: 'No image' }, { status: 404 });

  const filePath = path.join(UPLOAD_DIR, row.document_image);
  if (!fs.existsSync(filePath)) return NextResponse.json({ error: 'File not found' }, { status: 404 });

  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(row.document_image).toLowerCase().slice(1);
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
  { params }: { params: Promise<{ id: string; expenseId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, expenseId } = await params;
  const row = await assertExpenseOwnership(Number(expenseId), Number(id), session.userId);
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

  if (row.document_image) {
    const oldPath = path.join(UPLOAD_DIR, row.document_image);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const filename = `expense_${expenseId}_${Date.now()}.${ext}`;
  const filePath = path.join(UPLOAD_DIR, filename);
  fs.writeFileSync(filePath, Buffer.from(await file.arrayBuffer()));

  const db = getDb();
  db.prepare('UPDATE expenses SET document_image = ? WHERE id = ?').run(filename, Number(expenseId));

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; expenseId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, expenseId } = await params;
  const row = await assertExpenseOwnership(Number(expenseId), Number(id), session.userId);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (row.document_image) {
    const filePath = path.join(UPLOAD_DIR, row.document_image);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    const db = getDb();
    db.prepare('UPDATE expenses SET document_image = NULL WHERE id = ?').run(Number(expenseId));
  }

  return NextResponse.json({ ok: true });
}
