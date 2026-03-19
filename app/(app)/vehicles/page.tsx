import { getSession } from '@/lib/auth';
import getDb from '@/lib/db';
import { Vehicle } from '@/lib/types';
import { getT } from '@/lib/i18n';
import { getLanguage } from '@/lib/language';
import Link from 'next/link';
import AddVehicleModal from '@/components/AddVehicleModal';

interface VehicleStats {
  vehicle_id: number;
  count: number;
  total_mileage: number | null;
  total_cost: number | null;
}

export default async function VehiclesPage() {
  const session = await getSession();
  const lang = await getLanguage();
  const t = getT(lang);
  const db = getDb();
  const vehicles = db
    .prepare('SELECT * FROM vehicles WHERE user_id = ? ORDER BY created_at DESC')
    .all(session!.userId) as Vehicle[];

  const statsRows = db
    .prepare(`
      SELECT vehicle_id, COUNT(*) as count, (MAX(mileage_km) - MIN(mileage_km)) as total_mileage, SUM(total_cost_eur) as total_cost
      FROM fuelings
      WHERE vehicle_id IN (SELECT id FROM vehicles WHERE user_id = ?)
      GROUP BY vehicle_id
    `)
    .all(session!.userId) as VehicleStats[];

  const statsMap = new Map(statsRows.map(s => [s.vehicle_id, s]));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('myVehicles')}</h1>
        <AddVehicleModal />
      </div>

      {vehicles.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg mb-2">{t('noVehicles')}</p>
          <p className="text-sm">{t('noVehiclesDesc')}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {vehicles.map(v => {
            const s = statsMap.get(v.id);
            return (
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
                {s && (
                  <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-xs text-gray-400">{t('fuelingsCount')}</p>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5">{s.count}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">{t('maxMileage')}</p>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5">{s.total_mileage?.toLocaleString()} km</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">{t('totalSpent')}</p>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5">{s.total_cost?.toFixed(2)} €</p>
                    </div>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
