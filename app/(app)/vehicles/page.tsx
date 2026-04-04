import { getSession } from '@/lib/auth';
import getDb from '@/lib/db';
import { Vehicle } from '@/lib/types';
import { getT } from '@/lib/i18n';
import { getLanguage } from '@/lib/language';
import Link from 'next/link';
import AddVehicleModal from '@/components/AddVehicleModal';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, Bike, Fuel, Gauge, Wallet } from 'lucide-react';

interface VehicleStats {
  vehicle_id: number;
  total_volume: number | null;
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
      SELECT vehicle_id, SUM(fuel_amount_l) as total_volume, (MAX(mileage_km) - MIN(mileage_km)) as total_mileage, SUM(total_cost_eur) as total_cost
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
            const VehicleIcon = v.type === 'car' ? Car : Bike;
            return (
              <Link key={v.id} href={`/vehicles/${v.id}`} className="group block">
                <Card className="h-full transition-all group-hover:border-primary/50 group-hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="font-semibold text-gray-900 text-lg leading-tight">{v.name}</h2>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge variant="secondary" className="text-xs">
                            {v.type === 'car' ? t('car') : t('motorcycle')}
                          </Badge>
                          <Badge variant="outline" className="text-xs">{v.fuel_type}</Badge>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <VehicleIcon className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                    {s && (
                      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-1.5">
                          <Fuel className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-400">{t('totalFuel')}</p>
                            <p className="text-sm font-semibold text-gray-800">{s.total_volume?.toFixed(1)} L</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Gauge className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-400">{t('maxMileage')}</p>
                            <p className="text-sm font-semibold text-gray-800">{s.total_mileage?.toLocaleString()} km</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Wallet className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-400">{t('totalSpent')}</p>
                            <p className="text-sm font-semibold text-gray-800">{s.total_cost?.toFixed(2)} €</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
