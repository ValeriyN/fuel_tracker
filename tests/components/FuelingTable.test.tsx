/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FuelingTable from '@/components/FuelingTable';
import { LanguageProvider } from '@/components/LanguageProvider';
import { UnitsProvider } from '@/components/UnitsProvider';
import { DEFAULT_UNITS } from '@/lib/units';
import type { Fueling } from '@/lib/types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const FUELINGS: Fueling[] = [
  {
    id: 1,
    vehicle_id: 10,
    date: '2026-03-17',
    time: '10:30',
    station_name: 'Shell',
    fuel_amount_l: 40.0,
    mileage_km: 125000,
    price_per_liter_eur: 1.659,
    total_cost_eur: 66.36,
    full_tank: true,
    created_at: '2026-03-17T10:30:00',
  },
  {
    id: 2,
    vehicle_id: 10,
    date: '2026-03-10',
    time: '08:00',
    station_name: '',
    fuel_amount_l: 30.5,
    mileage_km: 124200,
    price_per_liter_eur: 1.679,
    total_cost_eur: 51.21,
    full_tank: false,
    created_at: '2026-03-10T08:00:00',
  },
];

function renderTable(fuelings = FUELINGS) {
  return render(
    <LanguageProvider initialLang="en">
      <UnitsProvider initial={DEFAULT_UNITS}>
        <FuelingTable fuelings={fuelings} vehicleId={10} />
      </UnitsProvider>
    </LanguageProvider>
  );
}

describe('FuelingTable', () => {
  it('renders all column headers', () => {
    renderTable();
    expect(screen.getByText('Date & Time')).toBeInTheDocument();
    expect(screen.getByText('Station')).toBeInTheDocument();
    expect(screen.getByText('Mileage (km)')).toBeInTheDocument();
    expect(screen.getByText('Amount (L)')).toBeInTheDocument();
    expect(screen.getByText('Price (€/L)')).toBeInTheDocument();
    expect(screen.getByText('Total (€)')).toBeInTheDocument();

    expect(screen.getByText('Full')).toBeInTheDocument();
  });

  it('renders fueling rows with correct data', () => {
    renderTable();
    expect(screen.getByText('Shell')).toBeInTheDocument();
    expect(screen.getByText('2026-03-17 10:30')).toBeInTheDocument();
    expect(screen.getByText('66.36')).toBeInTheDocument();
  });

  it('shows ✓ for full tank and nothing for partial', () => {
    renderTable();
    const checks = screen.getAllByText('✓');
    expect(checks).toHaveLength(1);
  });

  it('shows — for empty station name', () => {
    renderTable();
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThan(0);
  });

  it('renders Edit button for each row', () => {
    renderTable();
    const editButtons = screen.getAllByRole('button', { name: 'Edit' });
    expect(editButtons).toHaveLength(2);
  });

  it('renders headers in Ukrainian when language is uk', () => {
    render(
      <LanguageProvider initialLang="uk">
        <UnitsProvider initial={DEFAULT_UNITS}>
          <FuelingTable fuelings={FUELINGS} vehicleId={10} />
        </UnitsProvider>
      </LanguageProvider>
    );
    expect(screen.getByText('Дата і час')).toBeInTheDocument();
    expect(screen.getByText('Станція')).toBeInTheDocument();
  });
});
