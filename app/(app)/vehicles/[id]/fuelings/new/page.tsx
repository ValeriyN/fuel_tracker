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
        <Link href={`/vehicles/${vehicle.id}`} className="inline-flex items-center gap-1.5 text-gray-500 hover:text-blue-600 transition-colors text-sm font-medium group">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {vehicle.name}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{t('addFuelingTitle')}</h1>
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <FuelingForm vehicleId={vehicle.id} />
      </div>
    </div>
  );
}
