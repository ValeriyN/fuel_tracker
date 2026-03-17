import { describe, it, expect } from 'vitest';
import { signToken, verifyToken } from '@/lib/auth';

describe('signToken / verifyToken', () => {
  it('signToken returns a non-empty string', async () => {
    const token = await signToken({ userId: 1, username: 'alice' });
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  it('verifyToken returns the original payload for a valid token', async () => {
    const payload = { userId: 42, username: 'bob' };
    const token = await signToken(payload);
    const result = await verifyToken(token);
    expect(result).toEqual(payload);
  });

  it('verifyToken returns null for a tampered token', async () => {
    const token = await signToken({ userId: 1, username: 'alice' });
    const result = await verifyToken(token + 'tampered');
    expect(result).toBeNull();
  });

  it('verifyToken returns null for a random string', async () => {
    const result = await verifyToken('not.a.jwt');
    expect(result).toBeNull();
  });

  it('verifyToken returns null for an empty string', async () => {
    const result = await verifyToken('');
    expect(result).toBeNull();
  });
});
