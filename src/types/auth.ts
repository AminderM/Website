export interface User {
  id: string;
  email: string;
  name?: string;
  tier?: 'free' | 'paid';
  created_at?: string;
}

export interface SignupData {
  email: string;
  password: string;
  name?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  token: string | null;
  isAuthenticated: boolean;
  signup: (data: SignupData) => Promise<void>;
  login: (data: LoginData) => Promise<void>;
  logout: () => void;
}

export interface BOL {
  id: string;
  bolNumber: string;
  date: string;
  shipper: BOLParty;
  consignee: BOLParty;
  carrier: CarrierInfo;
  commodities: Commodity[];
  totalWeight: string;
  weightUnit: string;
  freightTerms: string;
  declaredValue: string;
  specialServices: SpecialServices;
  specialInstructions: string;
  logoUrl?: string;
  created_at: string;
  updated_at?: string;
}

export interface BOLParty {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  contact: string;
  phone: string;
}

export interface CarrierInfo {
  name: string;
  mcDot: string;
  driverName: string;
  truckNum: string;
  trailerNum: string;
}

export interface Commodity {
  description: string;
  qty: string;
  weight: string;
  class: string;
}

export interface SpecialServices {
  hazmat: boolean;
  liftgate: boolean;
  appointment: boolean;
  tempControlled: boolean;
  insideDelivery: boolean;
  residential: boolean;
}
