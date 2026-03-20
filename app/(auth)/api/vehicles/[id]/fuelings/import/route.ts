import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSession } from '@/lib/auth';

function parseBool(val: string): boolean | null {
  const v = val.trim().toLowerCase();
  if (v === 'true' || v === '1' || v === 'yes') return true;
  if (v === 'false' || v === '0' || v === 'no') return false;
  return null;
}

function parseRow(headers: string[], cells: string[]): Record<string, string> {
  const row: Record<string, string> = {};
  headers.forEach((h, i) => { row[h] = (cells[i] ?? '').trim(); });
  return row;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const vehicleId = Number(id);

  const db = getDb();
  const vehicle = db
    .prepare('SELECT id FROM vehicles WHERE id = ? AND user_id = ?')
    .get(vehicleId, session.userId);
  if (!vehicle) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const deleteExisting = formData.get('deleteExisting') === 'true';

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const text = await file.text();
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length < 2) return NextResponse.json({ error: 'File is empty or missing header' }, { status: 400 });

  const headers = lines[0].split(',').map(h => h.trim());
  const required = ['date', 'time', 'fuel_amount_l', 'mileage_km', 'total_cost_eur'];
  if (!required.every(h => headers.includes(h))) {
    return NextResponse.json({ error: `CSV must include columns: ${required.join(', ')}` }, { status: 400 });
  }

  const insert = db.prepare(`
    INSERT INTO fuelings (vehicle_id, date, time, station_name, fuel_amount_l, mileage_km, price_per_liter_eur, total_cost_eur, full_tank)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let imported = 0;
  let skipped = 0;

  db.transaction(() => {
    if (deleteExisting) {
      db.prepare('DELETE FROM fuelings WHERE vehicle_id = ?').run(vehicleId);
    }

    for (let i = 1; i < lines.length; i++) {
      const row = parseRow(headers, lines[i].split(','));

      const date = row['date'] ?? '';
      const time = row['time']?.trim() || '12:00';
      const fuel_amount_l = parseFloat(row['fuel_amount_l'] ?? '');
      const mileage_km = parseInt(row['mileage_km'] ?? '');
      const total_cost_eur = parseFloat(row['total_cost_eur'] ?? '');

      if (!date || isNaN(fuel_amount_l) || isNaN(mileage_km) || isNaN(total_cost_eur)) {
        skipped++;
        continue;
      }

      const station_name = row['station_name'] ?? '';
      const full_tank_raw = row['full_tank'] ?? 'false';
      const full_tank = parseBool(full_tank_raw) ?? false;
      const price_per_liter_eur = fuel_amount_l > 0
        ? Math.round((total_cost_eur / fuel_amount_l) * 1000) / 1000
        : 0;

      insert.run(vehicleId, date, time, station_name, fuel_amount_l, mileage_km, price_per_liter_eur, total_cost_eur, full_tank ? 1 : 0);
      imported++;
    }
  })();

  return NextResponse.json({ imported, skipped });
}
