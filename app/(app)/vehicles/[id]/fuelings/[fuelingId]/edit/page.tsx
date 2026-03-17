import { getSession } from '@/lib/auth';
import getDb from '@/lib/db';
import { Vehicle, Fueling, DbFueling } from '@/lib/types';
import { getT } from '@/lib/i18n';
import { getLanguage } from '@/lib/language';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import FuelingForm from '@/components/FuelingForm';

export default async function EditFuelingPage({
  params,
}: {
  params: Promise<{ id: string; fuelingId: string }>;
}) {
  const { id, fuelingId } = await params;
  const session = await getSession();
  const lang = await getLanguage();
  const t = getT(lang);
  const db = getDb();

  const vehicle = db
    .prepare('SELECT * FROM vehicles WHERE id = ? AND user_id = ?')
    .get(Number(id), session!.userId) as Vehicle | undefined;

  if (!vehicle) notFound();

  const rawFueling = db
    .prepare('SELECT * FROM fuelings WHERE id = ? AND vehicle_id = ?')
    .get(Number(fuelingId), vehicle.id) as DbFueling | undefined;

  if (!rawFueling) notFound();

  const fueling: Fueling = { ...rawFueling, full_tank: Boolean(rawFueling.full_tank) };

  return (
    <div className="max-w-md">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/vehicles/${vehicle.id}`} className="text-gray-400 hover:text-gray-600 transition-colors text-sm">
          ← {vehicle.name}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{t('editFueling')}</h1>
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <FuelingForm vehicleId={vehicle.id} initial={fueling} />
      </div>
    </div>
  );
}
