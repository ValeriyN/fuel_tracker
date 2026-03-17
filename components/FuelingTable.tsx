'use client';

import { Fueling } from '@/lib/types';
import Link from 'next/link';
import { useTranslation } from './LanguageProvider';

interface Props {
  fuelings: Fueling[];
  vehicleId: number;
}

export default function FuelingTable({ fuelings, vehicleId }: Props) {
  const { t } = useTranslation();

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-left">
              <th className="px-4 py-3 font-medium text-gray-500 whitespace-nowrap">{t('dateTime')}</th>
              <th className="px-4 py-3 font-medium text-gray-500 whitespace-nowrap">{t('station')}</th>
              <th className="px-4 py-3 font-medium text-gray-500 whitespace-nowrap text-right">{t('mileageKm')}</th>
              <th className="px-4 py-3 font-medium text-gray-500 whitespace-nowrap text-right">{t('amountL')}</th>
              <th className="px-4 py-3 font-medium text-gray-500 whitespace-nowrap text-right">{t('pricePerL')}</th>
              <th className="px-4 py-3 font-medium text-gray-500 whitespace-nowrap text-right">{t('totalEur')}</th>
              <th className="px-4 py-3 font-medium text-gray-500 text-center">{t('full')}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {fuelings.map(f => (
              <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-900 whitespace-nowrap">
                  {f.date} {f.time}
                </td>
                <td className="px-4 py-3 text-gray-700">{f.station_name || <span className="text-gray-400">—</span>}</td>
                <td className="px-4 py-3 text-right text-gray-900 font-mono">{f.mileage_km.toLocaleString('de-DE')}</td>
                <td className="px-4 py-3 text-right text-gray-900 font-mono">{f.fuel_amount_l.toFixed(2)}</td>
                <td className="px-4 py-3 text-right text-gray-900 font-mono">{f.price_per_liter_eur.toFixed(3)}</td>
                <td className="px-4 py-3 text-right text-gray-900 font-mono font-medium">{f.total_cost_eur.toFixed(2)}</td>
                <td className="px-4 py-3 text-center">{f.full_tank ? '✓' : ''}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/vehicles/${vehicleId}/fuelings/${f.id}/edit`}
                    className="text-blue-600 hover:underline text-xs"
                  >
                    {t('edit')}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
