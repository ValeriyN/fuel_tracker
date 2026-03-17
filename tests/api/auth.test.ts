import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { NextRequest } from 'next/server';
import { createTestDb, seedUser } from '../helpers/testDb';
import type Database from 'better-sqlite3';

let testDb: Database.Database;

vi.mock('@/lib/db', () => ({ default: () => testDb }));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('$hashed'),
    compare: vi.fn(),
  },
}));

vi.mock('@/lib/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth')>();
  return {
    ...actual,
    signToken: vi.fn().mockResolvedValue('mock.jwt.token'),
    getSession: vi.fn(),
  };
});

// Loaded after mocks are hoisted
let register: (req: NextRequest) => Promise<Response>;
let login: (req: NextRequest) => Promise<Response>;
let logout: () => Promise<Response>;

beforeAll(async () => {
  register = (await import('../../app/(auth)/api/auth/register/route')).POST;
  login = (await import('../../app/(auth)/api/auth/login/route')).POST;
  logout = (await import('../../app/(auth)/api/auth/logout/route')).POST;
});

import bcrypt from 'bcryptjs';

function makeRequest(body: object) {
  return new NextRequest('http://localhost/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    testDb = createTestDb();
    vi.clearAllMocks();
    vi.mocked(bcrypt.hash).mockResolvedValue('$hashed' as never);
  });

  it('creates a user and sets session cookie on success', async () => {
    const res = await register(makeRequest({ username: 'alice', password: 'secret123' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(res.cookies.get('session')?.value).toBe('mock.jwt.token');

    const user = testDb.prepare('SELECT * FROM users WHERE username = ?').get('alice');
    expect(user).toBeTruthy();
  });

  it('returns 400 for missing fields', async () => {
    const res = await register(makeRequest({ username: '', password: '' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for username shorter than 3 chars', async () => {
    const res = await register(makeRequest({ username: 'ab', password: 'secret123' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for password shorter than 6 chars', async () => {
    const res = await register(makeRequest({ username: 'alice', password: '123' }));
    expect(res.status).toBe(400);
  });

  it('returns 409 for duplicate username', async () => {
    seedUser(testDb, 'alice');
    const res = await register(makeRequest({ username: 'alice', password: 'secret123' }));
    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    testDb = createTestDb();
    vi.clearAllMocks();
  });

  it('returns 200 and sets cookie on correct credentials', async () => {
    seedUser(testDb, 'alice', '$hashed');
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const res = await login(makeRequest({ username: 'alice', password: 'secret123' }));
    expect(res.status).toBe(200);
    expect(res.cookies.get('session')?.value).toBe('mock.jwt.token');
  });

  it('returns 401 on wrong password', async () => {
    seedUser(testDb, 'alice', '$hashed');
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    const res = await login(makeRequest({ username: 'alice', password: 'wrong' }));
    expect(res.status).toBe(401);
  });

  it('returns 401 for non-existent user', async () => {
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
    const res = await login(makeRequest({ username: 'nobody', password: 'secret' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 for missing fields', async () => {
    const res = await login(makeRequest({ username: '', password: '' }));
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/logout', () => {
  it('clears the session cookie', async () => {
    const res = await logout();
    expect(res.status).toBe(200);
    const cookie = res.cookies.get('session');
    expect(cookie?.value).toBe('');
  });
});
