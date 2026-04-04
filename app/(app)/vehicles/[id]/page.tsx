import { getSession } from '@/lib/auth';
import getDb from '@/lib/db';
import { Vehicle, Fueling, DbFueling, UserSettings } from '@/lib/types';
import { getT } from '@/lib/i18n';
import { getLanguage } from '@/lib/language';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import FuelingTable from '@/components/FuelingTable';
import AddFuelingModal from '@/components/AddFuelingModal';
import EditVehicleModal from '@/components/EditVehicleModal';
import ImportFuelingsModal from '@/components/ImportFuelingsModal';
import FuelChart from '@/components/FuelChart';
import { Card, CardContent } from '@/components/ui/card';
import { UserUnits, DEFAULT_UNITS, Currency, MileageUnit, FuelUnit, currencySymbol, consumptionLabel } from '@/lib/units';
import { Fuel, Gauge, Wallet, Droplets, TrendingUp, ArrowLeft } from 'lucide-react';

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

  const settingsRow = db
    .prepare('SELECT * FROM user_settings WHERE user_id = ?')
    .get(session!.userId) as UserSettings | undefined;
  const units: UserUnits = settingsRow
    ? { currency: settingsRow.currency as Currency, mileage: settingsRow.mileage_unit as MileageUnit, fuel: settingsRow.fuel_unit as FuelUnit }
    : DEFAULT_UNITS;
  const sym = currencySymbol(units.currency);
  const consLabel = consumptionLabel(units.mileage, units.fuel);

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
        <Link href="/vehicles" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-primary transition-colors text-sm font-medium group">
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          {t('backToVehicles')}
        </Link>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 mt-2 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{vehicle.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {vehicle.type === 'car' ? t('car') : t('motorcycle')} &middot; {vehicle.fuel_type}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <EditVehicleModal vehicle={vehicle} />
          <ImportFuelingsModal vehicleId={vehicle.id} />
          <AddFuelingModal vehicleId={vehicle.id} />
        </div>
      </div>

      {fuelings.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
            {[
              { label: t('fuelingsCount'), value: fuelings.length, unit: '', icon: Fuel },
              { label: t('maxMileage'), value: totalMileage.toLocaleString(), unit: units.mileage, icon: Gauge },
              ...(avgConsumption != null ? [{ label: t('avgConsumption'), value: avgConsumption.toFixed(2), unit: consLabel, icon: TrendingUp }] : []),
              { label: t('totalFuel'), value: totalLiters.toFixed(1), unit: units.fuel, icon: Droplets },
              { label: t('totalSpent'), value: totalCost.toFixed(2), unit: sym, icon: Wallet },
            ].map(({ label, value, unit, icon: Icon }) => (
              <Card key={label}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
                    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{value}<span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span></p>
                </CardContent>
              </Card>
            ))}
          </div>

          {fuelings.length >= 2 && (
            <Card className="mb-6">
              <CardContent className="p-4 pt-5">
                <p className="text-sm font-medium text-gray-700 mb-4">Cumulative cost & fueled volume</p>
                <FuelChart fuelings={fuelings} currencySymbol={sym} fuelUnit={units.fuel} />
              </CardContent>
            </Card>
          )}
        </>
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
