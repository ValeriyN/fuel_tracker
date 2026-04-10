import { version } from '@/package.json';
import { getSession } from '@/lib/auth';
import getDb from '@/lib/db';
import { getT } from '@/lib/i18n';
import { getLanguage } from '@/lib/language';
import { UserSettings, Vehicle } from '@/lib/types';
import { UserUnits, DEFAULT_UNITS, Currency, MileageUnit, FuelUnit } from '@/lib/units';
import SettingsForm from '@/components/SettingsForm';
import ImportFuelingsModal from '@/components/ImportFuelingsModal';

export default async function SettingsPage() {
  const session = await getSession();
  const lang = await getLanguage();
  const t = getT(lang);

  const db = getDb();
  const row = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(session!.userId) as UserSettings | undefined;
  const units: UserUnits = row
    ? { currency: row.currency as Currency, mileage: row.mileage_unit as MileageUnit, fuel: row.fuel_unit as FuelUnit }
    : DEFAULT_UNITS;

  const vehicles = db
    .prepare('SELECT id, name FROM vehicles WHERE user_id = ? ORDER BY name')
    .all(session!.userId) as Pick<Vehicle, 'id' | 'name'>[];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">{t('settingsTitle')}</h1>
      <SettingsForm initial={units} />

      {vehicles.length > 0 && (
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h2 className="text-base font-semibold text-gray-900 mb-3">{t('importFuelingsTitle')}</h2>
          <ImportFuelingsModal vehicles={vehicles} />
        </div>
      )}

      <p className="mt-8 text-xs text-gray-400 text-center">
        v{version}+{process.env.NEXT_PUBLIC_GIT_COMMITS} · {process.env.NEXT_PUBLIC_GIT_DATE}
      </p>
    </div>
  );
}
