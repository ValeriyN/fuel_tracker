/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FuelingForm from '@/components/FuelingForm';
import { LanguageProvider } from '@/components/LanguageProvider';
import { UnitsProvider } from '@/components/UnitsProvider';
import { DEFAULT_UNITS } from '@/lib/units';
import type { Fueling } from '@/lib/types';

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

const EXISTING_FUELING: Fueling = {
  id: 5,
  vehicle_id: 10,
  date: '2026-03-17',
  time: '10:00',
  station_name: 'BP',
  fuel_amount_l: 35.0,
  mileage_km: 120000,
  price_per_liter_eur: 1.699,
  total_cost_eur: 59.47,
  full_tank: true,
  created_at: '2026-03-17T10:00:00',
};

function renderForm(props?: { initial?: Fueling }) {
  return render(
    <LanguageProvider initialLang="en">
      <UnitsProvider initial={DEFAULT_UNITS}>
        <FuelingForm vehicleId={10} {...props} />
      </UnitsProvider>
    </LanguageProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', vi.fn());
});

describe('FuelingForm — add mode', () => {
  it('renders all required fields', () => {
    renderForm();
    expect(screen.getByLabelText('Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Time')).toBeInTheDocument();
    expect(screen.getByLabelText('Fuel Station')).toBeInTheDocument();
    expect(screen.getByLabelText('Mileage (km)')).toBeInTheDocument();
    expect(screen.getByLabelText('Amount (L)')).toBeInTheDocument();
    expect(screen.getByLabelText('Total cost (€)')).toBeInTheDocument();

    expect(screen.getByLabelText('Full tank')).toBeInTheDocument();
  });

  // Helper to fill required numeric fields
  async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByLabelText('Mileage (km)'), '125000');
    await user.type(screen.getByLabelText('Amount (L)'), '40');
    await user.type(screen.getByLabelText('Total cost (€)'), '66.36');


  }

  it('shows "Add Fueling" submit button', () => {
    renderForm();
    expect(screen.getByRole('button', { name: 'Add Fueling' })).toBeInTheDocument();
  });

  it('does not show Delete button in add mode', () => {
    renderForm();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
  });

  it('computes price per litre as user types amount and total cost', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText('Amount (L)'), '40');
    await user.type(screen.getByLabelText('Total cost (€)'), '66.36');


    // 66.36 / 40 = 1.659 → displayed as 1.66
    await waitFor(() => {
      expect(screen.getByText(/1\.66 €/)).toBeInTheDocument();
    });
  });

  it('POSTs to correct endpoint and navigates on success', async () => {
    const user = userEvent.setup();
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 99 }),
    } as Response);

    renderForm();
    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Add Fueling' }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/vehicles/10/fuelings',
        expect.objectContaining({ method: 'POST' })
      );
      expect(mockPush).toHaveBeenCalledWith('/vehicles/10');
    });
  });

  it('shows error message when API returns error', async () => {
    const user = userEvent.setup();
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Server error' }),
    } as Response);

    renderForm();
    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Add Fueling' }));

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });
});

describe('FuelingForm — edit mode', () => {
  it('shows "Save Changes" and "Delete" buttons', () => {
    renderForm({ initial: EXISTING_FUELING });
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('pre-fills fields with initial values', () => {
    renderForm({ initial: EXISTING_FUELING });
    expect(screen.getByLabelText('Date')).toHaveValue('17.03.2026');
    expect(screen.getByLabelText('Fuel Station')).toHaveValue('BP');
    expect(screen.getByLabelText('Mileage (km)')).toHaveValue(120000);
    expect(screen.getByLabelText('Amount (L)')).toHaveValue(35);

  });

  it('PUTs to correct endpoint on save', async () => {
    const user = userEvent.setup();
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...EXISTING_FUELING }),
    } as Response);

    renderForm({ initial: EXISTING_FUELING });
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/vehicles/10/fuelings/5',
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });

  it('calls DELETE and navigates when delete is confirmed', async () => {
    const user = userEvent.setup();
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response);

    renderForm({ initial: EXISTING_FUELING });
    // First click shows inline confirmation panel
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    // Second click on the confirmation Delete button triggers the actual delete
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/vehicles/10/fuelings/5',
        expect.objectContaining({ method: 'DELETE' })
      );
      expect(mockPush).toHaveBeenCalledWith('/vehicles/10');
    });
  });

  it('does NOT call DELETE when confirm is cancelled', async () => {
    const user = userEvent.setup();

    renderForm({ initial: EXISTING_FUELING });
    // First click shows inline confirmation panel
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    // Click Cancel to dismiss
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('FuelingForm — Ukrainian language', () => {
  it('renders labels in Ukrainian', () => {
    render(
      <LanguageProvider initialLang="uk">
        <UnitsProvider initial={DEFAULT_UNITS}>
          <FuelingForm vehicleId={10} />
        </UnitsProvider>
      </LanguageProvider>
    );
    expect(screen.getByText('Дата')).toBeInTheDocument();
    expect(screen.getByLabelText('Повний бак')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Додати заправку' })).toBeInTheDocument();
  });
});
