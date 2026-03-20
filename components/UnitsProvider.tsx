'use client';

import { createContext, useContext } from 'react';
import { UserUnits, DEFAULT_UNITS } from '@/lib/units';

const UnitsContext = createContext<UserUnits>(DEFAULT_UNITS);

export function UnitsProvider({ initial, children }: { initial: UserUnits; children: React.ReactNode }) {
  return <UnitsContext.Provider value={initial}>{children}</UnitsContext.Provider>;
}

export function useUnits(): UserUnits {
  return useContext(UnitsContext);
}
