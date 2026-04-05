'use client';

import { useState } from 'react';
import { Fueling, Expense } from '@/lib/types';
import FuelingTable from './FuelingTable';
import ExpenseTable from './ExpenseTable';
import { useTranslation } from './LanguageProvider';

interface Props {
  fuelings: Fueling[];
  expenses: Expense[];
  vehicleId: number;
  noFuelingsText: string;
  noFuelingsDescText: string;
}

export default function VehicleTabs({ fuelings, expenses, vehicleId, noFuelingsText, noFuelingsDescText }: Props) {
  const [active, setActive] = useState<'fuelings' | 'expenses'>('fuelings');
  const { t } = useTranslation();

  const tabs = [
    { key: 'fuelings' as const, label: t('fuelingsCount'), count: fuelings.length },
    { key: 'expenses' as const, label: t('otherExpenses'), count: expenses.length },
  ];

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200 mb-4">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors relative -mb-px ${
              active === tab.key
                ? 'text-blue-600 border border-b-white border-gray-200 bg-white'
                : 'text-gray-500 hover:text-gray-700 border border-transparent'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                active === tab.key ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {active === 'fuelings' && (
        fuelings.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg mb-2">{noFuelingsText}</p>
            <p className="text-sm">{noFuelingsDescText}</p>
          </div>
        ) : (
          <FuelingTable fuelings={fuelings} vehicleId={vehicleId} />
        )
      )}

      {active === 'expenses' && (
        <ExpenseTable expenses={expenses} vehicleId={vehicleId} />
      )}
    </div>
  );
}
