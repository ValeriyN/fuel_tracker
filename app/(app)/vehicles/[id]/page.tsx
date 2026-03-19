import { getSession } from '@/lib/auth';
import getDb from '@/lib/db';
import { Vehicle, Fueling, DbFueling } from '@/lib/types';
import { getT } from '@/lib/i18n';
import { getLanguage } from '@/lib/language';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import FuelingTable from '@/components/FuelingTable';
import AddFuelingModal from '@/components/AddFuelingModal';
import EditVehicleModal from '@/components/EditVehicleModal';

export default async function VehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const lang = await getLanguage();
  const t = getT(lang);
  const db = getDb();

  const vehicle = db
    .prepare('SELECT * FROM vehicles WHERE id = ? AND user_id = ?')
    .get(Number(id), session!.userId) as Vehicle | undefined;

  if (!vehicle) notFound();

  const fuelings: Fueling[] = (db
    .prepare('SELECT * FROM fuelings WHERE vehicle_id = ? ORDER BY date DESC, time DESC')
    .all(vehicle.id) as DbFueling[])
    .map(f => ({ ...f, full_tank: Boolean(f.full_tank) }));

  const totalLiters = fuelings.reduce((s, f) => s + f.fuel_amount_l, 0);
  const totalCost = fuelings.reduce((s, f) => s + f.total_cost_eur, 0);
  const totalMileage = fuelings.length >= 2
    ? fuelings[0].mileage_km - fuelings[fuelings.length - 1].mileage_km
    : 0;
  const distanceKm = totalMileage;
  const avgConsumption = distanceKm > 0 ? (totalLiters / distanceKm) * 100 : null;

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <Link href="/vehicles" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-blue-600 transition-colors text-sm font-medium group">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t('backToVehicles')}
        </Link>
      </div>
      <div className="flex items-center justify-between mb-6 mt-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{vehicle.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {vehicle.type === 'car' ? t('car') : t('motorcycle')} &middot; {vehicle.fuel_type}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <EditVehicleModal vehicle={vehicle} />
          <AddFuelingModal vehicleId={vehicle.id} />
        </div>
      </div>

      {fuelings.length > 0 && (
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{t('fuelingsCount')}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{fuelings.length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{t('maxMileage')}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalMileage} km</p>
          </div>
          {avgConsumption != null && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{t('avgConsumption')}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{avgConsumption.toFixed(2)} L/100km</p>
            </div>
          )}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{t('totalFuel')}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalLiters.toFixed(1)} L</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{t('totalSpent')}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalCost.toFixed(2)} €</p>
          </div>
        </div>
      )}

      {fuelings.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg mb-2">{t('noFuelings')}</p>
          <p className="text-sm">{t('noFuelingsDesc')}</p>
        </div>
      ) : (
        <FuelingTable fuelings={fuelings} vehicleId={vehicle.id} />
      )}
    </div>
  );
}
