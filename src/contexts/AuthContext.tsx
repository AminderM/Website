import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  SignupData,
  LoginData,
  AuthContextType,
  AuthResponse,
  OtpSignupResponse,
} from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

  // Shared: store token + user after any successful auth
  const handleAuthSuccess = (authData: AuthResponse) => {
    localStorage.setItem('access_token', authData.access_token);
    setToken(authData.access_token);
    setUser(authData.user);
    setPendingEmail(null);
    setError(null);
  };

  // Shared: parse error body safely
  const parseError = async (response: Response, fallback: string): Promise<string> => {
    try {
      const ct = response.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const body = await response.json();
        return body.detail || body.error || body.message || fallback;
      }
    } catch {}
    return fallback;
  };

  // Auto-login from localStorage on app load
  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    if (storedToken) {
      setToken(storedToken);
      verifyTokenFn(storedToken);
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verifyTokenFn = async (tok: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` },
      });
      if (!response.ok) throw new Error('Token verification failed');
      const userData = await response.json();
      setUser(userData);
      setError(null);
    } catch {
      localStorage.removeItem('access_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: SignupData): Promise<{ needsVerification: boolean; email: string }> => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const msg = await parseError(response, 'Signup failed');
        throw new Error(msg);
      }

      await response.json() as OtpSignupResponse;
      setPendingEmail(data.email);
      return { needsVerification: true, email: data.email };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (email: string, otp: string): Promise<void> => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp_code: otp }),
      });

      if (!response.ok) {
        const msg = await parseError(response, 'Verification failed');
        throw new Error(msg);
      }

      const authData: AuthResponse = await response.json();
      handleAuthSuccess(authData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Verification failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resendOtp = async (email: string): Promise<void> => {
    const response = await fetch(`${BACKEND_URL}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!response.ok) {
      const msg = await parseError(response, 'Failed to resend code');
      throw new Error(msg);
    }
  };

  const login = async (data: LoginData): Promise<void> => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const msg = await parseError(response, 'Login failed');
        throw new Error(msg);
      }

      const authData: AuthResponse = await response.json();
      if (authData.registration_status && authData.registration_status !== 'verified') {
        throw new Error('Please verify your email before logging in.');
      }
      handleAuthSuccess(authData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = async (idToken: string): Promise<void> => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token: idToken }),
      });
      if (!response.ok) {
        const msg = await parseError(response, 'Google sign-in failed');
        throw new Error(msg);
      }
      const authData: AuthResponse = await response.json();
      handleAuthSuccess(authData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const appleLogin = async (idToken: string, fullName?: string): Promise<void> => {
    setError(null);
    setIsLoading(true);
    try {
      const body: Record<string, string> = { id_token: idToken };
      if (fullName) body.full_name = fullName;
      const response = await fetch(`${BACKEND_URL}/api/auth/apple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const msg = await parseError(response, 'Apple sign-in failed');
        throw new Error(msg);
      }
      const authData: AuthResponse = await response.json();
      handleAuthSuccess(authData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Apple sign-in failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setToken(null);
    setUser(null);
    setError(null);
    setPendingEmail(null);
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    error,
    isAuthenticated: !!user && !!token,
    pendingEmail,
    signup,
    login,
    logout,
    verifyOtp,
    resendOtp,
    googleLogin,
    appleLogin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
