'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DatePicker, { registerLocale } from 'react-datepicker';
import { IMaskInput, IMask } from 'react-imask';
import { enGB } from 'date-fns/locale/en-GB';
import { uk } from 'date-fns/locale/uk';
import 'react-datepicker/dist/react-datepicker.css';
import { Fueling } from '@/lib/types';
import { useTranslation } from './LanguageProvider';
import { useUnits } from './UnitsProvider';
import { currencySymbol } from '@/lib/units';

registerLocale('en', enGB);
registerLocale('uk', uk);

interface Props {
  vehicleId: number;
  initial?: Fueling;
  onSuccess?: () => void;
}

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function dateToIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function FuelingForm({ vehicleId, initial, onSuccess }: Props) {
  const router = useRouter();
  const { t, lang } = useTranslation();
  const units = useUnits();
  const sym = currencySymbol(units.currency);
  const isEdit = !!initial;

  const [date, setDate] = useState<Date>(initial?.date ? parseIsoDate(initial.date) : new Date());
  const [time, setTime] = useState(initial?.time ?? nowTime());
  const [station, setStation] = useState(initial?.station_name ?? '');
  const [amount, setAmount] = useState(initial?.fuel_amount_l?.toString() ?? '');
  const [mileage, setMileage] = useState(initial?.mileage_km?.toString() ?? '');
  const [totalCost, setTotalCost] = useState(initial?.total_cost_eur?.toString() ?? '');
  const [fullTank, setFullTank] = useState(initial?.full_tank ?? true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const computedPricePerL =
    amount && totalCost && parseFloat(amount) > 0
      ? (parseFloat(totalCost) / parseFloat(amount)).toFixed(2)
      : '—';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const url = isEdit
      ? `/api/vehicles/${vehicleId}/fuelings/${initial!.id}`
      : `/api/vehicles/${vehicleId}/fuelings`;

    const res = await fetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: dateToIso(date),
        time,
        station_name: station,
        fuel_amount_l: parseFloat(amount),
        mileage_km: parseInt(mileage),
        price_per_liter_eur: computedPricePerL !== '—' ? parseFloat(computedPricePerL) : 0,
        total_cost_eur: parseFloat(totalCost),
        full_tank: fullTank,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || t('failedSave'));
      return;
    }

    if (onSuccess) {
      onSuccess();
    } else {
      router.push(`/vehicles/${vehicleId}`);
      router.refresh();
    }
  }

  async function handleDelete() {
    setLoading(true);
    await fetch(`/api/vehicles/${vehicleId}/fuelings/${initial!.id}`, { method: 'DELETE' });
    if (onSuccess) {
      onSuccess();
    } else {
      router.push(`/vehicles/${vehicleId}`);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="fueling-date" className="block text-sm font-medium text-gray-700 mb-1">{t('date')}</label>
          <DatePicker
            id="fueling-date"
            selected={date}
            onChange={d => d && setDate(d)}
            dateFormat="dd.MM.yyyy"
            locale={lang}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="fueling-time" className="block text-sm font-medium text-gray-700 mb-1">{t('time')}</label>
          <IMaskInput
            id="fueling-time"
            mask="HH:mm"
            blocks={{
              HH: { mask: IMask.MaskedRange, from: 0, to: 23, maxLength: 2 },
              mm: { mask: IMask.MaskedRange, from: 0, to: 59, maxLength: 2 },
            }}
            value={time}
            onAccept={(v: string) => setTime(v)}
            placeholder="HH:mm"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="fueling-station" className="block text-sm font-medium text-gray-700 mb-1">{t('fuelStation')}</label>
        <input
          id="fueling-station"
          type="text"
          value={station}
          onChange={e => setStation(e.target.value)}
          placeholder={t('stationPlaceholder')}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="fueling-mileage" className="block text-sm font-medium text-gray-700 mb-1">{t('mileageKm')} ({units.mileage})</label>
        <input
          id="fueling-mileage"
          type="number"
          value={mileage}
          onChange={e => setMileage(e.target.value)}
          required
          min={0}
          step={1}
          placeholder={t('mileagePlaceholder')}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="fueling-amount" className="block text-sm font-medium text-gray-700 mb-1">{t('amountL')} ({units.fuel})</label>
          <input
            id="fueling-amount"
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            required
            min={0}
            step={0.01}
            placeholder={t('amountPlaceholder')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="fueling-total" className="block text-sm font-medium text-gray-700 mb-1">{t('totalCost')} ({sym})</label>
          <input
            id="fueling-total"
            type="number"
            value={totalCost}
            onChange={e => setTotalCost(e.target.value)}
            required
            min={0}
            step={0.01}
            placeholder="e.g. 63.00"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl px-4 py-3 flex justify-between items-center">
        <span className="text-sm text-gray-600">{t('pricePerLitre')} ({sym}/{units.fuel})</span>
        <span className="text-lg font-semibold text-gray-900">
          {computedPricePerL !== '—' ? `${computedPricePerL} ${sym}` : '—'}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <input
          id="full_tank"
          type="checkbox"
          checked={fullTank}
          onChange={e => setFullTank(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="full_tank" className="text-sm font-medium text-gray-700">{t('fullTank')}</label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors"
        >
          {loading ? t('saving') : isEdit ? t('saveChanges') : t('addFuelingTitle')}
        </button>
        {isEdit && !confirmingDelete && (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            disabled={loading}
            className="px-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg py-2 text-sm font-medium transition-colors"
          >
            {t('delete')}
          </button>
        )}
      </div>

      {isEdit && confirmingDelete && (
        <div className="border border-red-200 bg-red-50 rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-red-700">{t('confirmDelete')}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors"
            >
              {t('delete')}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
