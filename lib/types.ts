export interface User {
  id: number;
  username: string;
  created_at: string;
}

export interface Vehicle {
  id: number;
  user_id: number;
  name: string;
  type: 'car' | 'motorcycle';
  fuel_type: string;
  created_at: string;
}

export interface Fueling {
  id: number;
  vehicle_id: number;
  date: string;
  time: string;
  station_name: string;
  fuel_amount_l: number;
  mileage_km: number;
  price_per_liter_eur: number;
  total_cost_eur: number;
  full_tank: boolean;
  invoice_image?: string | null;
  created_at: string;
}

export interface DbFueling extends Omit<Fueling, 'full_tank'> {
  full_tank: number;
}

export interface SessionPayload {
  userId: number;
  username: string;
}

export interface UserSettings {
  user_id: number;
  currency: string;
  mileage_unit: string;
  fuel_unit: string;
}
