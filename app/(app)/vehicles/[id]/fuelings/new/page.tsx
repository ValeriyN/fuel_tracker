import { getSession } from '@/lib/auth';
import getDb from '@/lib/db';
import { Vehicle } from '@/lib/types';
import { getT } from '@/lib/i18n';
import { getLanguage } from '@/lib/language';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import FuelingForm from '@/components/FuelingForm';

export default async function NewFuelingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const lang = await getLanguage();
  const t = getT(lang);
  const db = getDb();

  const vehicle = db
    .prepare('SELECT * FROM vehicles WHERE id = ? AND user_id = ?')
    .get(Number(id), session!.userId) as Vehicle | undefined;

  if (!vehicle) notFound();

  return (
    <div className="max-w-md">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/vehicles/${vehicle.id}`} className="text-gray-400 hover:text-gray-600 transition-colors text-sm">
          ← {vehicle.name}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{t('addFuelingTitle')}</h1>
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <FuelingForm vehicleId={vehicle.id} />
      </div>
    </div>
  );
}
