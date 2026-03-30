export interface User {
  id: string;
  email: string;
  name?: string;
  full_name?: string;
  auth_provider?: string;
  email_verified?: boolean;
  tier?: 'free' | 'paid';
  created_at?: string;
  registration_status?: string;
  allowed_workspaces?: string[];
}

export interface SignupData {
  email: string;
  password: string;
  full_name?: string;
  phone?: string;
}

export interface OtpSignupResponse {
  message: string;
  user_id: string;
  status: 'otp_sent';
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type?: string;
  user: User;
  registration_status?: string;
  allowed_workspaces?: string[];
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  token: string | null;
  isAuthenticated: boolean;
  pendingEmail: string | null;
  signup: (data: SignupData) => Promise<{ needsVerification: boolean; email: string }>;
  login: (data: LoginData) => Promise<void>;
  logout: () => void;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  resendOtp: (email: string) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  appleLogin: (idToken: string, fullName?: string) => Promise<void>;
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
