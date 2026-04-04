'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Fueling } from '@/lib/types';

interface Props {
  fuelings: Fueling[];
  currencySymbol: string;
  fuelUnit: string;
}

export default function FuelChart({ fuelings, currencySymbol, fuelUnit }: Props) {
  // Oldest first, accumulate cost and volume
  let cumCost = 0;
  let cumVolume = 0;
  const data = [...fuelings].reverse().map(f => {
    cumCost += f.total_cost_eur;
    cumVolume += f.fuel_amount_l;
    return {
      date: f.date.slice(5), // MM-DD
      cost: parseFloat(cumCost.toFixed(2)),
      volume: parseFloat(cumVolume.toFixed(1)),
    };
  });

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.25} />
            <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-chart-2)" stopOpacity={0.25} />
            <stop offset="95%" stopColor="var(--color-chart-2)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={52}
          tickFormatter={v => `${v}${currencySymbol}`} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={48}
          tickFormatter={v => `${v}${fuelUnit}`} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
          formatter={(value, name) =>
            name === 'cost'
              ? [`${value} ${currencySymbol}`, `Total spent`]
              : [`${value} ${fuelUnit}`, `Total fueled`]
          }
        />
        <Legend wrapperStyle={{ fontSize: 12 }}
          formatter={name => name === 'cost' ? `Cumulative cost (${currencySymbol})` : `Cumulative volume (${fuelUnit})`} />
        <Area yAxisId="left" type="monotone" dataKey="cost" stroke="var(--color-chart-1)"
          strokeWidth={2} fill="url(#colorCost)" dot={false} activeDot={{ r: 4 }} />
        <Area yAxisId="right" type="monotone" dataKey="volume" stroke="var(--color-chart-2)"
          strokeWidth={2} fill="url(#colorVolume)" dot={false} activeDot={{ r: 4 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
