/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Nav from '@/components/Nav';
import { LanguageProvider } from '@/components/LanguageProvider';

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

function renderNav(lang: 'en' | 'uk' = 'en') {
  return render(
    <LanguageProvider initialLang={lang}>
      <Nav username="alice" />
    </LanguageProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', vi.fn());
});

describe('Nav', () => {
  it('renders the app name and username', () => {
    renderNav();
    expect(screen.getByText('Fuel Tracker')).toBeInTheDocument();
    expect(screen.getByText('alice')).toBeInTheDocument();
  });

  it('renders EN and UK language buttons', () => {
    renderNav();
    expect(screen.getByRole('button', { name: 'EN' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'UK' })).toBeInTheDocument();
  });

  it('renders "Sign out" in English after opening dropdown', async () => {
    const user = userEvent.setup();
    renderNav('en');
    await user.click(screen.getByRole('button', { name: /alice/i }));
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
  });

  it('renders "Вийти" when language is Ukrainian after opening dropdown', async () => {
    const user = userEvent.setup();
    renderNav('uk');
    await user.click(screen.getByRole('button', { name: /alice/i }));
    expect(screen.getByRole('button', { name: 'Вийти' })).toBeInTheDocument();
  });

  it('switches UI language when UK button is clicked', async () => {
    const user = userEvent.setup();
    renderNav('en');

    await user.click(screen.getByRole('button', { name: 'UK' }));

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('calls logout API and redirects on sign out', async () => {
    const user = userEvent.setup();
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response);

    renderNav();
    await user.click(screen.getByRole('button', { name: /alice/i }));
    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/logout',
        expect.objectContaining({ method: 'POST' })
      );
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });
});
