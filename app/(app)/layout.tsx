import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Nav from '@/components/Nav';
import { UnitsProvider } from '@/components/UnitsProvider';
import { UserUnits, DEFAULT_UNITS, Currency, MileageUnit, FuelUnit } from '@/lib/units';
import { UserSettings } from '@/lib/types';
import getDb from '@/lib/db';

function loadUnits(userId: number): UserUnits {
  const db = getDb();
  let row = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId) as UserSettings | undefined;
  if (!row) {
    db.prepare(
      "INSERT OR IGNORE INTO user_settings (user_id, currency, mileage_unit, fuel_unit) VALUES (?, 'EUR', 'km', 'L')"
    ).run(userId);
    row = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId) as UserSettings | undefined;
  }
  if (!row) return DEFAULT_UNITS;
  return {
    currency: row.currency as Currency,
    mileage: row.mileage_unit as MileageUnit,
    fuel: row.fuel_unit as FuelUnit,
  };
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const units = loadUnits(session.userId);

  return (
    <div className="min-h-screen bg-gray-50">
      <UnitsProvider initial={units}>
        <Nav username={session.username} />
        <main className="max-w-5xl mx-auto px-4 py-4 md:py-8">{children}</main>
      </UnitsProvider>
    </div>
  );
}
