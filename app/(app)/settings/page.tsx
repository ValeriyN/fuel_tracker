import { version } from '@/package.json';
import { getSession } from '@/lib/auth';
import getDb from '@/lib/db';
import { getT } from '@/lib/i18n';
import { getLanguage } from '@/lib/language';
import { UserSettings } from '@/lib/types';
import { UserUnits, DEFAULT_UNITS, Currency, MileageUnit, FuelUnit } from '@/lib/units';
import SettingsForm from '@/components/SettingsForm';

export default async function SettingsPage() {
  const session = await getSession();
  const lang = await getLanguage();
  const t = getT(lang);

  const db = getDb();
  let row = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(session!.userId) as UserSettings | undefined;
  const units: UserUnits = row
    ? { currency: row.currency as Currency, mileage: row.mileage_unit as MileageUnit, fuel: row.fuel_unit as FuelUnit }
    : DEFAULT_UNITS;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">{t('settingsTitle')}</h1>
      <SettingsForm initial={units} />
      <p className="mt-8 text-xs text-gray-400 text-center">
        v{version}+{process.env.NEXT_PUBLIC_GIT_COMMITS} · {process.env.NEXT_PUBLIC_GIT_DATE}
      </p>
    </div>
  );
}
