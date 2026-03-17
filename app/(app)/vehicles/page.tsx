import { getSession } from '@/lib/auth';
import getDb from '@/lib/db';
import { Vehicle } from '@/lib/types';
import { getT } from '@/lib/i18n';
import { getLanguage } from '@/lib/language';
import Link from 'next/link';

export default async function VehiclesPage() {
  const session = await getSession();
  const lang = await getLanguage();
  const t = getT(lang);
  const db = getDb();
  const vehicles = db
    .prepare('SELECT * FROM vehicles WHERE user_id = ? ORDER BY created_at DESC')
    .all(session!.userId) as Vehicle[];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('myVehicles')}</h1>
        <Link
          href="/vehicles/new"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {t('addVehicle')}
        </Link>
      </div>

      {vehicles.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg mb-2">{t('noVehicles')}</p>
          <p className="text-sm">{t('noVehiclesDesc')}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {vehicles.map(v => (
            <Link
              key={v.id}
              href={`/vehicles/${v.id}`}
              className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-blue-400 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900 text-lg">{v.name}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {v.type === 'car' ? t('car') : t('motorcycle')} &middot; {v.fuel_type}
                  </p>
                </div>
                <span className="text-2xl">{v.type === 'car' ? '🚗' : '🏍️'}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
