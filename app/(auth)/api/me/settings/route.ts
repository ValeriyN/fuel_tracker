import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSession } from '@/lib/auth';
import { CURRENCIES, MILEAGE_UNITS, FUEL_UNITS } from '@/lib/units';
import { UserSettings } from '@/lib/types';

function getOrCreateSettings(userId: number): UserSettings {
  const db = getDb();
  let row = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId) as UserSettings | undefined;
  if (!row) {
    db.prepare(
      "INSERT INTO user_settings (user_id, currency, mileage_unit, fuel_unit) VALUES (?, 'EUR', 'km', 'L')"
    ).run(userId);
    row = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId) as UserSettings;
  }
  return row;
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const settings = getOrCreateSettings(session.userId);
  return NextResponse.json(settings);
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { currency, mileage_unit, fuel_unit } = body;

  if (!CURRENCIES.includes(currency)) {
    return NextResponse.json({ error: `currency must be one of: ${CURRENCIES.join(', ')}` }, { status: 400 });
  }
  if (!MILEAGE_UNITS.includes(mileage_unit)) {
    return NextResponse.json({ error: `mileage_unit must be one of: ${MILEAGE_UNITS.join(', ')}` }, { status: 400 });
  }
  if (!FUEL_UNITS.includes(fuel_unit)) {
    return NextResponse.json({ error: `fuel_unit must be one of: ${FUEL_UNITS.join(', ')}` }, { status: 400 });
  }

  const db = getDb();
  db.prepare(`
    INSERT INTO user_settings (user_id, currency, mileage_unit, fuel_unit)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET currency = excluded.currency, mileage_unit = excluded.mileage_unit, fuel_unit = excluded.fuel_unit
  `).run(session.userId, currency, mileage_unit, fuel_unit);

  return NextResponse.json({ ok: true });
}
